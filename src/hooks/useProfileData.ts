import { useState, useCallback, useRef, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { normalizeProfileLinks } from "@/lib/openExternalUrl";
import { API_HOST } from "@/constants/api";
import {
  fetchProfilePosts,
  fetchProfileProducts,
  fetchProfileHighlights,
  fetchTaggedPosts,
  type ProfileCatalogProduct,
} from "@/lib/profileApi";
import { fetchProductCollabs, type ProductCollabProduct } from "@/lib/productCollabApi";
import { filterProfilePosts } from "@/lib/feedSocialFilter";

const PRESET_POSTS: { id: string; url: string; isVideo: boolean }[] = [];

type UseProfileDataOptions = {
  currentUser: any;
  authHydrated: boolean;
  activeProfile: any;
  socialGraph: any;
  socialGraphVersion: number;
};

export function useProfileData({
  currentUser,
  authHydrated,
  activeProfile,
  socialGraph,
  socialGraphVersion,
}: UseProfileDataOptions) {
  const [presetPosts, setPresetPosts] = useState(PRESET_POSTS);
  const [username, setUsername] = useState<string>(activeProfile?.username || "");
  const [logo, setLogo] = useState<string | null>(activeProfile?.logo || null);
  const [editLogo, setEditLogo] = useState<string | null>(activeProfile?.logo || null);
  const [profileName, setProfileName] = useState<string>(activeProfile?.name || "");
  const [category, setCategory] = useState<string>(activeProfile?.category || "");
  const [bioText, setBioText] = useState<string>(activeProfile?.bioText || "");
  const [websiteLink, setWebsiteLink] = useState<string>(
    activeProfile?.websiteLink || activeProfile?.website || ""
  );
  const [tags, setTags] = useState<string[]>(activeProfile?.tags || []);
  const [postsCount, setPostsCount] = useState<number>(activeProfile?.postsCount || 0);
  const [followersCount, setFollowersCount] = useState<number>(activeProfile?.followersCount || 0);
  const [followingCount, setFollowingCount] = useState<number>(activeProfile?.followingCount || 0);
  const [auraScore, setAuraScore] = useState<number>(activeProfile?.auraScore || 0);
  const [editUsername, setEditUsername] = useState<string>(activeProfile?.username || "");
  const [editProfileName, setEditProfileName] = useState<string>(activeProfile?.name || "");
  const [editCategory, setEditCategory] = useState<string>(activeProfile?.category || "");
  const [editBioText, setEditBioText] = useState<string>(activeProfile?.bioText || "");
  const [editWebsiteLink, setEditWebsiteLink] = useState<string>(
    activeProfile?.websiteLink || activeProfile?.website || ""
  );
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [availableMaisons, setAvailableMaisons] = useState<any[]>([]);
  const [profileProducts, setProfileProducts] = useState<ProfileCatalogProduct[]>([]);
  const [productCollabProducts, setProductCollabProducts] = useState<ProductCollabProduct[]>([]);
  const [profileProductsMode, setProfileProductsMode] = useState<"store" | "aggregated" | "empty">("store");
  const [highlights, setHighlights] = useState<{ id: string; title: string; avatar: string }[]>([]);
  const [taggedPosts, setTaggedPosts] = useState(PRESET_POSTS);

  const profileSaveInFlight = useRef(false);
  const mediaUploadInFlight = useRef(false);

  const isPersonalProfile =
    activeProfile?.type === "PERSONAL" ||
    category === "Personal Profile" ||
    category?.toLowerCase().includes("personal");
  const isCreatorProfile =
    category?.toLowerCase().includes("creator") ||
    category?.toLowerCase().includes("stylist") ||
    category?.toLowerCase().includes("influencer") ||
    category?.toLowerCase().includes("artist");
  const isBusinessProfile = !isPersonalProfile && !isCreatorProfile;
  const displayLogo = logo || activeProfile?.logo || currentUser?.avatar || null;

  const visiblePresetPosts = useMemo(() => {
    if (!socialGraph) return presetPosts;
    return filterProfilePosts(presetPosts, socialGraph, true);
  }, [presetPosts, socialGraph, socialGraphVersion]);

  const visibleTaggedPosts = useMemo(() => {
    if (!socialGraph) return taggedPosts;
    return filterProfilePosts(taggedPosts, socialGraph, true);
  }, [taggedPosts, socialGraph, socialGraphVersion]);

  const applyProfilePayload = useCallback((p: any) => {
    if (!p) return;
    setUsername(p.username || "");
    setProfileName(p.profileName || p.name || "");
    setCategory(p.category || "");
    setBioText(p.bioText || "");
    setWebsiteLink(p.websiteLink || p.website || "");
    setTags(p.tags || []);
    setPostsCount(p.postsCount ?? 0);
    setFollowersCount(p.followersCount ?? 0);
    setFollowingCount(p.followingCount ?? 0);
    setAuraScore(p.auraScore ?? p.auragramScore ?? 0);
    setLogo(p.logo || null);
    setEditLogo(p.logo || null);
    setEditUsername(p.username || "");
    setEditProfileName(p.profileName || p.name || "");
    setEditCategory(p.category || "");
    setEditBioText(p.bioText || "");
    setEditWebsiteLink(p.websiteLink || p.website || "");

    useStore.setState((state) => {
      const patch = {
        username: p.username,
        name: p.profileName || p.name,
        category: p.category,
        bioText: p.bioText,
        websiteLink: p.websiteLink || p.website,
        website: p.websiteLink || p.website,
        externalLinks: p.externalLinks || [],
        allLinks: p.allLinks || normalizeProfileLinks(p),
        logo: p.logo,
        postsCount: p.postsCount,
        followersCount: p.followersCount,
        followingCount: p.followingCount,
        tags: p.tags,
      };
      return {
        activeProfile: state.activeProfile
          ? { ...state.activeProfile, ...patch }
          : state.activeProfile,
        userProfiles: state.userProfiles.map((prof) =>
          prof.id === state.activeProfile?.id || prof.username === p.username
            ? { ...prof, ...patch }
            : prof
        ),
      };
    });
    useStore.getState().syncProfileIdentity();
  }, []);

  const loadProfileFromServer = useCallback(async () => {
    if (
      !authHydrated ||
      !currentUser?.id ||
      profileSaveInFlight.current ||
      mediaUploadInFlight.current
    ) {
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await fetch(
        `${API_HOST}/api/mobile/profile?userId=${encodeURIComponent(currentUser.id)}`
      );
      const data = await res.json();
      if (data.success && data.profile) {
        applyProfilePayload(data.profile);
      } else if (!data.success) {
        console.warn("Profile load refused:", data.error || data.message);
      }
      if (data.maisons) {
        setAvailableMaisons(data.maisons);
      }
    } catch (e) {
      console.warn("Could not synchronize profile from database.", e);
    } finally {
      setLoadingProfile(false);
    }
  }, [applyProfilePayload, authHydrated, currentUser?.id]);

  const loadProfilePosts = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const posts = await fetchProfilePosts({
        userId: currentUser.id,
        profileId: activeProfile?.id,
      });
      setPresetPosts(posts);
    } catch (e) {
      console.warn("Could not load profile posts.", e);
    }
  }, [currentUser?.id, activeProfile?.id]);

  const loadProfileProducts = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const { products, mode } = await fetchProfileProducts({
        userId: currentUser.id,
        profileId: activeProfile?.id,
      });
      setProfileProducts(products);
      setProfileProductsMode(mode === "aggregated" ? "aggregated" : products.length ? "store" : "empty");
    } catch (e) {
      console.warn("Could not load profile products.", e);
      setProfileProducts([]);
    }
  }, [currentUser?.id, activeProfile?.id]);

  const loadProductCollabs = useCallback(async () => {
    if (!currentUser?.id || !activeProfile?.id) return;
    try {
      const products = await fetchProductCollabs({
        userId: currentUser.id,
        profileId: activeProfile.id,
        status: "ACCEPTED",
      });
      setProductCollabProducts(products);
    } catch {
      setProductCollabProducts([]);
    }
  }, [currentUser?.id, activeProfile?.id]);

  const loadProfileHighlights = useCallback(async () => {
    if (!activeProfile?.id) return;
    try {
      const list = await fetchProfileHighlights(activeProfile.id);
      setHighlights(list);
    } catch {
      setHighlights([]);
    }
  }, [activeProfile?.id]);

  const loadTaggedPosts = useCallback(async () => {
    if (!activeProfile?.id) return;
    try {
      const posts = await fetchTaggedPosts(activeProfile.id, activeProfile.id);
      setTaggedPosts(posts);
    } catch (e) {
      console.warn("Could not load tagged posts.", e);
      setTaggedPosts([]);
    }
  }, [activeProfile?.id]);

  return {
    presetPosts,
    setPresetPosts,
    username,
    setUsername,
    logo,
    setLogo,
    editLogo,
    setEditLogo,
    profileName,
    setProfileName,
    category,
    setCategory,
    bioText,
    setBioText,
    websiteLink,
    setWebsiteLink,
    tags,
    setTags,
    postsCount,
    setPostsCount,
    followersCount,
    setFollowersCount,
    followingCount,
    setFollowingCount,
    auraScore,
    setAuraScore,
    editUsername,
    setEditUsername,
    editProfileName,
    setEditProfileName,
    editCategory,
    setEditCategory,
    editBioText,
    setEditBioText,
    editWebsiteLink,
    setEditWebsiteLink,
    loadingProfile,
    availableMaisons,
    profileProducts,
    productCollabProducts,
    profileProductsMode,
    highlights,
    setHighlights,
    profileSaveInFlight,
    mediaUploadInFlight,
    isPersonalProfile,
    isCreatorProfile,
    isBusinessProfile,
    displayLogo,
    visiblePresetPosts,
    visibleTaggedPosts,
    applyProfilePayload,
    loadProfileFromServer,
    loadProfilePosts,
    loadProfileProducts,
    loadProductCollabs,
    loadProfileHighlights,
    loadTaggedPosts,
  };
}
