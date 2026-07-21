import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useStore } from "@/store/useStore";
import { resolveMaisonId } from "@/lib/sessionIdentity";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { MAX_PROFILES_PER_ACCOUNT } from "@/lib/profileUsername";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import { router } from "expo-router";

type UseProfileEditOptions = {
  currentUser: any;
  activeProfile: any;
  userProfiles: any[];
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  switchActiveProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  fetchProfiles: (userId: string) => Promise<void>;
  setActiveMaisonId: (id: string) => void;
  syncProfileIdentity: () => void;
  fetchProducts: () => void;
  username: string;
  profileName: string;
  category: string;
  bioText: string;
  websiteLink: string;
  logo: string | null;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  editUsername: string;
  setEditUsername: (v: string) => void;
  editProfileName: string;
  setEditProfileName: (v: string) => void;
  editCategory: string;
  setEditCategory: (v: string) => void;
  editBioText: string;
  setEditBioText: (v: string) => void;
  editWebsiteLink: string;
  setEditWebsiteLink: (v: string) => void;
  editLogo: string | null;
  setEditLogo: (v: string | null) => void;
  profileSaveInFlight: React.MutableRefObject<boolean>;
  applyProfilePayload: (p: any) => void;
  loadProfileFromServer: () => Promise<void>;
  loadProfilePosts: () => Promise<void>;
  loadProfileProducts: () => Promise<void>;
  buildProfileSaveBody: (overrides?: Record<string, unknown>) => Record<string, unknown>;
  showCustomPrompt: (
    title: string,
    desc: string,
    placeholder: string,
    onSubmit: (val: string) => void
  ) => void;
  brandStoreOptions: BrandStoreOption[];
  setActiveGridTab: (tab: "posts" | "reels" | "products" | "collabs") => void;
};

export function useProfileEdit({
  currentUser,
  activeProfile,
  userProfiles,
  triggerHaptic,
  switchActiveProfile,
  fetchProfiles,
  setActiveMaisonId,
  syncProfileIdentity,
  fetchProducts,
  username,
  profileName,
  category,
  bioText,
  websiteLink,
  logo,
  tags,
  setTags,
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
  editLogo,
  setEditLogo,
  profileSaveInFlight,
  applyProfilePayload,
  loadProfileFromServer,
  loadProfilePosts,
  loadProfileProducts,
  buildProfileSaveBody,
  showCustomPrompt,
  brandStoreOptions,
  setActiveGridTab,
}: UseProfileEditOptions) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [showCreateBrandSheet, setShowCreateBrandSheet] = useState(false);
  const [showAddProductSheet, setShowAddProductSheet] = useState(false);

  const handleEditProfilePress = () => {
    triggerHaptic("medium");
    setEditUsername(username);
    setEditProfileName(profileName);
    setEditCategory(category);
    setEditBioText(bioText);
    setEditWebsiteLink(websiteLink);
    setEditLogo(logo);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }
    if (!activeProfile?.id) {
      Alert.alert("Profile loading", "Wait a moment for your profile to load, then try again.");
      return;
    }

    if (!useStore.getState().authToken) {
      Alert.alert("Session expired", "Please sign out and sign in again to save your profile.");
      return;
    }

    triggerHaptic("success");
    profileSaveInFlight.current = true;
    setIsSavingProfile(true);

    const originalUsername = username;
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
      } else if (res.status === 401) {
        triggerHaptic("heavy");
        Alert.alert("Session expired", "Please sign out and sign in again.");
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
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
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

  const handleOpenAddProduct = () => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
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

  const handleProductCreated = useCallback(async () => {
    await fetchProducts();
    await loadProfileProducts();
  }, [fetchProducts, loadProfileProducts]);

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
            const newTags = tags.filter((t) => t !== tagToRemove);
            setTags(newTags);
            triggerHaptic("success");

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
          },
        },
      ]
    );
  };

  return {
    showEditModal,
    setShowEditModal,
    isSavingProfile,
    showSwitcherModal,
    setShowSwitcherModal,
    showCreateBrandSheet,
    setShowCreateBrandSheet,
    showAddProductSheet,
    setShowAddProductSheet,
    handleEditProfilePress,
    handleSaveProfile,
    handleSwitchMaison,
    handleAddBrandProfile,
    handleBrandProfileCreated,
    handleOpenAddProduct,
    handleProductCreated,
    handleSwitchToStoreFromProduct,
    handleAddPress,
    handleRemoveTag,
  };
}
