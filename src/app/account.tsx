import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Linking,
  Share,
  Platform,
  InteractionManager,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { openExternalUrl, normalizeProfileLinks } from "@/lib/openExternalUrl";
import { resolveMaisonId } from "@/lib/sessionIdentity";
import { uploadMediaFromUri } from "@/lib/uploadMedia";
import { delayAfterModalClose, pickMediaFromLibrary, type MediaPickMode } from "@/lib/createMediaPicker";
import * as Clipboard from "expo-clipboard";
import * as ImageManipulator from "expo-image-manipulator";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { LiveShowroom } from "@/components/LiveShowroom";
import { synthesizeProductFromPrompt } from "@/lib/aiProduct";
import { uploadAndPublish } from "@/lib/publishContent";
import { formatCompactNumber } from "@/constants/format";
import { ProfileGridEmpty } from "@/components/ProfileGridEmpty";
import { ProfileGridViewer } from "@/components/profile/ProfileGridViewer";
import { CreateBrandProfileSheet } from "@/components/profile/CreateBrandProfileSheet";
import { AddProductSheet, type BrandStoreOption } from "@/components/profile/AddProductSheet";
import { MAX_PROFILES_PER_ACCOUNT } from "@/lib/profileUsername";
import {
  fetchProfileNetwork,
  fetchProfilePosts,
  fetchProfileProducts,
  fetchProfileHighlights,
  createProfileHighlight,
  toggleFollowProfile,
  type NetworkProfile,
  type ProfileCatalogProduct,
} from "@/lib/profileApi";
import { useProfileGridViewer } from "@/lib/profileGridNavigation";

const { width } = Dimensions.get("window");
const GRID_ITEM_SIZE = (width - 2) / 3; // 3 columns with 1px gap

const PRESET_POSTS: { id: string; url: string; isVideo: boolean }[] = [];

