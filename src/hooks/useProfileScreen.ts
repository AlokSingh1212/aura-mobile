import { useStore } from "@/store/useStore";
import { useLocalSearchParams } from "expo-router";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useProfileGridViewer } from "@/lib/profileGridNavigation";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileNetwork } from "@/hooks/useProfileNetwork";
import { useProfileBootstrapEffects } from "@/hooks/useProfileBootstrapEffects";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { useProfileMedia } from "@/hooks/useProfileMedia";
import { useProfileCreateActions } from "@/hooks/useProfileCreateActions";
import { useProfileEdit } from "@/hooks/useProfileEdit";
import { useProfileCustomPrompt } from "@/hooks/useProfileCustomPrompt";
import { useProfileWishlist } from "@/hooks/useProfileWishlist";
import { useProfileStoryViewer } from "@/hooks/useProfileStoryViewer";
import { useProfileCatalog } from "@/hooks/useProfileCatalog";
import { useProfileUiState } from "@/hooks/useProfileUiState";
import { buildProfileScreenBags } from "@/hooks/profileScreenBags";
import type { ProfileScreenView } from "@/hooks/profileScreenBags";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type { ProfileScreenView, ProfileScreenShellProps } from "@/hooks/profileScreenBags";

export function useProfileScreen(): ProfileScreenView {
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

  const insets = useSafeAreaInsets();
  const { viewer: gridViewer, openGridItem, closeViewer: closeGridViewer } = useProfileGridViewer();
  const { graph: socialGraph, version: socialGraphVersion } = useSocialGraph();
  const profileUi = useProfileUiState();

  const profileData = useProfileData({
    currentUser,
    authHydrated,
    activeProfile,
    socialGraph,
    socialGraphVersion,
  });

  const profileCatalog = useProfileCatalog({
    userProfiles,
    products,
    profileProducts: profileData.profileProducts,
    profileProductsMode: profileData.profileProductsMode,
    username: profileData.username,
    profileName: profileData.profileName,
    activeProfile,
    isPersonalProfile: profileData.isPersonalProfile,
  });

  const profileStoryViewer = useProfileStoryViewer({ instaStories });

  const profileNetwork = useProfileNetwork({
    activeProfile,
    triggerHaptic,
    setFollowingCount: profileData.setFollowingCount,
  });

  const profileSettings = useProfileSettings({
    currentUser,
    updateProfile,
    triggerHaptic,
    authLogOut,
    username: profileData.username,
    profileName: profileData.profileName,
    category: profileData.category,
    bioText: profileData.bioText,
    websiteLink: profileData.websiteLink,
    tags: profileData.tags,
    activeMaisonId,
    displayProducts: profileCatalog.displayProducts,
  });

  useProfileBootstrapEffects({
    authHydrated,
    currentUser,
    activeProfile,
    fetchProducts,
    loadUserStories,
    loadProfileFromServer: profileData.loadProfileFromServer,
    loadProfilePosts: profileData.loadProfilePosts,
    loadProfileProducts: profileData.loadProfileProducts,
    loadProductCollabs: profileData.loadProductCollabs,
    loadProfileHighlights: profileData.loadProfileHighlights,
    loadTaggedPosts: profileData.loadTaggedPosts,
    mediaUploadInFlight: profileData.mediaUploadInFlight,
    isUploadingMedia: profileUi.isUploadingMedia,
    logo: profileData.logo,
    setLogo: profileData.setLogo,
    setEditLogo: profileData.setEditLogo,
    onCurrentUserSync: profileSettings.syncFromCurrentUser,
  });

  const profileMedia = useProfileMedia({
    currentUser,
    activeProfile,
    triggerHaptic,
    addInstaStorySlide,
    loadUserStories,
    loadProfilePosts: profileData.loadProfilePosts,
    createProduct,
    fetchProducts,
    patchActiveProfile,
    applyProfilePayload: profileData.applyProfilePayload,
    mediaUploadInFlight: profileData.mediaUploadInFlight,
    setIsUploadingMedia: profileUi.setIsUploadingMedia,
    setPresetPosts: profileData.setPresetPosts,
    setPostsCount: profileData.setPostsCount,
    setLogo: profileData.setLogo,
    setEditLogo: profileData.setEditLogo,
    username: profileData.username,
    profileName: profileData.profileName,
    category: profileData.category,
    bioText: profileData.bioText,
    websiteLink: profileData.websiteLink,
    logo: profileData.logo,
    tags: profileData.tags,
    postsCount: profileData.postsCount,
    followersCount: profileData.followersCount,
    followingCount: profileData.followingCount,
    setShowPostModal: profileUi.setShowPostModal,
    setShowAIModal: profileUi.setShowAIModal,
  });

  const profilePrompt = useProfileCustomPrompt();

  const profileEdit = useProfileEdit({
    currentUser,
    activeProfile,
    userProfiles,
    triggerHaptic,
    switchActiveProfile,
    fetchProfiles,
    setActiveMaisonId,
    syncProfileIdentity,
    fetchProducts,
    username: profileData.username,
    profileName: profileData.profileName,
    category: profileData.category,
    bioText: profileData.bioText,
    websiteLink: profileData.websiteLink,
    logo: profileData.logo,
    tags: profileData.tags,
    setTags: profileData.setTags,
    editUsername: profileData.editUsername,
    setEditUsername: profileData.setEditUsername,
    editProfileName: profileData.editProfileName,
    setEditProfileName: profileData.setEditProfileName,
    editCategory: profileData.editCategory,
    setEditCategory: profileData.setEditCategory,
    editBioText: profileData.editBioText,
    setEditBioText: profileData.setEditBioText,
    editWebsiteLink: profileData.editWebsiteLink,
    setEditWebsiteLink: profileData.setEditWebsiteLink,
    editLogo: profileData.editLogo,
    setEditLogo: profileData.setEditLogo,
    profileSaveInFlight: profileData.profileSaveInFlight,
    applyProfilePayload: profileData.applyProfilePayload,
    loadProfileFromServer: profileData.loadProfileFromServer,
    loadProfilePosts: profileData.loadProfilePosts,
    loadProfileProducts: profileData.loadProfileProducts,
    buildProfileSaveBody: profileMedia.buildProfileSaveBody,
    showCustomPrompt: profilePrompt.showCustomPrompt,
    brandStoreOptions: profileCatalog.brandStoreOptions,
    setActiveGridTab: profileUi.setActiveGridTab,
  });

  const profileCreateActions = useProfileCreateActions({
    routeParams,
    authHydrated,
    currentUser,
    activeProfile,
    triggerHaptic,
    showCreateModal: profileUi.showCreateModal,
    setShowCreateModal: profileUi.setShowCreateModal,
    setShowLiveModal: profileUi.setShowLiveModal,
    hasActiveStory: profileStoryViewer.hasActiveStory,
    setStoryViewerIndex: profileStoryViewer.setStoryViewerIndex,
    setShowStoryViewer: profileStoryViewer.setShowStoryViewer,
    yourStorySlides: profileStoryViewer.yourStorySlides,
    displayLogo: profileData.displayLogo,
    setHighlights: profileData.setHighlights,
    showCustomPrompt: profilePrompt.showCustomPrompt,
    handleOpenAddProduct: profileEdit.handleOpenAddProduct,
    handleLaunchMediaPicker: profileMedia.handleLaunchMediaPicker,
  });

  const profileWishlist = useProfileWishlist({
    currentUser,
    activeProfile,
    triggerHaptic,
    fetchWishlist,
  });

  return buildProfileScreenBags({
    insets,
    grid: { viewer: gridViewer, openGridItem, closeViewer: closeGridViewer },
    profileData,
    catalog: profileCatalog,
    network: profileNetwork,
    settings: profileSettings,
    media: profileMedia,
    edit: profileEdit,
    createActions: profileCreateActions,
    prompt: profilePrompt,
    wishlist: profileWishlist,
    storyViewer: profileStoryViewer,
    ui: profileUi,
    store: {
      currentUser,
      userProfiles,
      authLogOut,
      addInstaStorySlide,
      wishlist,
      addToCart,
      toggleWishlist,
      activeProfile,
      highlights: profileData.highlights,
      triggerHaptic,
    },
  });
}