export default function AccountScreen() {
  const routeParams = useLocalSearchParams<{ openCreate?: string }>();
  const { 
    products, 
    triggerHaptic, 
    activeMaisonId, 
    setActiveMaisonId, 
    createProduct, 
    fetchProducts,
    syncProfileIdentity,
    patchActiveProfile,
    currentUser,
    authHydrated,
    updateProfile,
    authLogOut,
    addInstaStorySlide,
    loadUserStories,
    instaStories,
    switchActiveProfile,
    fetchProfiles,
    activeProfile,
    userProfiles,
    wishlist,
    fetchWishlist,
    toggleWishlist,
    addToCart,
  } = useStore();
  const personalProfile = userProfiles.find(p => p.type === "PERSONAL") || userProfiles.find(p => p.type !== "BUSINESS") || userProfiles[0];
  const brandProfiles = userProfiles.filter(p => p.type === "BUSINESS");
  
  const insets = useSafeAreaInsets();
  const [presetPosts, setPresetPosts] = useState(PRESET_POSTS);
  const { viewer: gridViewer, openGridItem, closeViewer: closeGridViewer } = useProfileGridViewer();

  // 👥 Personal Details states
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [personalDob, setPersonalDob] = useState("2000-01-01");
  const [personalGender, setPersonalGender] = useState("Prefer Not to Say");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔴 PROFILE EDITABLE STATES (PARITY WITH SCREENSHOT AND EXTENDED TO BE FULLY FUNCTIONAL)
  const [username, setUsername] = useState<string>(activeProfile?.username || "");
  const [logo, setLogo] = useState<string | null>(activeProfile?.logo || null);
  const [editLogo, setEditLogo] = useState<string | null>(activeProfile?.logo || null);
  const [profileName, setProfileName] = useState<string>(activeProfile?.name || "");
  const [category, setCategory] = useState<string>(activeProfile?.category || "");

  // 🧠 Profile-Centric Logical Helpers
  const isPersonalProfile =
    activeProfile?.type === "PERSONAL" ||
    category === "Personal Profile" ||
    category?.toLowerCase().includes("personal");
  const isCreatorProfile = category?.toLowerCase().includes("creator") || category?.toLowerCase().includes("stylist") || category?.toLowerCase().includes("influencer") || category?.toLowerCase().includes("artist");
  const isBusinessProfile = !isPersonalProfile && !isCreatorProfile;
  const [bioText, setBioText] = useState<string>(activeProfile?.bioText || "");
  const [websiteLink, setWebsiteLink] = useState<string>(
    activeProfile?.websiteLink || activeProfile?.website || ""
  );
  const [tags, setTags] = useState<string[]>(activeProfile?.tags || []);
  const [postsCount, setPostsCount] = useState<number>(activeProfile?.postsCount || 0);
  const [followersCount, setFollowersCount] = useState<number>(activeProfile?.followersCount || 0);
  const [followingCount, setFollowingCount] = useState<number>(activeProfile?.followingCount || 0);
  const [auraScore, setAuraScore] = useState<number>(activeProfile?.auraScore || 0);

  // Edit profile popup form values
  const [editUsername, setEditUsername] = useState<string>(activeProfile?.username || "");
  const [editProfileName, setEditProfileName] = useState<string>(activeProfile?.name || "");
  const [editCategory, setEditCategory] = useState<string>(activeProfile?.category || "");
  const [editBioText, setEditBioText] = useState<string>(activeProfile?.bioText || "");
  const [editWebsiteLink, setEditWebsiteLink] = useState<string>(
    activeProfile?.websiteLink || activeProfile?.website || ""
  );

  const displayLogo = logo || activeProfile?.logo || currentUser?.avatar || null;

  const profileSaveInFlight = useRef(false);
  const mediaUploadInFlight = useRef(false);

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

  // UI state hooks
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeGridTab, setActiveGridTab] = useState<"posts" | "reels" | "products" | "collabs">("posts");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [availableMaisons, setAvailableMaisons] = useState<any[]>([]);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [showCreateBrandSheet, setShowCreateBrandSheet] = useState(false);
  const [showAddProductSheet, setShowAddProductSheet] = useState(false);
  const [profileProducts, setProfileProducts] = useState<ProfileCatalogProduct[]>([]);
  const [profileProductsMode, setProfileProductsMode] = useState<"store" | "aggregated" | "empty">("store");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);

  const yourStorySlides =
    instaStories.find((s) => s.isYourStory)?.slides?.filter((sl: { url?: string }) => sl?.url) || [];
  const hasActiveStory = yourStorySlides.length > 0;
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  // 👥 Followers/Following network list states
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [networkUsers, setNetworkUsers] = useState<NetworkProfile[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [shareContacts, setShareContacts] = useState<NetworkProfile[]>([]);
  const [loadingShareContacts, setLoadingShareContacts] = useState(false);

  const loadNetworkList = useCallback(
    async (tab: "followers" | "following") => {
      if (!activeProfile?.id) return;
      setLoadingNetwork(true);
      try {
        const list = await fetchProfileNetwork(activeProfile.id, tab, activeProfile.id);
        setNetworkUsers(list);
      } catch (e) {
        console.warn("Could not load profile network.", e);
        setNetworkUsers([]);
      } finally {
        setLoadingNetwork(false);
      }
    },
    [activeProfile?.id]
  );

  const loadShareContacts = useCallback(async () => {
    if (!activeProfile?.id) return;
    setLoadingShareContacts(true);
    try {
      const list = await fetchProfileNetwork(activeProfile.id, "following", activeProfile.id);
      setShareContacts(list);
    } catch (e) {
      console.warn("Could not load share contacts.", e);
      setShareContacts([]);
    } finally {
      setLoadingShareContacts(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    if (showNetworkModal && activeProfile?.id) {
      loadNetworkList(networkTab);
    }
  }, [showNetworkModal, networkTab, activeProfile?.id, loadNetworkList]);

  const handleNetworkFollowToggle = async (item: NetworkProfile) => {
    if (!activeProfile?.id || item.id === activeProfile.id) return;
    triggerHaptic("medium");
    const data = await toggleFollowProfile(activeProfile.id, item.id);
    if (!data.success) return;

    setNetworkUsers((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, followed: !!data.isFollowing } : u))
    );

    if (networkTab === "following" && !data.isFollowing) {
      setNetworkUsers((prev) => prev.filter((u) => u.id !== item.id));
    }

    if (typeof data.followingCount === "number") {
      setFollowingCount(data.followingCount);
    }
  };

  // ➕ Functional Modals State
  const [showPostModal, setShowPostModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // 🏛️ Unified Accounts Center States
  const [showAccountsCenter, setShowAccountsCenter] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [regionLockEnabled, setRegionLockEnabled] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [fediverseSharing, setFediverseSharing] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: "s1", device: "iPhone 17 Pro", location: "Bengaluru, India", active: true, icon: "smartphone" },
    { id: "s2", device: "Mac Studio (Atelier)", location: "Bengaluru, India", active: false, icon: "desktop" },
    { id: "s3", device: "iPad Pro", location: "Mumbai, India", active: false, icon: "tablet-portrait" }
  ]);

  // Post form states
  const [postTitle, setPostTitle] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postImage, setPostImage] = useState("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400");
  const [postVibe, setPostVibe] = useState("Quiet Luxury");
  const [isPublishingStoryAndPost, setIsPublishingStoryAndPost] = useState(false);

  // Custom prompt states
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDesc, setPromptDesc] = useState("");
  const [promptPlaceholder, setPromptPlaceholder] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [promptOnSubmit, setPromptOnSubmit] = useState<((val: string) => void) | null>(null);

  const showCustomPrompt = (title: string, desc: string, placeholder: string, onSubmit: (val: string) => void) => {
    setPromptTitle(title);
    setPromptDesc(desc);
    setPromptPlaceholder(placeholder);
    setPromptValue("");
    setPromptOnSubmit(() => onSubmit);
    setPromptVisible(true);
  };

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [generatedProduct, setGeneratedProduct] = useState<any>(null);
  const [aiTitle, setAiTitle] = useState("");
  const [aiPrice, setAiPrice] = useState("");

  // 📤 Share Profile states
  const [showShareProfileSheet, setShowShareProfileSheet] = useState(false);
  const [shareSearch, setShareSearch] = useState("");

  useEffect(() => {
    if (showShareProfileSheet && activeProfile?.id) {
      loadShareContacts();
    }
  }, [showShareProfileSheet, activeProfile?.id, loadShareContacts]);

  // Highlights — seeded from real stories when available
  const [highlights, setHighlights] = useState<{ id: string; title: string; avatar: string }[]>([]);

  // Redirect to login if user is not authenticated dynamically
  useEffect(() => {
    if (!authHydrated) return;
    if (!currentUser) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 1);
      return () => clearTimeout(timer);
    }
    setPersonalDob(currentUser.dob || "2000-01-01");
    setPersonalGender(currentUser.gender || "Prefer Not to Say");
    setPersonalEmail(currentUser.email || "");
    setPersonalPhone(currentUser.phone || "");
    setIsVerifiedUser(currentUser.isVerified || false);
    setBiometricEnabled(currentUser.biometricEnabled ?? true);
    setTwoFactorEnabled(currentUser.twoFactorEnabled ?? true);
    setRegionLockEnabled(currentUser.regionLockEnabled ?? false);
    setAlertsEnabled(currentUser.alertsEnabled ?? true);
    setFediverseSharing(currentUser.fediverseSharing ?? false);
  }, [currentUser, authHydrated]);

  useFocusEffect(
    useCallback(() => {
      loadProfileFromServer();
      loadProfilePosts();
      loadProfileProducts();
      loadProfileHighlights();
      if (currentUser?.id) {
        loadUserStories(currentUser.id);
      }
    }, [loadProfileFromServer, loadProfilePosts, loadProfileProducts, loadProfileHighlights, loadUserStories, currentUser?.id, activeProfile?.id])
  );

  // Keep account avatar in sync with global store (bottom tab uses the same activeProfile.logo)
  useEffect(() => {
    if (mediaUploadInFlight.current || isUploadingMedia) return;
    const storeLogo = activeProfile?.logo;
    if (storeLogo && storeLogo !== logo) {
      setLogo(storeLogo);
      setEditLogo(storeLogo);
    }
  }, [activeProfile?.logo, isUploadingMedia, logo]);

  // Load from Postgres when auth is ready or active profile switches
  useEffect(() => {
    if (!authHydrated || !currentUser?.id) return;
    loadProfileFromServer();
    fetchProducts();
  }, [authHydrated, currentUser?.id, activeProfile?.id]);

  const handleSavePersonalDetails = async () => {
    if (!personalDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      triggerHaptic("heavy");
      Alert.alert("Incorrect Format", "Date of Birth must be in YYYY-MM-DD format.");
      return;
    }

    setIsUpdating(true);
    triggerHaptic("medium");

    try {
      const res = await updateProfile({
        userId: currentUser?.id,
        dob: personalDob,
        gender: personalGender,
        phone: personalPhone,
        email: personalEmail
      });

      if (res.success) {
        triggerHaptic("success");
        Alert.alert("Details Synchronized", "Your personal details have been safely registered inside Neon PostgreSQL.");
        setShowPersonalDetails(false);
      } else {
        triggerHaptic("heavy");
        Alert.alert("Synchronization Interrupted", res.error || "Failed to update profile.");
      }
    } catch (e: any) {
      triggerHaptic("heavy");
      Alert.alert("Connection Failure", e.message || "Failed to sync updates.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleBiometric = async () => {
    const nextVal = !biometricEnabled;
    triggerHaptic("light");
    setBiometricEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, biometricEnabled: nextVal });
      if (!res.success) {
        setBiometricEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save biometric preference.");
      }
    }
  };

  const handleToggleTwoFactor = async () => {
    const nextVal = !twoFactorEnabled;
    triggerHaptic("light");
    setTwoFactorEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, twoFactorEnabled: nextVal });
      if (!res.success) {
        setTwoFactorEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save 2FA preference.");
      }
    }
  };

  const handleToggleRegionLock = async () => {
    const nextVal = !regionLockEnabled;
    triggerHaptic("light");
    setRegionLockEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, regionLockEnabled: nextVal });
      if (!res.success) {
        setRegionLockEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save node lock preference.");
      }
    }
  };

  const handleToggleAlerts = async () => {
    const nextVal = !alertsEnabled;
    triggerHaptic("light");
    setAlertsEnabled(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, alertsEnabled: nextVal });
      if (!res.success) {
        setAlertsEnabled(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save alert preference.");
      }
    }
  };

  const handleToggleFediverse = async () => {
    const nextVal = !fediverseSharing;
    triggerHaptic("light");
    setFediverseSharing(nextVal);
    if (currentUser) {
      const res = await updateProfile({ userId: currentUser.id, fediverseSharing: nextVal });
      if (!res.success) {
        setFediverseSharing(!nextVal);
        Alert.alert("Sync Failure", res.error || "Could not save Fediverse preference.");
      }
    }
  };

  // Catalog products for profile grid (aggregated on personal profile, store-scoped on brand)
  const brandStoreOptions: BrandStoreOption[] = brandProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    maisonId: p.maisonId || p.username,
    logo: p.logo,
  }));

  const displayProducts = profileProducts.length > 0
    ? profileProducts
    : products
        .filter(
          (p) =>
            p.maisonId === username ||
            p.maison?.id === username ||
            (username === "rare_raven" &&
              (p.maisonId === "rare_raven" || p.maison?.id === "rare_raven" || !p.maisonId))
        )
        .map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          images: p.images || [],
          maisonId: p.maisonId,
          storeName: p.maison?.name || profileName,
          storeUsername: p.maisonId || username,
          storeProfileId: activeProfile?.type === "BUSINESS" ? activeProfile.id : null,
        })) as ProfileCatalogProduct[];

  const showStoreLabelsOnProducts = profileProductsMode === "aggregated" || isPersonalProfile;

  const handleOpenAddProduct = () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in to add products.");
      return;
    }
    if (brandStoreOptions.length === 0) {
      Alert.alert(
        "Create a brand store first",
        "Products are listed under brand profiles. Create a brand profile, then add products to that store.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Create brand",
            onPress: () => setShowCreateBrandSheet(true),
          },
        ]
      );
      return;
    }
    triggerHaptic("medium");
    setShowAddProductSheet(true);
  };

  const handleSwitchToStoreFromProduct = async (storeProfileId: string | null) => {
    if (!storeProfileId) return;
    triggerHaptic("medium");
    const res = await switchActiveProfile(storeProfileId);
    if (res.success) {
      setActiveGridTab("products");
      await loadProfileFromServer();
      await loadProfileProducts();
    }
  };

  const handleProductCreated = useCallback(async () => {
    await fetchProducts();
    await loadProfileProducts();
  }, [fetchProducts, loadProfileProducts]);

  const handleEditProfilePress = () => {
    triggerHaptic("medium");
    setEditUsername(username);
    setEditProfileName(profileName);
    setEditCategory(category);
    setEditBioText(bioText);
    setEditWebsiteLink(websiteLink);
    setEditPostsCount(postsCount.toString());
    setEditFollowersCount(followersCount.toString());
    setEditFollowingCount(followingCount.toString());
    setEditLogo(logo);
    setShowEditModal(true);
  };

  const handleOpenWishlist = () => {
    const uid = currentUser?.id || activeProfile?.userId;
    if (uid && uid !== "patron_guest_sim") {
      fetchWishlist(uid);
    }
    triggerHaptic("medium");
    setShowWishlistModal(true);
  };

  const buildProfileSaveBody = (overrides: Record<string, unknown> = {}) => {
    const maisonKey = resolveMaisonId(activeProfile, currentUser, username);
    return {
      userId: currentUser?.id,
      profileId: activeProfile?.id,
      maisonId: maisonKey,
      profileName,
      category,
      bioText,
      websiteLink,
      logo,
      tags,
      postsCount,
      followersCount,
      followingCount,
      ...overrides,
    };
  };

  const addLookToGrid = (url: string, isVideo = false) => {
    const newPost = {
      id: `post_${Date.now()}`,
      url,
      isVideo,
    };
    setPresetPosts((prev) => [newPost, ...prev]);
    setPostsCount((prev) => prev + 1);
  };

  const publishStoryWithUrl = async (
    publicUrl: string,
    storyOnly: boolean,
    customCaption?: string,
    isVideo = false
  ) => {
    const storyCaption =
      customCaption ||
      `✨ ${activeProfile?.name || profileName || "Your"} Design Story uploaded dynamically!`;

    const res = await fetch(`${API_HOST}/api/mobile/feed`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        userId: currentUser!.id,
        profileId: activeProfile?.id || null,
        url: publicUrl,
        thumbnail: publicUrl,
        caption: storyCaption,
        location: "Atelier Flagship",
        music: storyOnly ? "STORY_ONLY" : "Cinematic Luxury Waves",
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Could not save story to the server.");
    }

    if (storyOnly) {
      addInstaStorySlide({
        id: `story_${Date.now()}`,
        url: publicUrl,
        caption: storyCaption,
        isVideo,
      });
    } else if (!storyOnly) {
      addLookToGrid(publicUrl, isVideo);
    }

    useStore.getState().fetchFeed(true);
    useStore.getState().fetchFeedItems("", "For You", true);
    loadProfilePosts();
    if (currentUser?.id) {
      await loadUserStories(currentUser.id);
    }
  };

  const handlePublishReel = async (localUri: string) => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in again to publish reels.");
      return;
    }
    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(localUri, "reel");
      await publishStoryWithUrl(publicUrl, false, "New reel", true);
      Alert.alert("Reel published", "Your reel is live on your profile and feed.");
    } catch (e) {
      console.warn("Could not publish reel.", e);
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your reel."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  const handleAddStory = async (url: string, storyOnly: boolean = false, customCaption?: string) => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in again to publish stories.");
      return;
    }

    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(url, "story");
      await publishStoryWithUrl(publicUrl, storyOnly, customCaption);
      Alert.alert(
        storyOnly ? "Story published" : "Story + post published",
        storyOnly
          ? "Your story is live. Tap your profile photo to view it."
          : "Your story and feed post are live."
      );
    } catch (e) {
      console.warn("Could not save story to database.", e);
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your story."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  const handleUpdateLogo = async (url: string) => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Not signed in", "Sign in again to update your photo.");
      return;
    }

    mediaUploadInFlight.current = true;
    setLogo(url);
    setEditLogo(url);
    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadMediaFromUri(url, "avatar");
      setLogo(publicUrl);
      setEditLogo(publicUrl);
      patchActiveProfile({ logo: publicUrl });

      const res = await fetch(`${API_HOST}/api/mobile/profile`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(buildProfileSaveBody({ logo: publicUrl })),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        applyProfilePayload(data.profile);
        Alert.alert("Photo updated", "Profile photo saved. It will show on your tab bar too.");
      } else {
        Alert.alert("Update failed", data.message || data.error || "Could not save photo.");
      }
    } catch (e) {
      console.warn("Failed to synchronize avatar update.", e);
      Alert.alert(
        "Update failed",
        e instanceof Error ? e.message : "Could not upload your photo."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  const handleDownloadInformation = async () => {
    triggerHaptic("success");
    try {
      const dataBackup = {
        identityNode: {
          username: username,
          displayName: profileName,
          category: category,
          bio: bioText,
          website: websiteLink,
          tags: tags,
          clerkEmail: username === "aloksingh" ? "aloksingh@aisastra.com" : "maison-director@aura.luxury",
          auraScore: 9.9,
          nodeId: activeMaisonId.toUpperCase().slice(-6)
        },
        securityProtocol: {
          biometricAccess: biometricEnabled ? "ENABLED" : "DISABLED",
          sovereign2FA: twoFactorEnabled ? "ENABLED" : "DISABLED",
          geographicNodeLock: regionLockEnabled ? "ENABLED" : "DISABLED",
          sessionAlerts: alertsEnabled ? "ENABLED" : "DISABLED",
          fediverseBridging: fediverseSharing ? "ENABLED (ActivityPub)" : "DISABLED"
        },
        catalogLedger: displayProducts.map(p => ({
          artifactId: p.id,
          sovereignId: p.sovereignId || `sha256_${p.id}`,
          title: p.title,
          retailPrice: p.price,
          vibeProfile: p.vibe,
          classification: p.type || "Fashion",
          arMetadata: p.arMetadata || {}
        }))
      };

      const backupString = JSON.stringify(dataBackup, null, 2);
      await Clipboard.setStringAsync(backupString);
      Alert.alert(
        "Sovereign Archive Exported",
        "Your unified account data, security protocols, and live catalog ledgers have been packed and copied to your native clipboard!\n\nYou can now paste and save this JSON archive anywhere."
      );
    } catch (e) {
      console.warn("Failed to generate data backup.", e);
      Alert.alert("Export Refused", "Failed to package account specifications.");
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    triggerHaptic("heavy");
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    Alert.alert(
      "Session Terminated",
      "OAuth credentials revoked. The target device has been signed out of your AURA identity node."
    );
  };

  const performDeleteAccount = async (confirmEmail: string) => {
    const userId = currentUser?.id;
    if (!userId) {
      Alert.alert("Error", "Sign in required to delete account.");
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/mobile/auth/delete-account`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId, confirmEmail: confirmEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        authLogOut();
        Alert.alert("Account Deleted", "Your account has been permanently removed.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Deletion Failed", data.error || "Could not delete account.");
      }
    } catch {
      Alert.alert("Network Error", "Could not reach the server.");
    }
  };

  const handleDeactivateMaison = () => {
    triggerHaptic("heavy");
    Alert.alert(
      "Account & Node Management",
      `Manage Maison '${profileName}' or permanently delete your AURA account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend Node",
          style: "destructive",
          onPress: () => {
            triggerHaptic("success");
            Alert.alert(
              "Identity Suspended",
              "Maison state suspended. Re-activate anytime from settings."
            );
          },
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                "Confirm Account Deletion",
                "Type your email to permanently delete your account.",
                (confirmEmail) => {
                  if (confirmEmail?.trim()) performDeleteAccount(confirmEmail);
                },
                "plain-text",
                currentUser?.email || ""
              );
            } else {
              Alert.alert(
                "Confirm Account Deletion",
                `Your account (${currentUser?.email || "signed-in user"}) will be permanently deleted.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Permanently",
                    style: "destructive",
                    onPress: () => {
                      if (currentUser?.email) performDeleteAccount(currentUser.email);
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const compressAndTranscodeImage = async (uri: string, mode: "story" | "avatar") => {
    const actions =
      mode === "story" ? [{ resize: { width: 1080 } as const }] : [{ resize: { width: 320 } as const }];
    try {
      const manipulateResult = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: mode === "story" ? 0.72 : 0.62,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return manipulateResult.uri;
    } catch (e) {
      console.warn("Primary compression failed, retrying copy to cache.", e);
      try {
        const fallback = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        return fallback.uri;
      } catch (e2) {
        console.warn("Image compression failed completely.", e2);
        throw new Error("Could not process the selected photo.");
      }
    }
  };

  type CreateMode = "reel" | "edit" | "post" | "story" | "highlight" | "live" | "ai";
  const pendingCreateRef = useRef<CreateMode | null>(null);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);

  const handleLaunchMediaPicker = async (mode: MediaPickMode) => {
    triggerHaptic("medium");
    setIsOpeningPicker(true);
    try {
      const asset = await pickMediaFromLibrary(mode);
      if (!asset?.uri) return;

      const selectedUri = asset.uri;
      triggerHaptic("success");

      if (mode === "reel") {
        await handlePublishReel(selectedUri);
        return;
      }

      let compressedUri: string;
      try {
        compressedUri = await compressAndTranscodeImage(
          selectedUri,
          mode === "avatar" ? "avatar" : "story"
        );
      } catch (compressError) {
        Alert.alert(
          "Photo error",
          compressError instanceof Error
            ? compressError.message
            : "Could not process the selected photo."
        );
        return;
      }

      if (mode === "post") {
        setPostImage(compressedUri);
        setIsPublishingStoryAndPost(false);
        setPostTitle("");
        setPostPrice("");
        setPostDescription("");
        setShowPostModal(true);
        return;
      }

      if (mode === "story") {
        const showPublishChoice = () => {
          Alert.alert(
            "Publishing Destination",
            "Publish as story only, or story + grid post?",
            [
              {
                text: "Story Only",
                onPress: async () => {
                  triggerHaptic("medium");
                  await handleAddStory(compressedUri, true);
                },
              },
              {
                text: "Both (Story + Post)",
                onPress: () => {
                  triggerHaptic("medium");
                  setPostImage(compressedUri);
                  setIsPublishingStoryAndPost(true);
                  setPostTitle("");
                  setPostPrice("");
                  setPostDescription("");
                  setShowPostModal(true);
                },
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
        };

        if (Platform.OS === "ios") {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(showPublishChoice, 300);
          });
        } else {
          showPublishChoice();
        }
        return;
      }

      await handleUpdateLogo(compressedUri);
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const executeCreateAction = (mode: CreateMode) => {
    switch (mode) {
      case "reel":
        router.push({
          pathname: "/",
          params: { activeTab: "reels", openCamera: "true" },
        } as any);
        break;
      case "post":
        router.push("/create/post");
        break;
      case "story":
        router.push("/create/story");
        break;
      case "edit":
        handleEditProfilePress();
        break;
      case "highlight":
        handleAddHighlight();
        break;
      case "live":
        setShowLiveModal(true);
        break;
      case "ai":
        router.push("/create/ai");
        break;
      default:
        break;
    }
  };

  const queueCreateAction = (mode: CreateMode) => {
    triggerHaptic("medium");
    if (showCreateModal) {
      pendingCreateRef.current = mode;
      setShowCreateModal(false);
      return;
    }
    setTimeout(() => executeCreateAction(mode), delayAfterModalClose());
  };

  useEffect(() => {
    if (showCreateModal) return;
    const mode = pendingCreateRef.current;
    if (!mode) return;
    pendingCreateRef.current = null;
    const timer = setTimeout(() => executeCreateAction(mode), delayAfterModalClose());
    return () => clearTimeout(timer);
  }, [showCreateModal]);

  const handleAvatarPress = () => {
    triggerHaptic("medium");
    Alert.alert("Profile photo & stories", "What do you want to do?", [
      {
        text: "Change profile photo",
        onPress: () => handleLaunchMediaPicker("avatar"),
      },
      {
        text: "Add story from gallery",
        onPress: () => router.push("/create/story"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleProfileAvatarTap = () => {
    if (hasActiveStory) {
      triggerHaptic("light");
      setStoryViewerIndex(0);
      setShowStoryViewer(true);
    } else {
      handleAvatarPress();
    }
  };

  const openCreateHandled = useRef(false);
  useEffect(() => {
    const mode = routeParams.openCreate;
    if (!mode || !authHydrated || !currentUser?.id || openCreateHandled.current) return;
    openCreateHandled.current = true;
    if (mode === "post" || mode === "story") {
      router.push(`/create/${mode}` as "/create/post");
    } else if (mode === "reel") {
      router.push({ pathname: "/", params: { activeTab: "reels", openCamera: "true" } } as any);
    } else {
      queueCreateAction(mode as CreateMode);
    }
  }, [routeParams.openCreate, authHydrated, currentUser?.id]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in again to save your profile.");
      return;
    }
    if (!activeProfile?.id) {
      Alert.alert("Profile loading", "Wait a moment for your profile to load, then try again.");
      return;
    }

    triggerHaptic("success");
    profileSaveInFlight.current = true;
    setIsSavingProfile(true);

    const originalUsername = username;
    const originalProfileName = profileName;
    const originalCategory = category;
    const originalBioText = bioText;
    const originalWebsiteLink = websiteLink;
    const originalLogo = logo;
    const maisonKey = resolveMaisonId(activeProfile, currentUser, originalUsername);

    try {
      const nextUsername = editUsername.trim() || originalUsername;
      const usernameChanged = nextUsername !== originalUsername.trim();
      const res = await fetch(`${API_HOST}/api/mobile/profile`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser.id,
          profileId: activeProfile.id,
          maisonId: nextUsername,
          oldMaisonId: usernameChanged ? maisonKey : undefined,
          profileName: editProfileName,
          category: editCategory,
          bioText: editBioText,
          websiteLink: editWebsiteLink.trim(),
          logo: editLogo,
          tags,
        }),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        applyProfilePayload(data.profile);
        if (usernameChanged) {
          setActiveMaisonId(data.profile.username || nextUsername);
        }
        syncProfileIdentity();
        setShowEditModal(false);
        Alert.alert("Profile saved", "Your changes are stored on the server.");
      } else {
        triggerHaptic("heavy");
        if (data.error === "USERNAME_TAKEN") {
          Alert.alert(
            "Username taken",
            "That username is already in use. Pick a different one."
          );
        } else {
          Alert.alert(
            "Save failed",
            data.message || data.error || "The server could not save your profile."
          );
        }
      }
    } catch (e) {
      console.warn("Profile sync failed.", e);
      triggerHaptic("heavy");
      Alert.alert(
        "Save failed",
        `Could not reach the server at ${API_HOST}. Reload the app and try again.`
      );
    } finally {
      profileSaveInFlight.current = false;
      setIsSavingProfile(false);
    }
  };

  const loadProfileHighlights = useCallback(async () => {
    if (!activeProfile?.id) return;
    try {
      const list = await fetchProfileHighlights(activeProfile.id);
      setHighlights(list);
    } catch {
      setHighlights([]);
    }
  }, [activeProfile?.id]);

  const handleAddHighlight = () => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Sign in required", "Sign in to create highlights.");
      return;
    }
    triggerHaptic("medium");
    showCustomPrompt(
      "New Highlight",
      "Enter title for your new highlight folder:",
      "e.g. Milan Curation",
      async (title) => {
        if (!title || !title.trim()) return;
        triggerHaptic("success");
        const storyIds = yourStorySlides.map((s) => s.id).filter(Boolean);
        const result = await createProfileHighlight({
          profileId: activeProfile.id,
          userId: currentUser.id,
          title: title.trim(),
          coverUrl: yourStorySlides[0]?.url || displayLogo || undefined,
          storyIds,
        });
        if (result.success && result.highlight) {
          setHighlights((prev) => [result.highlight!, ...prev]);
        } else {
          Alert.alert("Could not create highlight", result.error || "Try again.");
        }
      }
    );
  };

  const handleShareProfile = () => {
    triggerHaptic("medium");
    setShareSearch("");
    setShowShareProfileSheet(true);
  };

  const handleSwitchMaison = async (profileId: string) => {
    triggerHaptic("success");
    setShowSwitcherModal(false);
    try {
      const res = await switchActiveProfile(profileId);
      if (!res.success) {
        Alert.alert("Switch Failed", res.error || "Failed to switch profiles.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to switch profiles.");
    }
  };

  const handleAddBrandProfile = () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in again to create a brand profile.");
      return;
    }
    if (userProfiles.length >= MAX_PROFILES_PER_ACCOUNT) {
      Alert.alert(
        "Profile limit reached",
        `You can have up to ${MAX_PROFILES_PER_ACCOUNT} profiles per account, like Instagram.`
      );
      return;
    }
    triggerHaptic("medium");
    setShowSwitcherModal(false);
    setShowCreateBrandSheet(true);
  };

  const handleBrandProfileCreated = useCallback(async () => {
    if (!currentUser?.id) return;
    await fetchProfiles(currentUser.id);
    await loadProfileFromServer();
    await loadProfilePosts();
    await loadProfileProducts();
  }, [currentUser?.id, fetchProfiles, loadProfileFromServer, loadProfilePosts, loadProfileProducts]);

  const handleAddPress = () => {
    triggerHaptic("light");
    showCustomPrompt(
      "Add Profile Tag",
      "Enter a custom handle tag (e.g. @rare_raven, ✦ Expert):",
      "e.g. ✦ Stylist",
      async (tag) => {
        if (tag && tag.trim()) {
          triggerHaptic("success");
          const newTags = [...tags, tag.trim()];
          setTags(newTags);

          // Save to Neon PostgreSQL
          try {
            const res = await fetch(`${API_HOST}/api/mobile/profile`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(buildProfileSaveBody({ tags: newTags })),
            });
            const data = await res.json();
            if (data.success && data.profile) {
              applyProfilePayload(data.profile);
              syncProfileIdentity();
            }
          } catch (e) {
            console.warn("Failed to save tag in account profile view", e);
          }
        }
      }
    );
  };

  const handleRemoveTag = (tagToRemove: string) => {
    triggerHaptic("medium");
    Alert.alert(
      "Remove Tag",
      `Are you sure you want to remove the tag "${tagToRemove}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const newTags = tags.filter(t => t !== tagToRemove);
            setTags(newTags);
            triggerHaptic("success");

            // Save to database
            try {
              const res = await fetch(`${API_HOST}/api/mobile/profile`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(buildProfileSaveBody({ tags: newTags })),
              });
              const data = await res.json();
              if (data.success && data.profile) {
                applyProfilePayload(data.profile);
                syncProfileIdentity();
              }
            } catch (e) {
              console.warn("Failed to remove tag in account profile view", e);
            }
          }
        }
      ]
    );
  };

  const handleRequestVerification = async () => {
    if (isVerifiedUser) {
      Alert.alert("Verified", "Your email is already verified.");
      return;
    }
    triggerHaptic("medium");
    Alert.alert(
      "Email verification required",
      "Complete OTP verification from signup, or resend a code from Account settings after signing in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go to verify",
          onPress: () => {
            router.push({
              pathname: "/otp",
              params: { userId: currentUser?.id || "" },
            } as any);
          },
        },
      ]
    );
  };

  // 📸 Product/Post publishing handler
  const handlePublishPost = async () => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in again to publish.");
      return;
    }
    if (!postImage?.trim()) {
      Alert.alert("Missing photo", "Choose a photo before publishing.");
      return;
    }

    // 👥 PERSONAL PROFILE — validate caption before upload
    if (category === "Personal Profile" && !postTitle.trim()) {
      Alert.alert("Missing Caption", "Please enter a caption for your look.");
      return;
    }

    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(postImage, "post");

      if (category === "Personal Profile") {
        triggerHaptic("success");
        const wasStoryAndPost = isPublishingStoryAndPost;
        if (wasStoryAndPost) {
          await publishStoryWithUrl(publicUrl, true, postTitle);
          await publishStoryWithUrl(publicUrl, false, postTitle);
          setIsPublishingStoryAndPost(false);
        } else {
          await publishStoryWithUrl(publicUrl, false, postTitle);
        }

        Alert.alert(
          "Look posted",
          wasStoryAndPost
            ? "Your story and grid post are live."
            : "Your look is on your profile grid and feed."
        );

        setPostTitle("");
        setShowPostModal(false);
        return;
      }

      // 🏛️ BUSINESS / BRAND MAISON PRODUCT PUBLISHING LOGIC
      if (!postTitle.trim() || !postPrice.trim()) {
        Alert.alert("Missing Parameters", "Please enter title and price for curating your AURA artifact.");
        return;
      }
      triggerHaptic("success");
      const parsedPrice = parseFloat(postPrice) || 0;

      const newProduct = {
        id: `p_${Date.now()}`,
        title: postTitle.trim(),
        price: parsedPrice,
        vibe: postVibe,
        images: [publicUrl],
        description: postDescription.trim() || "Dynamic high-fidelity physical design artifact.",
        maisonId: username,
        maison: { id: username, name: profileName },
        auraScore: 9.8,
        rating: 5.0,
        createdAt: new Date().toISOString(),
      };

      await createProduct({
        title: postTitle.trim(),
        price: parsedPrice,
        vibe: postVibe,
        images: [publicUrl],
        description: postDescription.trim(),
        maisonId: username,
      });

      useStore.setState((state) => ({ products: [newProduct, ...state.products] }));
      setPostsCount((prev) => prev + 1);

      if (isPublishingStoryAndPost) {
        await publishStoryWithUrl(
          publicUrl,
          false,
          `${postTitle} - ₹${parsedPrice.toLocaleString()}`
        );
        setIsPublishingStoryAndPost(false);
      }

      Alert.alert("Artifact curated", "Your product is saved and visible in your catalog.");

      setPostTitle("");
      setPostPrice("");
      setPostDescription("");
      setShowPostModal(false);
    } catch (e) {
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your post."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  // 🌌 AI generative product pipeline (real API)
  const handleStartAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Design Intent Missing", "Type a prompt describing your fashion blueprint.");
      return;
    }

    triggerHaptic("medium");
    setAiGenerating(true);
    setAiProgress(10);
    setAiStep("Connecting to AURA synthesis engine…");
    setGeneratedProduct(null);

    try {
      setAiProgress(40);
      setAiStep("Generating product blueprint and render…");
      const product = await synthesizeProductFromPrompt(aiPrompt.trim());
      setAiProgress(100);
      setAiStep("Synthesis complete!");
      triggerHaptic("success");
      setGeneratedProduct({
        title: product.title,
        price: product.price,
        image: product.imageUrl,
        vibe: product.vibe,
        description: product.description,
      });
      setAiTitle(product.title);
      setAiPrice(String(product.price));
    } catch (e) {
      Alert.alert(
        "Synthesis failed",
        e instanceof Error ? e.message : "Could not generate product."
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleMintGeneratedProduct = async () => {
    if (!generatedProduct || !aiTitle.trim() || !aiPrice.trim()) return;
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in to save products.");
      return;
    }

    triggerHaptic("success");
    setAiGenerating(true);
    setAiStep("Saving to catalog…");

    const parsedPrice = parseFloat(aiPrice) || generatedProduct.price || 125000;

    try {
      const res = await fetch(`${API_HOST}/api/mobile/products/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          maisonId: username,
          userId: currentUser.id,
          title: aiTitle.trim(),
          price: parsedPrice,
          vibe: generatedProduct.vibe || "Quiet Luxury",
          type: "Fashion",
          images: [generatedProduct.image],
          videoUrl: "",
        }),
      });
      const data = await res.json();

      if (!data.success || !data.artifact) {
        throw new Error(data.error || "Could not save product.");
      }

      const artifact = data.artifact;
      const newProduct = {
        id: artifact.id,
        title: aiTitle.trim(),
        price: parsedPrice,
        vibe: generatedProduct.vibe,
        images: [generatedProduct.image],
        description: generatedProduct.description,
        maisonId: username,
        maison: { id: username, name: profileName },
        auraScore: 9.5,
        rating: 5.0,
        createdAt: new Date().toISOString(),
      };

      useStore.setState((state) => ({ products: [newProduct, ...state.products] }));
      fetchProducts();

      await uploadAndPublish(generatedProduct.image, "post", {
        userId: currentUser.id,
        profileId: activeProfile?.id ?? null,
        profileName,
        caption: `${aiTitle.trim()} · AI curated on AURA`,
        productId: artifact.id,
      });

      Alert.alert(
        "Product live",
        `'${aiTitle.trim()}' is in your shop and posted to your grid.`
      );

      setAiPrompt("");
      setGeneratedProduct(null);
      setShowAIModal(false);
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof Error ? e.message : "Could not save AI product."
      );
    } finally {
      setAiGenerating(false);
      setAiStep("");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080415" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 🏔️ IMMERSIVE CANVAS HEADER ROW - NO RIGID STRIP */}
          <View style={styles.canvasHeaderRow}>
            <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowCreateModal(true); }}>
              <Lucide name="add-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.canvasHeaderDropdown} onPress={() => { triggerHaptic("medium"); setShowSwitcherModal(true); }}>
              <Text style={styles.canvasHeaderUsername}>{username}</Text>
              {isVerifiedUser && (
                <Lucide name="checkmark-circle" size={16} color="#00f5ff" style={{ marginLeft: 4 }} />
              )}
              <Lucide name="chevron-down-outline" size={14} color="#ffffff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>

            <View style={styles.canvasHeaderRightIcons}>
              <TouchableOpacity 
                style={{ marginRight: 16 }} 
                onPress={handleOpenWishlist}
              >
                <Lucide name="heart-outline" size={26} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ marginRight: 16 }} 
                onPress={() => { 
                  triggerHaptic("light"); 
                  Alert.alert(
                    "Unified Crossover",
                    "Cross over seamlessly to your connected social channels or live web flagship showroom:",
                    [
                      {
                        text: "🕸️ Open Web flagship Store",
                        onPress: () => {
                          triggerHaptic("success");
                          const webUrl = `${API_HOST}/maison/${username}`;
                          Linking.openURL(webUrl);
                        }
                      },
                      {
                        text: "🧵 Open AURA Threads Hub",
                        onPress: () => {
                          triggerHaptic("success");
                          Linking.openURL("https://threads.net");
                        }
                      },
                      {
                        text: "Cancel",
                        style: "cancel"
                      }
                    ]
                  );
                }}
              >
                <Lucide name="logo-instagram" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { triggerHaptic("medium"); setShowAccountsCenter(true); }}>
                <Lucide name="menu-outline" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
            
            {/* 🔴 PROFILE SUMMARY AND STATS BLOCK */}
            <View style={styles.profileSection}>
              <View style={styles.avatarStatsRow}>
                {/* Avatar with "Can't decide..." bubble and bottom "+" badge */}
                <View style={styles.avatarGroup}>
                  <View style={styles.bubbleOverlay}>
                    <Text style={styles.bubbleText}>Can't decide...</Text>
                    <View style={styles.bubblePointer} />
                  </View>
                  <TouchableOpacity activeOpacity={0.85} onPress={handleProfileAvatarTap} disabled={isUploadingMedia}>
                    {hasActiveStory ? (
                      <LinearGradient
                        colors={["#fb923c", "#d946ef", "#8b5cf6"]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 44,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View style={{
                          width: 82,
                          height: 82,
                          borderRadius: 41,
                          backgroundColor: "#080415",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <View style={{
                            width: 76,
                            height: 76,
                            borderRadius: 38,
                            overflow: "hidden",
                            backgroundColor: "#080415",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            {displayLogo ? (
                              <Image 
                                source={{ uri: displayLogo }} 
                                key={displayLogo.slice(0, 64)}
                                style={{ width: "100%", height: "100%", borderRadius: 38 }} 
                              />
                            ) : (
                              <Text style={styles.avatarInitial}>
                                {(profileName || activeProfile?.name || currentUser?.name || username || "R")[0]?.toUpperCase()}
                              </Text>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={{
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                        borderWidth: 1.5,
                        borderColor: "rgba(255,255,255,0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <View style={{
                          width: 76,
                          height: 76,
                          borderRadius: 38,
                          overflow: "hidden",
                          backgroundColor: "#080415",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {displayLogo ? (
                            <Image 
                              source={{ uri: displayLogo }} 
                              key={displayLogo.slice(0, 64)}
                              style={{ width: "100%", height: "100%", borderRadius: 38 }} 
                            />
                          ) : (
                            <Text style={styles.avatarInitial}>
                              {(profileName || activeProfile?.name || currentUser?.name || username || "R")[0]?.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.avatarPlusBadge} onPress={handleAvatarPress} disabled={isUploadingMedia}>
                    {isUploadingMedia ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Lucide name="add" size={13} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Stats Columns */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{formatCompactNumber(postsCount)}</Text>
                    <Text style={styles.statLabel}>posts</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.statItem} 
                    onPress={() => {
                      triggerHaptic("light");
                      setNetworkTab("followers");
                      setShowNetworkModal(true);
                    }}
                  >
                    <Text style={styles.statNumber}>{formatCompactNumber(followersCount)}</Text>
                    <Text style={styles.statLabel}>followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.statItem} 
                    onPress={() => {
                      triggerHaptic("light");
                      setNetworkTab("following");
                      setShowNetworkModal(true);
                    }}
                  >
                    <Text style={styles.statNumber}>{formatCompactNumber(followingCount)}</Text>
                    <Text style={styles.statLabel}>following</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🔴 BIO DESCRIPTION & WEBSITES */}
              <View style={styles.bioContainer}>
                <Text style={styles.bioBrandName}>{profileName}</Text>
                <Text style={styles.bioCategory}>{category}</Text>
                
                <Text style={styles.bioDescriptionText}>{bioText}</Text>
                
                {websiteLink ? (
                  <TouchableOpacity
                    style={styles.websiteRow}
                    onPress={() => {
                      triggerHaptic("light");
                      openExternalUrl(websiteLink);
                    }}
                  >
                    <Lucide name="link-outline" size={15} color="#00f5ff" />
                    <Text style={styles.websiteText}>{websiteLink}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Threads pill badge exactly matching Instagram screenshot */}
                <TouchableOpacity 
                  style={styles.threadsPill} 
                  onPress={() => { triggerHaptic("light"); openExternalUrl(`https://threads.net/@${username}`); }}
                >
                  <Text style={styles.threadsIcon}>@</Text>
                  <Text style={styles.threadsPillText}>{username}</Text>
                </TouchableOpacity>
              </View>

              {/* 🔴 HORIZONTAL TAG BADGES */}
              <View style={styles.tagsContainer}>
                {tags.map((tagItem, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.tagBadge}
                    onPress={() => handleRemoveTag(tagItem)}
                  >
                    <Text style={styles.tagBadgeText}>{tagItem}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addTagBtn} onPress={handleAddPress}>
                  <Lucide name="add" size={12} color="#00f5ff" />
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🔴 PROFESSIONAL DASHBOARD (CREATOR & BUSINESS ONLY) */}
            {!isPersonalProfile && (
              <TouchableOpacity 
                style={styles.dashboardCard}
                onPress={() => { 
                  triggerHaptic("medium"); 
                  if (isCreatorProfile) {
                    Alert.alert(
                      "Creator Insights", 
                      "AURA Creator Influence Matrix:\n\n• Aura Score: 9.8 (Top 1.2%)\n• Direct Commission Earned: ₹24,800\n• Brand Deal Campaign: Atelier Paris (Pending Approval)\n• Viral Rank: #42 Fashion Stylist"
                    );
                  } else {
                    Alert.alert(
                      "Professional Dashboard", 
                      "AURA Brand Merchant analytics:\n\n• Total Sales: ₹1,85,200\n• Active Inventory Items: 6 boutique items\n• Payouts: ₹85,200 (Escrow Lock settled)\n• Active Promotions: Quiet Luxury Campaign"
                    );
                  }
                }}
              >
                <View>
                  <Text style={styles.dashboardTitle}>Professional dashboard</Text>
                  <Text style={styles.dashboardSubtitle}>
                    {isCreatorProfile ? "Creator analytics & affiliate earnings" : "Brand tools & retail catalog metrics"}
                  </Text>
                </View>
                <View style={styles.dashboardIndicatorDot} />
              </TouchableOpacity>
            )}

            {/* 🔴 ACTION BUTTONS (EDIT PROFILE, SHARE PROFILE, SPONSORSHIPS) */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleEditProfilePress}>
                <Text style={styles.actionBtnText}>Edit profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={handleShareProfile}>
                <Text style={styles.actionBtnText}>Share profile</Text>
              </TouchableOpacity>

              {(isCreatorProfile || isBusinessProfile) && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }]} 
                  onPress={() => { triggerHaptic("medium"); router.push("/sponsorships" as any); }}
                >
                  <Text style={styles.actionBtnText}>Sponsors</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleOpenAddProduct}>
                <Text style={styles.actionBtnText}>Add product</Text>
              </TouchableOpacity>
            </View>

            {/* 🔴 INTERACTIVE HIGHLIGHTS ROW */}
            <View style={styles.highlightsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
                
                {/* "+" New Button */}
                <TouchableOpacity style={styles.highlightItem} onPress={handleAddHighlight}>
                  <View style={styles.highlightPlusCircle}>
                    <Lucide name="add" size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.highlightTitle}>New</Text>
                </TouchableOpacity>

                {/* Highlights List */}
                {highlights.map((hl) => (
                  <TouchableOpacity 
                    key={hl.id} 
                    style={styles.highlightItem} 
                    onPress={() => { triggerHaptic("light"); Alert.alert("Highlight folder", `Auditing story slides inside "${hl.title}" highlights folder.`); }}
                  >
                    <View style={styles.highlightCircle}>
                      <Image source={{ uri: hl.avatar }} style={styles.highlightImage} />
                    </View>
                    <Text style={styles.highlightTitle} numberOfLines={1}>{hl.title}</Text>
                  </TouchableOpacity>
                ))}

              </ScrollView>
            </View>

            {/* 🔮 CREATOR SCORE INFLUENCE BANNER (CREATOR ONLY) */}
            {isCreatorProfile && (
              <View style={styles.creatorBannerCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={styles.auraBadgeCircle}>
                    <Text style={styles.auraBadgeText}>AURA</Text>
                  </View>
                  <View>
                    <Text style={styles.creatorBannerTitle}>
                      Creator Rank • {formatCompactNumber(followersCount)} followers
                    </Text>
                    <Text style={styles.creatorBannerScore}>
                      Aura Score: {(auraScore || 0).toFixed(1)}/10
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.creatorBadgeBtn}
                  onPress={() => { triggerHaptic("medium"); Alert.alert("AURA Score System", "Calculated hourly by matching engagement velocity, purchase triggers, and lookbook curations."); }}
                >
                  <Text style={styles.creatorBadgeBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 🔴 GRID TAB BAR (POSTS, REELS, PRODUCTS, COLLABS) */}
            <View style={styles.gridTabBar}>
              {[
                { tab: "posts", icon: "grid-outline" },
                { tab: "reels", icon: "film-outline" },
                { tab: "products", icon: "bag-handle-outline" },
                { tab: "collabs", icon: "repeat-outline" }
              ].map((item) => (
                <TouchableOpacity 
                   key={item.tab} 
                   style={[styles.gridTabBtn, activeGridTab === item.tab && styles.gridTabBtnActive]} 
                   onPress={() => { triggerHaptic("light"); setActiveGridTab(item.tab as any); }}
                >
                  <Lucide 
                     name={item.icon as any} 
                     size={22} 
                     color={activeGridTab === item.tab ? "#00f5ff" : "rgba(255,255,255,0.4)"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* 🔴 GRID OF PRODUCTS / PERSONAL POSTS */}
            <View style={styles.gridWrapper}>
              {activeGridTab === "posts" && (
                presetPosts.filter((post: any) => !post.isVideo).length > 0 ? (
                  presetPosts.filter((post: any) => !post.isVideo).map((post: any) => (
                    <TouchableOpacity 
                      key={post.id} 
                      style={styles.gridImageContainer}
                      onPress={() => {
                        triggerHaptic("medium");
                        openGridItem("posts", post.id);
                      }}
                    >
                      <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <ProfileGridEmpty tab="posts" isOwnProfile />
                )
              )}

              {activeGridTab === "reels" && (
                presetPosts.filter((post: any) => post.isVideo).length > 0 ? (
                  presetPosts.filter((post: any) => post.isVideo).map((post: any) => (
                    <TouchableOpacity 
                      key={post.id} 
                      style={styles.gridImageContainer}
                      onPress={() => {
                        triggerHaptic("medium");
                        openGridItem("reels", post.id);
                      }}
                    >
                      <Image source={{ uri: post.thumbnail || post.url }} style={styles.gridPostImage} />
                      <View style={styles.gridVideoBadge}>
                        <Lucide name="play" size={11} color="#ffffff" />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <ProfileGridEmpty tab="reels" isOwnProfile />
                )
              )}

              {activeGridTab === "products" && (
                displayProducts.length > 0 ? (
                  displayProducts.map((product) => {
                    const imageUrl = product.images?.[0] || "";
                    return (
                      <TouchableOpacity 
                        key={product.id} 
                        style={styles.gridImageContainer}
                        onPress={() => {
                          triggerHaptic("medium");
                          openGridItem("products", product.id);
                        }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                        <View style={styles.gridPriceBadge}>
                          <Text style={styles.gridPriceText}>₹{product.price?.toLocaleString()}</Text>
                        </View>
                        {showStoreLabelsOnProducts && product.storeName && (
                          <TouchableOpacity
                            style={styles.gridStoreBadge}
                            onPress={() => handleSwitchToStoreFromProduct(product.storeProfileId)}
                          >
                            <Lucide name="storefront-outline" size={9} color="#00f5ff" />
                            <Text style={styles.gridStoreBadgeText} numberOfLines={1}>
                              {product.storeName}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <ProfileGridEmpty tab="products" isOwnProfile />
                )
              )}

              {activeGridTab === "collabs" && (
                displayProducts.length > 0 ? (
                  displayProducts.map((product) => {
                    const imageUrl = product.images?.[0] || "";
                    return (
                      <TouchableOpacity 
                        key={product.id} 
                        style={styles.gridImageContainer}
                        onPress={() => {
                          triggerHaptic("medium");
                          openGridItem("collabs", product.id);
                        }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
                        <View style={styles.gridAffiliateBadge}>
                          <Text style={styles.gridAffiliateText}>10% Commission</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <ProfileGridEmpty tab="collabs" isOwnProfile />
                )
              )}
            </View>

          </ScrollView>

      </SafeAreaView>

      {/* 👥 FOLLOWERS / FOLLOWING NETWORK LIST MODAL */}
      <Modal
        visible={showNetworkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.networkModalContainer}>
            <View style={styles.modalHeaderBar}>
              <View style={styles.modalIndicator} />
            </View>
            
            {/* Tab selector */}
            <View style={styles.networkTabContainer}>
              <TouchableOpacity 
                style={[styles.networkTabItem, networkTab === "followers" && styles.networkTabItemActive]} 
                onPress={() => { triggerHaptic("light"); setNetworkTab("followers"); }}
              >
                <Text style={[styles.networkTabText, networkTab === "followers" && styles.networkTabTextActive]}>
                  {formatCompactNumber(followersCount)} Followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.networkTabItem, networkTab === "following" && styles.networkTabItemActive]} 
                onPress={() => { triggerHaptic("light"); setNetworkTab("following"); }}
              >
                <Text style={[styles.networkTabText, networkTab === "following" && styles.networkTabTextActive]}>
                  {formatCompactNumber(followingCount)} Following
                </Text>
              </TouchableOpacity>
            </View>

            {loadingNetwork ? (
              <ActivityIndicator size="small" color="#00f5ff" style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={networkUsers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                      {networkTab === "followers" ? "No followers yet" : "Not following anyone yet"}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.networkUserRow}>
                    <TouchableOpacity
                      style={styles.networkUserLeft}
                      onPress={() => {
                        triggerHaptic("light");
                        setShowNetworkModal(false);
                        router.push(`/profile/${item.username}` as any);
                      }}
                    >
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.networkUserAvatar} />
                      ) : (
                        <View style={[styles.networkUserAvatar, { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }]}>
                          <Text style={{ color: "#fff", fontWeight: "700" }}>{item.name[0]?.toUpperCase() || "?"}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.networkUserName}>{item.name}</Text>
                        <Text style={styles.networkUserHandle}>@{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                    {item.id !== activeProfile?.id && (
                      <TouchableOpacity
                        style={[
                          styles.networkFollowBtn,
                          item.followed ? styles.networkFollowBtnOutline : styles.networkFollowBtnPrimary
                        ]}
                        onPress={() => handleNetworkFollowToggle(item)}
                      >
                        <Text style={[styles.networkFollowBtnText, item.followed && { color: "#fff" }]}>
                          {item.followed ? "Following" : "Follow"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
            
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => { triggerHaptic("light"); setShowNetworkModal(false); }}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔴 FULLY FUNCTIONAL PROFILE EDITING MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Nav Bar */}
          <View style={styles.editModalNavBar}>
            <TouchableOpacity onPress={() => { triggerHaptic("light"); setShowEditModal(false); }}>
              <Text style={styles.editModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <ActivityIndicator size="small" color="#00f5ff" />
              ) : (
                <Text style={styles.editModalDoneText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
            {/* Circular Logo Editor */}
            <View style={styles.editModalAvatarContainer}>
              <View style={styles.editModalAvatarCircle}>
                {logo ? (
                  <Image 
                    source={{ uri: logo }} 
                    style={{ width: "100%", height: "100%", borderRadius: 40 }} 
                  />
                ) : (
                  <Text style={styles.editModalAvatarText}>{profileName[0]?.toUpperCase() || "R"}</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleAvatarPress}>
                <Text style={styles.editModalChangeAvatarText}>Change profile photo</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput 
                style={styles.inputField} 
                value={editUsername} 
                onChangeText={setEditUsername}
                placeholder="e.g. rare_raven"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.inputField} 
                value={editProfileName} 
                onChangeText={setEditProfileName}
                placeholder="e.g. Rare Raven"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput 
                style={styles.inputField} 
                value={editCategory} 
                onChangeText={setEditCategory}
                placeholder="e.g. Clothing (Brand)"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput 
                style={[styles.inputField, { height: 80, textAlignVertical: "top" }]} 
                value={editBioText} 
                onChangeText={setEditBioText}
                multiline
                numberOfLines={4}
                placeholder="Streetwear + Gen Z Aesthetic..."
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput 
                style={styles.inputField} 
                value={editWebsiteLink} 
                onChangeText={setEditWebsiteLink}
                placeholder="e.g. clothikoo.in"
                placeholderTextColor="#8e8e8e"
              />
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* 🏛️ INSTAGRAM-STYLE MULTI-PROFILE SWITCHER BOTTOM SHEET */}
      <Modal
        visible={showSwitcherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSwitcherModal(false)}
      >
        <View style={styles.switcherBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSwitcherModal(false)} />
          <View style={styles.switcherPanel} onStartShouldSetResponder={() => true}>
            <View style={styles.switcherHandle} />
            <Text style={styles.switcherTitle}>Switch profile</Text>
            
            <ScrollView style={styles.switcherList} showsVerticalScrollIndicator={false}>
              {userProfiles.map((m) => {
                const isActive = m.id === activeProfile?.id;
                const initials = m.name ? m.name.substring(0, 2).toUpperCase() : (m.username || "").substring(0, 2).toUpperCase();
                
                return (
                  <TouchableOpacity 
                    key={m.id} 
                    style={[styles.switcherItem, isActive && styles.switcherItemActive]}
                    onPress={() => handleSwitchMaison(m.id)}
                  >
                    <View style={[styles.switcherAvatar, isActive && styles.switcherAvatarActive]}>
                      <Text style={styles.switcherAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.switcherInfo}>
                      <Text style={styles.switcherMaisonId}>@{m.username}</Text>
                      <Text style={styles.switcherMaisonName}>
                        {m.name || "AURA Profile"} • <Text style={{ color: "#00f5ff", fontSize: 10.5 }}>{m.category || "Personal"}</Text>
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.switcherCheck}>
                        <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addBrandBtn} onPress={handleAddBrandProfile}>
              <Lucide name="add-circle-outline" size={22} color="#00f5ff" />
              <Text style={styles.addBrandBtnText}>Add brand profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CreateBrandProfileSheet
        visible={showCreateBrandSheet}
        onClose={() => setShowCreateBrandSheet(false)}
        onCreated={handleBrandProfileCreated}
      />

      <AddProductSheet
        visible={showAddProductSheet}
        onClose={() => setShowAddProductSheet(false)}
        onCreated={handleProductCreated}
        brandStores={brandStoreOptions}
        defaultStoreId={
          activeProfile?.type === "BUSINESS" ? activeProfile.id : null
        }
        showStorePicker={isPersonalProfile || brandStoreOptions.length > 1}
      />

      {/* ➕ INSTAGRAM-STYLE CREATE BOTTOM SHEET */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.switcherBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCreateModal(false)} />
          <View style={[styles.createPanel, { alignSelf: "stretch" }]}>
            <View style={styles.switcherHandle} />
            <Text style={styles.createTitle}>Create</Text>
            
            <ScrollView style={styles.createList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("reel")}>
                <Lucide name="film-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Reel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("edit")}>
                <Lucide name="copy-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Edits</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("post")}>
                <Lucide name="grid-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("story")}>
                <Lucide name="add-circle-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Story</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("highlight")}>
                <Lucide name="heart-circle-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Highlights</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("live")}>
                <Lucide name="radio-outline" size={24} color="#ffffff" />
                <Text style={styles.createItemText}>Live</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createItem} onPress={() => queueCreateAction("ai")}>
                <Lucide name="sparkles-outline" size={24} color="#00f5ff" />
                <Text style={[styles.createItemText, { color: "#00f5ff" }]}>AI</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {(isOpeningPicker || isUploadingMedia) && (
        <View style={styles.mediaBusyOverlay} pointerEvents="box-none">
          <View style={styles.mediaBusyCard}>
            <ActivityIndicator size="large" color="#00f5ff" />
            <Text style={styles.mediaBusyText}>
              {isOpeningPicker ? "Opening gallery…" : "Publishing…"}
            </Text>
          </View>
        </View>
      )}

      {/* 📸 FUNCTIONAL PORTAL 1: POST CURATOR */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Text style={styles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>{category === "Personal Profile" ? "New Look Post" : "Curate Artifact"}</Text>
              <TouchableOpacity onPress={handlePublishPost} disabled={isUploadingMedia}>
                {isUploadingMedia ? (
                  <ActivityIndicator size="small" color="#00f5ff" />
                ) : (
                  <Text style={styles.editModalDoneText}>Publish</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              {category === "Personal Profile" ? (
                // 👥 Personal Look/Post inputs
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Caption / Description</Text>
                  <TextInput
                    style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
                    value={postTitle}
                    onChangeText={setPostTitle}
                    multiline
                    numberOfLines={3}
                    placeholder="Write a caption for your aesthetic look..."
                    placeholderTextColor="#8e8e8e"
                  />
                </View>
              ) : (
                // 🏛️ Brand Boutique Product inputs
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Title</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postTitle}
                      onChangeText={setPostTitle}
                      placeholder="e.g. Atelier Silk Drape Vestment"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Retail Price (INR)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postPrice}
                      onChangeText={postPrice => setPostPrice(postPrice.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="e.g. 185000"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Aesthetic / Vibe Profile</Text>
                    <TextInput
                      style={styles.inputField}
                      value={postVibe}
                      onChangeText={setPostVibe}
                      placeholder="e.g. Cyberpunk, Brutalist, Quiet Luxury"
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description / Curation Notes</Text>
                    <TextInput
                      style={[styles.inputField, { height: 70, textAlignVertical: "top" }]}
                      value={postDescription}
                      onChangeText={setPostDescription}
                      multiline
                      numberOfLines={3}
                      placeholder="Bespoke luxury drape fabric elements..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>
                </>
              )}

              {postImage && !postImage.includes("images.unsplash.com") ? (
                <View style={{ marginBottom: 20, alignItems: "center" }}>
                  <Image
                    source={{ uri: postImage }}
                    style={{
                      width: width - 48,
                      height: (width - 48) * 1.05,
                      borderRadius: 12,
                      backgroundColor: "#111",
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ color: "#8e8e8e", fontSize: 12, marginTop: 8 }}>
                    Selected from your gallery
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.inputLabel, { marginTop: 10, marginBottom: 12 }]}>
                {postImage && !postImage.includes("images.unsplash.com")
                  ? "Or pick a stock texture"
                  : "Select Design Texture Image"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 40 }}>
                {[
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400",
                  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400"
                ].map((url, i) => {
                  const isSelected = postImage === url;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setPostImage(url)}
                      style={{ marginRight: 10, borderWidth: 2, borderColor: isSelected ? "#00f5ff" : "transparent", borderRadius: 8, overflow: "hidden" }}
                    >
                      <Image source={{ uri: url }} style={{ width: 80, height: 80 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📡 FUNCTIONAL PORTAL 2: LIVE BROADCAST ATELIER SHOWROOM */}
      <LiveShowroom
        visible={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        initialMode="broadcaster"
        skipLobby
        maisonId={username}
        maisonName={profileName}
      />

      {/* 🌌 FUNCTIONAL PORTAL 3: AI GENERATIVE FASHION ARCHITECT */}
      <Modal
        visible={showAIModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => { setShowAIModal(false); setGeneratedProduct(null); }}>
                <Text style={styles.editModalCancelText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>AI Design Assistant</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              {!generatedProduct && !aiGenerating && (
                <>
                  <Text style={{ color: "#00f5ff", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AURA Deep-Fashion Architect</Text>
                  <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Synthesize Sovereign Blueprints</Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24, lineHeight: 18 }}>
                    Describe your high-fidelity fashion vision. AURA-AI will dynamically synthesize ambient textures, geometry mesh models, and calculate market metrics immediately.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Design Prompt</Text>
                    <TextInput
                      style={[styles.inputField, { height: 80, textAlignVertical: "top" }]}
                      value={aiPrompt}
                      onChangeText={setAiPrompt}
                      multiline
                      numberOfLines={4}
                      placeholder="e.g. brutalist trench coat in liquid gold mercury drape fabric with modular cargo modules..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 }}
                    onPress={handleStartAIGeneration}
                  >
                    <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>Synthesize Fashion Blueprint</Text>
                  </TouchableOpacity>
                </>
              )}

              {aiGenerating && (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
                  <ActivityIndicator size="large" color="#00f5ff" style={{ marginBottom: 24 }} />
                  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>AURA AI is curating...</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", paddingHorizontal: 30, marginBottom: 30, height: 40 }}>{aiStep}</Text>
                  
                  {/* Custom progress HUD */}
                  <View style={{ width: "80%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ width: `${aiProgress}%`, height: "100%", backgroundColor: "#00f5ff" }} />
                  </View>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontFamily: "monospace", marginTop: 10 }}>{aiProgress}% COMPLETE</Text>
                </View>
              )}

              {generatedProduct && !aiGenerating && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Synthesis Successful</Text>
                  <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Synthesized Artifact Render</Text>

                  <View style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
                    <Image source={{ uri: generatedProduct.image }} style={{ width: "100%", height: 260 }} />
                    <View style={{ padding: 16, backgroundColor: "#0b071e" }}>
                      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{aiTitle}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>{generatedProduct.description}</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Generated Title Override</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiTitle}
                      onChangeText={setAiTitle}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hydrate Price Override (INR)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={aiPrice}
                      onChangeText={price => setAiPrice(price.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={() => setGeneratedProduct(null)}
                    >
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Regenerate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={handleMintGeneratedProduct}
                    >
                      <Text style={{ color: "#000000", fontSize: 13, fontWeight: "bold" }}>Hydrate to Ledger</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🏛️ FUNCTIONAL PORTAL 4: AURA UNIFIED ACCOUNTS CENTER (META-STYLE HUB) */}
      <Modal
        visible={showAccountsCenter}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAccountsCenter(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowAccountsCenter(false)}>
                <Text style={styles.editModalCancelText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Accounts Center</Text>
              <TouchableOpacity onPress={() => setShowAccountsCenter(false)}>
                <Text style={styles.editModalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              
              {/* META-STYLE SUBTITLE & DECK INFO */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>AURA Identity & Access</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>Manage your connected profiles, personal governance, payments, and system security credentials across all ledger flagships.</Text>
              </View>

              {/* 1. CONNECTED PROFILES DECK */}
              <Text style={styles.accountsCenterSectionTitle}>Profiles Mesh</Text>
              <View style={styles.accountsCenterCard}>
                {/* Personal Profile */}
                {personalProfile && (
                  <TouchableOpacity 
                    style={styles.accountsCenterProfileRow}
                    onPress={() => {
                      triggerHaptic("medium");
                      handleSwitchMaison(personalProfile.id);
                      setShowAccountsCenter(false);
                    }}
                  >
                    <View style={[styles.profileTabCircle, { borderWidth: (activeProfile?.id === personalProfile.id) ? 1.5 : 0, borderColor: "#00f5ff", width: 40, height: 40, borderRadius: 20, overflow: "hidden", marginRight: 12, padding: 0, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
                      {personalProfile.logo ? (
                        <Image 
                          source={{ uri: personalProfile.logo }} 
                          style={{ width: "100%", height: "100%" }} 
                        />
                      ) : (
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                          {(personalProfile.name || "U")[0]?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{personalProfile.name || currentUser?.name || "Curator"}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Personal Creator Profile (@{personalProfile.username})</Text>
                    </View>
                    {activeProfile?.id === personalProfile.id && (
                      <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Available Brand profiles */}
                {brandProfiles.map((m, idx) => {
                  const isActive = m.id === activeProfile?.id;
                  const initials = m.name[0]?.toUpperCase() || "R";
                  return (
                    <TouchableOpacity 
                      key={m.id || idx}
                      style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                      onPress={() => {
                        triggerHaptic("medium");
                        handleSwitchMaison(m.id);
                        setShowAccountsCenter(false);
                      }}
                    >
                      <View style={[styles.profileTabCircle, { width: 40, height: 40, borderRadius: 20, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: isActive ? 1.5 : 0, borderColor: "#00f5ff", padding: 0 }]}>
                        <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{m.name}</Text>
                        <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Sovereign Brand Maison (@{m.username})</Text>
                      </View>
                      {isActive && (
                        <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 👥 PERSONAL DETAILS SECTION */}
              <Text style={styles.accountsCenterSectionTitle}>Personal Information</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowPersonalDetails(true);
                  }}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="person-circle-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Personal Details</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage Date of Birth, Gender, and contact phone/email verification nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 💼 AURA BUSINESS SUITE SECTION */}
              <Text style={styles.accountsCenterSectionTitle}>AURA Business & Marketing</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    setShowAccountsCenter(false);
                    router.push("/maison/business-suite");
                  }}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="business-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>AURA Business Suite</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage e-commerce catalogs, billing ad accounts, team members, and pixel conversion stats.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 2. DATA SOVEREIGNITY & GOVERNANCE */}
              <Text style={styles.accountsCenterSectionTitle}>Sovereign Data & Portability</Text>
              <View style={styles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={handleDownloadInformation}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="cloud-download-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Download Your Information</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Export a JSON archive copy of your credentials, inventory, and ledgers.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12, paddingVertical: 4 }]}
                  onPress={handleDeactivateMaison}
                >
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="close-circle-outline" size={20} color="#ff3b30" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ff3b30", fontSize: 13, fontWeight: "bold" }}>Deactivate or Delete Node</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Temporarily suspend or permanently purge specific brand ledger nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 3. FEDIVERSE & SOCIAL CROSSOVERS */}
              <Text style={styles.accountsCenterSectionTitle}>Connected Social & Fediverse</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="share-social-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Fediverse Sharing (ActivityPub)</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Federate and auto-broadcast your e-commerce artifacts to Mastodon & open platforms.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleFediverse}>
                    <Lucide name={fediverseSharing ? "toggle" : "toggle-outline"} size={36} color={fediverseSharing ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="globe-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Web Autoshare Crossovers</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Automatically mirror visual stories published in-app directly to the Next.js storefront.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleAlerts}>
                    <Lucide name={alertsEnabled ? "toggle" : "toggle-outline"} size={36} color={alertsEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. SECURITY PROTOCOLS */}
              <Text style={styles.accountsCenterSectionTitle}>Identity Security Protocol</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="finger-print-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Biometric Identification</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Use FaceID or TouchID for executing high-value ledger acquisitions.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleBiometric}>
                    <Lucide name={biometricEnabled ? "toggle" : "toggle-outline"} size={36} color={biometricEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="lock-closed-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Sovereign 2FA</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Direct hardware tokens required to commit critical parameter adjustments.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleTwoFactor}>
                    <Lucide name={twoFactorEnabled ? "toggle" : "toggle-outline"} size={36} color={twoFactorEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Geographic Node Lock</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Restrict profile operations to your current geographic coordinates.</Text>
                  </View>
                  <TouchableOpacity onPress={handleToggleRegionLock}>
                    <Lucide name={regionLockEnabled ? "toggle" : "toggle-outline"} size={36} color={regionLockEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. ACTIVE LOGINS & NODE DEVICES */}
              <Text style={styles.accountsCenterSectionTitle}>Active Node Logins (Where You're Logged In)</Text>
              <View style={styles.accountsCenterCard}>
                {activeSessions.map((s, idx) => (
                  <View 
                    key={s.id}
                    style={[styles.accountsCenterProfileRow, idx > 0 && { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                  >
                    <View style={styles.accountsCenterIconWrapper}>
                      <Lucide name={s.icon as any} size={20} color="#00f5ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>{s.device}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>{s.location} • {s.active ? "Active Node Session" : "Logged in recently"}</Text>
                    </View>
                    {!s.active ? (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,59,48,0.12)", borderRadius: 6 }}
                        onPress={() => handleRevokeSession(s.id)}
                      >
                        <Text style={{ color: "#ff3b30", fontSize: 10, fontWeight: "bold" }}>Revoke</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(0,245,255,0.12)", borderRadius: 6 }}>
                        <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold" }}>Current</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* SOVEREIGN MERCH ONBOARDING DECK */}
              <View style={{ marginHorizontal: 16, marginVertical: 30, padding: 20, backgroundColor: "rgba(0,245,255,0.03)", borderStyle: "dashed", borderWidth: 1.5, borderColor: "rgba(0,245,255,0.2)", borderRadius: 16, alignItems: "center" }}>
                <Lucide name="rocket-outline" size={32} color="#00f5ff" style={{ marginBottom: 12 }} />
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold", marginBottom: 6 }}>Become a Maison Director</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 11, textAlign: "center", lineHeight: 16, marginBottom: 16 }}>Transform from a consumer node to a primary e-commerce supply hub. Architect flagships, manage inventories, and publish design catalogs directly.</Text>
                <TouchableOpacity 
                  style={{ width: "100%", backgroundColor: "#00f5ff", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}
                  onPress={() => {
                    triggerHaptic("success");
                    Linking.openURL(`${API_HOST}/discover/onboarding`);
                  }}
                >
                  <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5 }}>Commence Onboarding</Text>
                </TouchableOpacity>
              </View>

              {/* LOG OUT BUTTON */}
              <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 30 }}>
                <TouchableOpacity 
                  style={{ width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255, 59, 48, 0.15)", borderWidth: 1, borderColor: "rgba(255, 59, 48, 0.25)", alignItems: "center" }}
                  onPress={() => {
                    authLogOut();
                    setShowAccountsCenter(false);
                    Alert.alert("Session Revoked", "Logged out of your active AURA mesh identity node successfully.");
                    router.replace("/login");
                  }}
                >
                  <Text style={{ color: "#ff3b30", fontSize: 12, fontWeight: "bold", letterSpacing: 1.5 }}>LOG OUT OF NODE</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🏛️ SUB-PORTAL: PERSONAL DETAILS CONSOLE */}
      <Modal
        visible={showPersonalDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPersonalDetails(false)}
      >
        <View style={[styles.editModalContainer, { paddingTop: insets.top }]}>
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={styles.editModalNavBar}>
              <TouchableOpacity onPress={() => setShowPersonalDetails(false)}>
                <Text style={styles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Personal Details</Text>
              <TouchableOpacity onPress={handleSavePersonalDetails} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator color="#00f5ff" size="small" />
                ) : (
                  <Text style={styles.editModalDoneText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Social Data Ledger</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>AURA keeps your personal metadata secure. It is never federated to standard advertising systems or public catalog nodes.</Text>
              </View>

              {/* Date of Birth Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Date of Birth</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.inputFieldRow}>
                  <Lucide name="calendar-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#555"
                    value={personalDob}
                    onChangeText={setPersonalDob}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Gender selection Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Gender</Text>
              <View style={[styles.accountsCenterCard, { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 16 }]}>
                {["Male", "Female", "Non-Binary", "Prefer Not to Say"].map((g) => {
                  const isSelected = personalGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.08)",
                      }}
                      onPress={() => {
                        triggerHaptic("light");
                        setPersonalGender(g);
                      }}
                    >
                      <Text style={{ color: isSelected ? "#080415" : "#fff", fontSize: 12, fontWeight: "bold" }}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Contact Information Form block */}
              <Text style={styles.accountsCenterSectionTitle}>Contact Information</Text>
              <View style={styles.accountsCenterCard}>
                <View style={styles.inputFieldRow}>
                  <Lucide name="mail-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Email Address"
                    placeholderTextColor="#555"
                    value={personalEmail}
                    onChangeText={setPersonalEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.inputFieldRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <Lucide name="call-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Phone Number"
                    placeholderTextColor="#555"
                    value={personalPhone}
                    onChangeText={setPersonalPhone}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Identity Verification Badging status */}
              <Text style={styles.accountsCenterSectionTitle}>Identity Verification Node</Text>
              <TouchableOpacity style={styles.accountsCenterCard} onPress={handleRequestVerification}>
                <View style={styles.accountsCenterProfileRow}>
                  <View style={styles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color={isVerifiedUser ? "#00f5ff" : "#8e8e8e"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                      {isVerifiedUser ? "Sovereign Mark Verified" : "Unverified Identity node"}
                    </Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>
                      {isVerifiedUser 
                        ? "Your identity ledger keys match AURA cryptographic primary trust." 
                        : "Submit government-issued business tax registers to unlock verified metadata markers."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 📤 PREMIUM INSTAGRAM-STYLE SHARE PROFILE BOTTOM SHEET MODAL */}
      {showShareProfileSheet && (
        <Modal
          visible={showShareProfileSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowShareProfileSheet(false)}
        >
          <TouchableOpacity 
            style={styles.bottomSheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowShareProfileSheet(false)}
          >
            <View style={styles.shareSheetContent} onStartShouldSetResponder={() => true}>
              {/* Drag Handle */}
              <View style={styles.bottomSheetDragHandle} />
              
              {/* Search Bar Row */}
              <View style={styles.shareSearchRow}>
                <View style={styles.shareSearchBox}>
                  <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.shareSearchInput}
                    placeholder="Search"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardAppearance="dark"
                    value={shareSearch}
                    onChangeText={setShareSearch}
                  />
                </View>
                <TouchableOpacity style={styles.shareAddFriendBtn} onPress={() => { triggerHaptic("light"); Alert.alert("Contacts Synced", "Your dynamic contact nodes have been successfully synchronized."); }}>
                  <Lucide name="person-add-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Direct Message Contacts Grid */}
              <View style={styles.shareContactsContainer}>
                {loadingShareContacts ? (
                  <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 24 }} />
                ) : (() => {
                  const filtered = shareContacts.filter(c =>
                    c.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
                    c.username.toLowerCase().includes(shareSearch.toLowerCase())
                  );

                  const rows = [];
                  for (let i = 0; i < filtered.length; i += 3) {
                    rows.push(filtered.slice(i, i + 3));
                  }

                  if (filtered.length === 0) {
                    return (
                      <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                          {shareContacts.length === 0 ? "Follow people to share your profile via DM" : "No contacts found"}
                        </Text>
                      </View>
                    );
                  }

                  return rows.map((rowContacts, rowIndex) => (
                    <View key={`row_${rowIndex}`} style={[styles.shareContactsRow, rowIndex > 0 && { marginTop: 20 }]}>
                      {rowContacts.map((contact) => (
                        <TouchableOpacity
                          key={contact.id}
                          style={styles.shareContactCard}
                          onPress={async () => {
                            triggerHaptic("success");
                            setShowShareProfileSheet(false);
                            try {
                              const res = await fetch(`${API_HOST}/api/mobile/chat/initiate`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", ...authHeaders() },
                                body: JSON.stringify({
                                  userId: currentUser?.id,
                                  userName: profileName,
                                  maisonId: contact.username,
                                  maisonName: contact.name,
                                  initialMessage: `Check out my profile: https://aura.app/${username}`,
                                }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                Alert.alert("Sent", `Profile shared with ${contact.name}`);
                              } else {
                                Alert.alert("Could not send", data.error || "Try again");
                              }
                            } catch {
                              Alert.alert("Could not send", "Network error");
                            }
                          }}
                        >
                          {contact.avatar ? (
                            <Image source={{ uri: contact.avatar }} style={styles.shareContactAvatar} />
                          ) : (
                            <View style={[styles.shareContactAvatar, { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }]}>
                              <Text style={{ color: "#fff", fontWeight: "700" }}>{contact.name[0]?.toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={styles.shareContactName} numberOfLines={1}>{contact.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {rowContacts.length < 3 && Array.from({ length: 3 - rowContacts.length }).map((_, placeholderIdx) => (
                        <View key={`placeholder_${placeholderIdx}`} style={{ width: 90 }} />
                      ))}
                    </View>
                  ));
                })()}
              </View>

              <View style={styles.shareHorizontalDivider} />

              {/* Bottom Row of Action Shortcuts */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.shareActionsScroll}
              >
                {/* 🔗 COPY LINK */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={async () => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  try {
                    await Clipboard.setStringAsync(profileUrl);
                    Alert.alert("Link Copied", "Instant match! The luxury profile coordinates have been copied to your clipboard.");
                  } catch (e) {
                    console.warn("Clipboard copy failed:", e);
                    Alert.alert("Link Copied", `Coordinate: ${profileUrl}`);
                  }
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="link-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Copy link</Text>
                </TouchableOpacity>

                {/* ➕ ADD TO STORY */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  
                  const newSlide = {
                    id: `ys_${Date.now()}`,
                    url: logo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400",
                    caption: `Check out my official AURA profile coordinates ✨: "${profileName}" (@${username})`,
                    isVideo: false,
                    artifact: null
                  };

                  addInstaStorySlide(newSlide);
                  Alert.alert("Story Shared", "Profile shared successfully to your Stories feed! View it at the top of your home screen.");
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="add-circle-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Add to story</Text>
                </TouchableOpacity>

                {/* 💬 WHATSAPP */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
                  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
                  Linking.openURL(whatsappUrl).catch(() => {
                    Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#25d366" }]}>
                    <Lucide name="logo-whatsapp" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>WhatsApp</Text>
                </TouchableOpacity>

                {/* 📸 INSTAGRAM */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  Linking.openURL("instagram://camera").catch(() => {
                    Linking.openURL("https://instagram.com");
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#e1306c" }]}>
                    <Lucide name="logo-instagram" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Instagram</Text>
                </TouchableOpacity>

                {/* ✈️ TELEGRAM */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨\n\nLink: ${profileUrl}`;
                  const telegramUrl = `tg://msg?text=${encodeURIComponent(text)}`;
                  Linking.openURL(telegramUrl).catch(() => {
                    Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`);
                  });
                }}>
                  <View style={[styles.shareActionCircle, { backgroundColor: "#0088cc" }]}>
                    <Lucide name="paper-plane-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>Telegram</Text>
                </TouchableOpacity>

                {/* 📤 NATIVE SYSTEM SHARE ("MORE") */}
                <TouchableOpacity style={styles.shareActionBtn} onPress={() => {
                  triggerHaptic("success");
                  setShowShareProfileSheet(false);
                  const profileUrl = `${API_HOST}/maison/${username}`;
                  const text = `Connect with me on AURA: "${profileName}" (@${username}) ✨`;
                  Share.share({
                    message: `${text}\n\nLink: ${profileUrl}`,
                    url: profileUrl,
                    title: "AURA Profile coordinates"
                  }).catch(err => {
                    console.warn("Native share failed:", err);
                  });
                }}>
                  <View style={styles.shareActionCircle}>
                    <Lucide name="share-social-outline" size={22} color="#fff" />
                  </View>
                  <Text style={styles.shareActionLabel}>More</Text>
                </TouchableOpacity>
              </ScrollView>

            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 🏠 AURA BOTTOM NAVIGATION — 5 tabs with elevated Create */}
      <View style={[styles.auraBottomBar, { paddingBottom: insets.bottom, height: 62 + insets.bottom }]}>

        {/* TAB 1 — Home */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/");
          }}
        >
          <Lucide
            name="home-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Home</Text>
        </TouchableOpacity>

        {/* TAB 2 — Reel */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { activeTab: "reels" } } as any);
          }}
        >
          <Lucide
            name="film-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Reel</Text>
        </TouchableOpacity>

        {/* TAB 3 — Inbox */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { openDMs: "true" } } as any);
          }}
        >
          <Lucide
            name="paper-plane-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Inbox</Text>
        </TouchableOpacity>

        {/* TAB 4 — Products */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/shop");
          }}
        >
          <Lucide
            name="bag-handle-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Products</Text>
        </TouchableOpacity>

        {/* TAB 5 — Profile */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/account");
          }}
        >
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "#00f5ff", overflow: "hidden", backgroundColor: "#111" }]}>
            {displayLogo ? (
              <Image 
                source={{ uri: displayLogo }} 
                key={displayLogo.slice(0, 64)}
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>
                  {(profileName || username || "R")[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.auraTabLabel, { color: "#00f5ff" }]}>Profile</Text>
        </TouchableOpacity>

      </View>

      {/* 📖 YOUR STORY VIEWER */}
      <Modal
        visible={showStoryViewer}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowStoryViewer(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <StatusBar barStyle="light-content" />
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {displayLogo ? (
                <Image source={{ uri: displayLogo }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              ) : null}
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{username}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Just now</Text>
            </View>
            <TouchableOpacity onPress={() => setShowStoryViewer(false)}>
              <Lucide name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            {yourStorySlides[storyViewerIndex] ? (
              <Image
                source={{ uri: yourStorySlides[storyViewerIndex].url }}
                style={{ width: "100%", height: "85%" }}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
            <TouchableOpacity
              disabled={storyViewerIndex <= 0}
              onPress={() => setStoryViewerIndex((i) => Math.max(0, i - 1))}
            >
              <Lucide name="chevron-back" size={28} color={storyViewerIndex <= 0 ? "rgba(255,255,255,0.2)" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/create/story")}>
              <Lucide name="add-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={storyViewerIndex >= yourStorySlides.length - 1}
              onPress={() => setStoryViewerIndex((i) => Math.min(yourStorySlides.length - 1, i + 1))}
            >
              <Lucide name="chevron-forward" size={28} color={storyViewerIndex >= yourStorySlides.length - 1 ? "rgba(255,255,255,0.2)" : "#fff"} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ➕ CUSTOM PROMPT MODAL */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <TouchableOpacity
          style={styles.promptOverlay}
          activeOpacity={1}
          onPress={() => setPromptVisible(false)}
        >
          <View style={styles.promptContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.promptTitle}>{promptTitle}</Text>
            {promptDesc ? <Text style={styles.promptDesc}>{promptDesc}</Text> : null}
            <TextInput
              style={styles.promptInput}
              placeholder={promptPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={promptValue}
              onChangeText={setPromptValue}
              keyboardAppearance="dark"
              autoFocus
            />
            <View style={styles.promptActionRow}>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptCancelButton]}
                onPress={() => setPromptVisible(false)}
              >
                <Text style={styles.promptCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptButton, styles.promptSubmitButton]}
                onPress={() => {
                  setPromptVisible(false);
                  if (promptOnSubmit) {
                    promptOnSubmit(promptValue);
                  }
                }}
              >
                <Text style={styles.promptSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 💖 WISHLIST MODAL OVERLAY */}
      <Modal
        visible={showWishlistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWishlistModal(false)}
      >
        <View style={styles.wishlistOverlay}>
          <View style={styles.wishlistContainer}>
            <View style={styles.wishlistHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lucide name="heart" size={22} color="#00f5ff" />
                <Text style={styles.wishlistTitle}>SAVED ARTIFACTS</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWishlistModal(false)}>
                <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {wishlist && wishlist.length > 0 ? (
              <FlatList
                data={wishlist}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.wishlistListContent}
                renderItem={({ item }) => {
                  const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
                  return (
                    <View style={styles.wishlistItemCard}>
                      <TouchableOpacity 
                        style={styles.wishlistItemMain} 
                        onPress={() => {
                          setShowWishlistModal(false);
                          router.push(`/product/${item.id}`);
                        }}
                      >
                        <Image source={{ uri: imageUrl }} style={styles.wishlistItemImg} />
                        <View style={styles.wishlistItemInfo}>
                          <Text style={styles.wishlistItemMaison} numberOfLines={1}>
                            {item.maison?.name || "AURAGRAM Maison"}
                          </Text>
                          <Text style={styles.wishlistItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.wishlistItemVibe}>
                            ✦ {item.vibe || "Quiet Luxury"}
                          </Text>
                          <Text style={styles.wishlistItemPrice}>
                            ₹{item.price?.toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.wishlistItemActions}>
                        <TouchableOpacity
                          style={styles.wishlistAddToCartBtn}
                          onPress={() => {
                            addToCart(item);
                            const uid = currentUser?.id || activeProfile?.userId;
                            if (uid) {
                              toggleWishlist(uid, item.id);
                            }
                            triggerHaptic("success");
                            Alert.alert("Artifact Moved", "Added to your checkout casket.");
                          }}
                        >
                          <Lucide name="basket-outline" size={16} color="#000000" />
                          <Text style={styles.wishlistAddToCartText}>Move to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.wishlistRemoveBtn}
                          onPress={() => {
                            const uid = currentUser?.id || activeProfile?.userId;
                            if (uid) {
                              toggleWishlist(uid, item.id);
                            }
                            triggerHaptic("light");
                          }}
                        >
                          <Lucide name="trash-outline" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.wishlistEmpty}>
                <Lucide name="heart-dislike-outline" size={48} color="rgba(255,255,255,0.1)" />
                <Text style={styles.wishlistEmptyTitle}>No saved designs</Text>
                <Text style={styles.wishlistEmptyDesc}>
                  Discover premium items from the atelier shop and save them here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <ProfileGridViewer
        visible={gridViewer.visible}
        onClose={closeGridViewer}
        tab={gridViewer.tab}
        initialItemId={gridViewer.initialItemId}
        profile={{
          username,
          name: profileName,
          logo: displayLogo,
        }}
        posts={presetPosts}
        products={displayProducts}
        isOwnProfile
        onPostDeleted={(postId) => {
          setPresetPosts((prev) => {
            const next = prev.filter((p) => p.id !== postId);
            if (next.length === 0) closeGridViewer();
            return next;
          });
          loadProfileFromServer();
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415", // Premium luxury dark background
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#080415"
  },
  loadingText: {
    color: "#00f5ff", 
    fontSize: 13, 
    marginTop: 12, 
    textTransform: "uppercase", 
    letterSpacing: 1.5
  },
  // Immersive Canvas Header
  canvasHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  canvasHeaderDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  canvasHeaderUsername: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  canvasHeaderRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatarStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarGroup: {
    position: "relative",
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "#d946ef", // Vibrant Magenta/Pink from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarMiddleRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: "#8b5cf6", // Deep Purple/Violet from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarInnerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: "#00f5ff", // Vibrant Cyan/Sky Blue from fluid image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#080415", // Premium Instagram black gap
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
    fontFamily: "System",
  },
  avatarPlusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#00f5ff", // Sleek AURA blue
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#080415",
  },
  bubbleOverlay: {
    position: "absolute",
    top: -24,
    backgroundColor: "#0b071e",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 100,
    alignItems: "center",
  },
  bubbleText: {
    color: "#00f5ff",
    fontSize: 10.5,
    fontWeight: "500",
  },
  bubblePointer: {
    position: "absolute",
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: "#0b071e",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    transform: [{ rotate: "45deg" }],
  },
  
  // Stats
  statsRow: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    paddingLeft: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    fontWeight: "400",
    marginTop: 2,
  },

  // Bio Description
  bioContainer: {
    marginTop: 12,
  },
  bioBrandName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  bioCategory: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "400",
    marginTop: 2,
  },
  bioDescriptionText: {
    color: "#ffffff",
    fontSize: 13.5,
    lineHeight: 18.5,
    marginTop: 5,
    fontWeight: "500",
  },
  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  websiteText: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
  },

  // Tag Badges
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
  },
  tagBadgeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11.5,
    fontWeight: "600",
  },
  addTagBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 14,
  },
  addTagBtnText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
  },

  // Professional Dashboard
  dashboardCard: {
    backgroundColor: "rgba(255,255,255,0.035)", // High-end translucent glass card
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardTitle: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  dashboardSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  dashboardIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00f5ff",
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)", // Translucent premium grey
    borderRadius: 10, // Modern rounded corners
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  gridStoreBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "rgba(0,245,255,0.35)",
  },
  gridStoreBadgeText: {
    color: "#00f5ff",
    fontSize: 9,
    fontWeight: "700",
    flex: 1,
  },

  // Highlights Row
  highlightsContainer: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 16,
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightItem: {
    alignItems: "center",
    width: 64,
  },
  highlightPlusCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  highlightCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightImage: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },
  highlightTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  // Grid Tabs
  gridTabBar: {
    flexDirection: "row",
    marginTop: 4,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  gridTabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderColor: "transparent",
  },
  gridTabBtnActive: {
    borderColor: "#00f5ff", 
  },

  // Posts Grid
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    paddingTop: 1,
  },
  gridImageContainer: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: "relative",
    marginBottom: 1,
  },
  gridPostImage: {
    width: "100%",
    height: "100%",
  },
  gridVideoBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 4,
  },
  gridPriceBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridPriceText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Edit Modal Styling
  editModalContainer: {
    flex: 1,
    backgroundColor: "#080415",
  },
  editModalNavBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  editModalCancelText: {
    color: "#ffffff",
    fontSize: 15.5,
  },
  editModalTitle: {
    color: "#ffffff",
    fontSize: 16.5,
    fontWeight: "bold",
  },
  editModalDoneText: {
    color: "#00f5ff",
    fontSize: 15.5,
    fontWeight: "bold",
  },
  editModalScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: "#080415",
  },
  editModalAvatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  editModalAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0b071e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  editModalAvatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
  },
  editModalChangeAvatarText: {
    color: "#00f5ff",
    fontSize: 13.5,
    fontWeight: "bold",
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 8,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputField: {
    color: "#ffffff",
    fontSize: 14.5,
    paddingVertical: 4,
  },
  editorDividerRow: {
    marginTop: 20,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingBottom: 6,
  },
  editorSectionTitle: {
    color: "#00f5ff",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Bottom Navigation Bar replica
  instagramBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(8,4,21,0.88)", // Premium glassmorphic background
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tabBtn: {
    padding: 8,
  },
  auraBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "rgba(5,3,15,0.94)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  auraTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingTop: 8,
    gap: 3,
  },
  auraTabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  profileTabCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "relative",
    overflow: "hidden",
  },
  profileTabImg: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  profileActiveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  mediaBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  mediaBusyCard: {
    backgroundColor: "#0b071e",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaBusyText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  // Switcher modal styles
  switcherBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  switcherPanel: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  switcherHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  switcherTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  switcherList: {
    marginBottom: 20,
  },
  switcherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  switcherItemActive: {
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  switcherAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#20183e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  switcherAvatarActive: {
    borderColor: "#00f5ff",
    borderWidth: 1.5,
  },
  switcherAvatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  switcherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  switcherMaisonId: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  switcherMaisonName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  switcherCheck: {
    paddingLeft: 10,
  },
  addBrandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.3)",
    borderRadius: 8,
    marginTop: 10,
  },
  addBrandBtnText: {
    color: "#00f5ff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  // Create bottom sheet styles
  createPanel: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  createTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  createList: {
    marginBottom: 10,
  },
  createItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  createItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 14,
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Accounts Center specific styles
  accountsCenterSectionTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  accountsCenterCard: {
    backgroundColor: "#0f0b25",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  accountsCenterProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountsCenterIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0, 245, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inputFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4,
  },
  // 📤 Share Profile bottom sheet styles
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  bottomSheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 12,
  },
  shareSheetContent: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
    paddingBottom: 32,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  shareSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  shareSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  shareSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  shareAddFriendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareContactsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },
  shareContactsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shareContactCard: {
    alignItems: "center",
    width: 90,
  },
  shareContactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shareContactName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  shareHorizontalDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 20,
  },
  shareActionsScroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  shareActionBtn: {
    alignItems: "center",
    width: 76,
    gap: 6,
  },
  shareActionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareActionLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },

  // Creator Influence Card
  creatorBannerCard: {
    backgroundColor: "rgba(0,245,255,0.04)", // Light neon cyan glass background
    borderWidth: 0.5,
    borderColor: "rgba(0,245,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auraBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  auraBadgeText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "900",
  },
  creatorBannerTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  creatorBannerScore: {
    color: "#00f5ff",
    fontSize: 11.5,
    marginTop: 2,
  },
  creatorBadgeBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creatorBadgeBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },

  // Grid affiliate curations
  gridAffiliateBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,245,255,0.85)", // Vibrant cyan badge
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridAffiliateText: {
    color: "#080415",
    fontSize: 9,
    fontWeight: "900",
  },
  
  // Threads & Social Proof elements exactly mirroring Instagram screenshots
  threadsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 30,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  threadsIcon: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 4,
  },
  threadsPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  socialProofRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  socialProofAvatars: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
  },
  socialProofAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#080415",
  },
   socialProofText: {
    color: "#fff",
    fontSize: 13,
  },
  socialProofBold: {
    fontWeight: "bold",
  },
  // Custom prompt modal styles
  promptOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  promptContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0b071e",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  promptTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promptDesc: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  promptInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20,
  },
  promptActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  promptButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  promptCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  promptCancelButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  promptSubmitButton: {
    backgroundColor: "#00f5ff",
  },
  promptSubmitButtonText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Modal overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  
  // Followers/Following Modal list styles
  networkModalContainer: {
    height: "65%",
    backgroundColor: "#0d0920",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 0,
  },
  modalHeaderBar: {
    width: "100%",
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalIndicator: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  networkTabContainer: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    height: 44,
  },
  networkTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  networkTabItemActive: {
    borderBottomColor: "#00f5ff",
  },
  networkTabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "600",
  },
  networkTabTextActive: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
  networkUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.04)",
  },
  networkUserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  networkUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  networkUserName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
  networkUserHandle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    marginTop: 1,
  },
  networkFollowBtn: {
    paddingHorizontal: 16,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  networkFollowBtnPrimary: {
    backgroundColor: "#00f5ff",
  },
  networkFollowBtnOutline: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  networkFollowBtnText: {
    color: "#080415",
    fontSize: 11.5,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "rgba(255,255,255,0.04)",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalCloseButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  wishlistOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 4, 21, 0.95)",
    justifyContent: "flex-end",
  },
  wishlistContainer: {
    height: "80%",
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  wishlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 16,
  },
  wishlistTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
  },
  wishlistListContent: {
    paddingBottom: 40,
    gap: 16,
  },
  wishlistItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    padding: 12,
    gap: 12,
  },
  wishlistItemMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  wishlistItemImg: {
    width: 80,
    height: 80,
    borderRadius: 16,
    resizeMode: "cover",
  },
  wishlistItemInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 2,
  },
  wishlistItemMaison: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wishlistItemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  wishlistItemVibe: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "500",
  },
  wishlistItemPrice: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  wishlistItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 10,
  },
  wishlistAddToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00f5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  wishlistAddToCartText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
  },
  wishlistRemoveBtn: {
    padding: 8,
  },
  wishlistEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    gap: 12,
  },
  wishlistEmptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  wishlistEmptyDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
