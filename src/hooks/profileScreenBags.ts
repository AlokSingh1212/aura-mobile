import type { ProfileScreenModalsProps } from "@/components/profile/ProfileScreenModals";
import type { ProfileGridTab } from "@/lib/profileGridNavigation";
import type { useProfileData } from "@/hooks/useProfileData";
import { profileScreenStyles as styles } from "@/components/profile/profileScreenStyles";

export type ProfileScreenShellProps = {
  styles: typeof styles;
  insets: { top: number; bottom: number; left: number; right: number };
  username: string;
  isVerifiedUser: boolean;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setShowCreateModal: (v: boolean) => void;
  setShowSwitcherModal: (v: boolean) => void;
  handleOpenWishlist: () => void;
  displayLogo: string | null;
  profileName: string;
  category: string;
  bioText: string;
  websiteLink: string;
  tags: string[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  auraScore: number;
  hasActiveStory: boolean;
  isUploadingMedia: boolean;
  isPersonalProfile: boolean;
  isCreatorProfile: boolean;
  isBusinessProfile: boolean;
  highlights: { id: string; title: string; avatar: string }[];
  activeProfile: any;
  currentUser: any;
  handleProfileAvatarTap: () => void;
  handleAvatarPress: () => void;
  setNetworkTab: (v: "followers" | "following") => void;
  setShowNetworkModal: (v: boolean) => void;
  handleRemoveTag: (tag: string) => void;
  handleAddPress: () => void;
  handleEditProfilePress: () => void;
  handleShareProfile: () => void;
  handleOpenAddProduct: () => void;
  handleAddHighlight: () => void;
  activeGridTab: ProfileGridTab;
  setActiveGridTab: (tab: ProfileGridTab) => void;
  visiblePresetPosts: any[];
  visibleTaggedPosts: any[];
  displayProducts: any[];
  productCollabProducts: any[];
  showStoreLabelsOnProducts: boolean;
  openGridItem: (tab: ProfileGridTab, id: string) => void;
  handleSwitchToStoreFromProduct: (storeProfileId: string | null) => void;
};

export type ProfileScreenView = {
  shell: ProfileScreenShellProps;
  modals: ProfileScreenModalsProps;
};

type ProfileDataSlice = ReturnType<typeof useProfileData>;

type ProfileScreenBagsInput = {
  insets: ProfileScreenShellProps["insets"];
  grid: {
    viewer: any;
    openGridItem: ProfileScreenShellProps["openGridItem"];
    closeViewer: () => void;
  };
  profileData: ProfileDataSlice;
  catalog: {
    personalProfile: any;
    brandProfiles: any[];
    brandStoreOptions: ProfileScreenModalsProps["brandStoreOptions"];
    displayProducts: any[];
    showStoreLabelsOnProducts: boolean;
  };
  network: {
    showNetworkModal: boolean;
    setShowNetworkModal: (v: boolean) => void;
    networkTab: "followers" | "following";
    setNetworkTab: (v: "followers" | "following") => void;
    networkUsers: any[];
    loadingNetwork: boolean;
    shareContacts: any[];
    loadingShareContacts: boolean;
    showShareProfileSheet: boolean;
    setShowShareProfileSheet: (v: boolean) => void;
    shareSearch: string;
    setShareSearch: (v: string) => void;
    handleNetworkFollowToggle: (item: any) => void;
    handleShareProfile: () => void;
    showQrModal: boolean;
    setShowQrModal: (v: boolean) => void;
  };
  settings: {
    isVerifiedUser: boolean;
    showAccountsCenter: boolean;
    setShowAccountsCenter: (v: boolean) => void;
    activeSessions: any[];
    fediverseSharing: boolean;
    alertsEnabled: boolean;
    biometricEnabled: boolean;
    twoFactorEnabled: boolean;
    regionLockEnabled: boolean;
    handleDownloadInformation: () => void;
    handleDeactivateMaison: () => void;
    handleToggleFediverse: () => void;
    handleToggleAlerts: () => void;
    handleToggleBiometric: () => void;
    handleToggleTwoFactor: () => void;
    handleToggleRegionLock: () => void;
    handleRevokeSession: (id: string) => void;
    showPersonalDetails: boolean;
    setShowPersonalDetails: (v: boolean) => void;
    personalDob: string;
    personalGender: string;
    personalEmail: string;
    personalPhone: string;
    isUpdating: boolean;
    handleSavePersonalDetails: () => void;
    handleRequestVerification: () => void;
    setPersonalDob: (v: string) => void;
    setPersonalGender: (v: string) => void;
    setPersonalEmail: (v: string) => void;
    setPersonalPhone: (v: string) => void;
  };
  media: {
    isOpeningPicker: boolean;
    postTitle: string;
    postPrice: string;
    postDescription: string;
    postVibe: string;
    postImage: string;
    handlePublishPost: () => void;
    setPostTitle: (v: string) => void;
    setPostPrice: (v: string) => void;
    setPostDescription: (v: string) => void;
    setPostVibe: (v: string) => void;
    setPostImage: (v: string) => void;
    aiPrompt: string;
    aiProgress: number;
    aiGenerating: boolean;
    aiStep: string;
    generatedProduct: any;
    aiTitle: string;
    aiPrice: string;
    handleStartAIGeneration: () => void;
    handleMintGeneratedProduct: () => void;
    setGeneratedProduct: (v: any) => void;
    setAiPrompt: (v: string) => void;
    setAiTitle: (v: string) => void;
    setAiPrice: (v: string) => void;
  };
  edit: {
    showEditModal: boolean;
    setShowEditModal: (v: boolean) => void;
    isSavingProfile: boolean;
    handleSaveProfile: () => void;
    showSwitcherModal: boolean;
    setShowSwitcherModal: (v: boolean) => void;
    handleSwitchMaison: (id: string) => void;
    handleAddBrandProfile: () => void;
    showCreateBrandSheet: boolean;
    setShowCreateBrandSheet: (v: boolean) => void;
    handleBrandProfileCreated: () => void;
    showAddProductSheet: boolean;
    setShowAddProductSheet: (v: boolean) => void;
    handleProductCreated: () => void;
    handleRemoveTag: (tag: string) => void;
    handleAddPress: () => void;
    handleEditProfilePress: () => void;
    handleOpenAddProduct: () => void;
    handleSwitchToStoreFromProduct: (storeProfileId: string | null) => void;
  };
  createActions: {
    handleAvatarPress: () => void;
    queueCreateAction: (mode: any) => void;
    handleProfileAvatarTap: () => void;
    handleAddHighlight: () => void;
  };
  prompt: {
    promptVisible: boolean;
    promptTitle: string;
    promptDesc: string;
    promptPlaceholder: string;
    promptValue: string;
    setPromptValue: (v: string) => void;
    setPromptVisible: (v: boolean) => void;
    promptOnSubmit: ((val: string) => void) | null;
  };
  wishlist: {
    showWishlistModal: boolean;
    setShowWishlistModal: (v: boolean) => void;
    handleOpenWishlist: () => void;
  };
  storyViewer: {
    showStoryViewer: boolean;
    setShowStoryViewer: (v: boolean) => void;
    yourStorySlides: any[];
    storyViewerIndex: number;
    setStoryViewerIndex: React.Dispatch<React.SetStateAction<number>>;
    hasActiveStory: boolean;
  };
  ui: {
    activeGridTab: ProfileScreenShellProps["activeGridTab"];
    setActiveGridTab: ProfileScreenShellProps["setActiveGridTab"];
    isUploadingMedia: boolean;
    showCreateModal: boolean;
    setShowCreateModal: (v: boolean) => void;
    showPostModal: boolean;
    setShowPostModal: (v: boolean) => void;
    showLiveModal: boolean;
    setShowLiveModal: (v: boolean) => void;
    showAIModal: boolean;
    setShowAIModal: (v: boolean) => void;
  };
  store: {
    currentUser: any;
    userProfiles: any[];
    authLogOut: () => void;
    addInstaStorySlide: (slide: any) => void;
    wishlist: any[];
    addToCart: (item: any) => void;
    toggleWishlist: (uid: string, id: string) => void;
    activeProfile: any;
    highlights: ProfileScreenShellProps["highlights"];
    triggerHaptic: ProfileScreenShellProps["triggerHaptic"];
  };
};

export function buildProfileScreenBags(input: ProfileScreenBagsInput): ProfileScreenView {
  const {
    insets,
    grid,
    profileData,
    catalog,
    network,
    settings,
    media,
    edit,
    createActions,
    prompt,
    wishlist,
    storyViewer,
    ui,
    store,
  } = input;

  const modals: ProfileScreenModalsProps = {
    insets,
    showNetworkModal: network.showNetworkModal,
    setShowNetworkModal: network.setShowNetworkModal,
    networkTab: network.networkTab,
    setNetworkTab: network.setNetworkTab,
    networkUsers: network.networkUsers,
    loadingNetwork: network.loadingNetwork,
    followersCount: profileData.followersCount,
    followingCount: profileData.followingCount,
    activeProfile: store.activeProfile,
    triggerHaptic: store.triggerHaptic,
    handleNetworkFollowToggle: network.handleNetworkFollowToggle,
    showEditModal: edit.showEditModal,
    setShowEditModal: edit.setShowEditModal,
    logo: profileData.logo,
    profileName: profileData.profileName,
    editUsername: profileData.editUsername,
    editProfileName: profileData.editProfileName,
    editCategory: profileData.editCategory,
    editBioText: profileData.editBioText,
    editWebsiteLink: profileData.editWebsiteLink,
    isSavingProfile: edit.isSavingProfile,
    handleSaveProfile: edit.handleSaveProfile,
    handleAvatarPress: createActions.handleAvatarPress,
    setEditUsername: profileData.setEditUsername,
    setEditProfileName: profileData.setEditProfileName,
    setEditCategory: profileData.setEditCategory,
    setEditBioText: profileData.setEditBioText,
    setEditWebsiteLink: profileData.setEditWebsiteLink,
    showSwitcherModal: edit.showSwitcherModal,
    setShowSwitcherModal: edit.setShowSwitcherModal,
    userProfiles: store.userProfiles,
    handleSwitchMaison: edit.handleSwitchMaison,
    handleAddBrandProfile: edit.handleAddBrandProfile,
    showCreateBrandSheet: edit.showCreateBrandSheet,
    setShowCreateBrandSheet: edit.setShowCreateBrandSheet,
    handleBrandProfileCreated: edit.handleBrandProfileCreated,
    showAddProductSheet: edit.showAddProductSheet,
    setShowAddProductSheet: edit.setShowAddProductSheet,
    handleProductCreated: edit.handleProductCreated,
    brandStoreOptions: catalog.brandStoreOptions,
    isPersonalProfile: profileData.isPersonalProfile,
    showCreateModal: ui.showCreateModal,
    setShowCreateModal: ui.setShowCreateModal,
    queueCreateAction: createActions.queueCreateAction,
    isOpeningPicker: media.isOpeningPicker,
    isUploadingMedia: ui.isUploadingMedia,
    showPostModal: ui.showPostModal,
    setShowPostModal: ui.setShowPostModal,
    category: profileData.category,
    postTitle: media.postTitle,
    postPrice: media.postPrice,
    postDescription: media.postDescription,
    postVibe: media.postVibe,
    postImage: media.postImage,
    handlePublishPost: media.handlePublishPost,
    setPostTitle: media.setPostTitle,
    setPostPrice: media.setPostPrice,
    setPostDescription: media.setPostDescription,
    setPostVibe: media.setPostVibe,
    setPostImage: media.setPostImage,
    showLiveModal: ui.showLiveModal,
    setShowLiveModal: ui.setShowLiveModal,
    username: profileData.username,
    showAIModal: ui.showAIModal,
    setShowAIModal: ui.setShowAIModal,
    aiPrompt: media.aiPrompt,
    aiProgress: media.aiProgress,
    aiGenerating: media.aiGenerating,
    aiStep: media.aiStep,
    generatedProduct: media.generatedProduct,
    aiTitle: media.aiTitle,
    aiPrice: media.aiPrice,
    handleStartAIGeneration: media.handleStartAIGeneration,
    handleMintGeneratedProduct: media.handleMintGeneratedProduct,
    setGeneratedProduct: media.setGeneratedProduct,
    setAiPrompt: media.setAiPrompt,
    setAiTitle: media.setAiTitle,
    setAiPrice: media.setAiPrice,
    showAccountsCenter: settings.showAccountsCenter,
    setShowAccountsCenter: settings.setShowAccountsCenter,
    personalProfile: catalog.personalProfile,
    brandProfiles: catalog.brandProfiles,
    currentUser: store.currentUser,
    activeSessions: settings.activeSessions,
    fediverseSharing: settings.fediverseSharing,
    alertsEnabled: settings.alertsEnabled,
    biometricEnabled: settings.biometricEnabled,
    twoFactorEnabled: settings.twoFactorEnabled,
    regionLockEnabled: settings.regionLockEnabled,
    handleDownloadInformation: settings.handleDownloadInformation,
    handleDeactivateMaison: settings.handleDeactivateMaison,
    handleToggleFediverse: settings.handleToggleFediverse,
    handleToggleAlerts: settings.handleToggleAlerts,
    handleToggleBiometric: settings.handleToggleBiometric,
    handleToggleTwoFactor: settings.handleToggleTwoFactor,
    handleToggleRegionLock: settings.handleToggleRegionLock,
    handleRevokeSession: settings.handleRevokeSession,
    authLogOut: store.authLogOut,
    showPersonalDetails: settings.showPersonalDetails,
    setShowPersonalDetails: settings.setShowPersonalDetails,
    personalDob: settings.personalDob,
    personalGender: settings.personalGender,
    personalEmail: settings.personalEmail,
    personalPhone: settings.personalPhone,
    isVerifiedUser: settings.isVerifiedUser,
    isUpdating: settings.isUpdating,
    handleSavePersonalDetails: settings.handleSavePersonalDetails,
    handleRequestVerification: settings.handleRequestVerification,
    setPersonalDob: settings.setPersonalDob,
    setPersonalGender: settings.setPersonalGender,
    setPersonalEmail: settings.setPersonalEmail,
    setPersonalPhone: settings.setPersonalPhone,
    showShareProfileSheet: network.showShareProfileSheet,
    setShowShareProfileSheet: network.setShowShareProfileSheet,
    showQrModal: network.showQrModal,
    setShowQrModal: network.setShowQrModal,
    shareSearch: network.shareSearch,
    setShareSearch: network.setShareSearch,
    shareContacts: network.shareContacts,
    loadingShareContacts: network.loadingShareContacts,
    addInstaStorySlide: store.addInstaStorySlide,
    showStoryViewer: storyViewer.showStoryViewer,
    setShowStoryViewer: storyViewer.setShowStoryViewer,
    displayLogo: profileData.displayLogo,
    yourStorySlides: storyViewer.yourStorySlides,
    storyViewerIndex: storyViewer.storyViewerIndex,
    setStoryViewerIndex: storyViewer.setStoryViewerIndex,
    promptVisible: prompt.promptVisible,
    promptTitle: prompt.promptTitle,
    promptDesc: prompt.promptDesc,
    promptPlaceholder: prompt.promptPlaceholder,
    promptValue: prompt.promptValue,
    setPromptValue: prompt.setPromptValue,
    setPromptVisible: prompt.setPromptVisible,
    promptOnSubmit: prompt.promptOnSubmit,
    showWishlistModal: wishlist.showWishlistModal,
    setShowWishlistModal: wishlist.setShowWishlistModal,
    wishlist: store.wishlist,
    addToCart: store.addToCart,
    toggleWishlist: store.toggleWishlist,
    gridViewer: grid.viewer,
    closeGridViewer: grid.closeViewer,
    visiblePresetPosts: profileData.visiblePresetPosts,
    visibleTaggedPosts: profileData.visibleTaggedPosts,
    productCollabProducts: profileData.productCollabProducts,
    displayProducts: catalog.displayProducts,
    setPresetPosts: profileData.setPresetPosts,
    loadProfileFromServer: profileData.loadProfileFromServer,
  };

  const shell: ProfileScreenShellProps = {
    styles,
    insets,
    username: profileData.username,
    isVerifiedUser: settings.isVerifiedUser,
    triggerHaptic: store.triggerHaptic,
    setShowCreateModal: ui.setShowCreateModal,
    setShowSwitcherModal: edit.setShowSwitcherModal,
    handleOpenWishlist: wishlist.handleOpenWishlist,
    displayLogo: profileData.displayLogo,
    profileName: profileData.profileName,
    category: profileData.category,
    bioText: profileData.bioText,
    websiteLink: profileData.websiteLink,
    tags: profileData.tags,
    postsCount: profileData.postsCount,
    followersCount: profileData.followersCount,
    followingCount: profileData.followingCount,
    auraScore: profileData.auraScore,
    hasActiveStory: storyViewer.hasActiveStory,
    isUploadingMedia: ui.isUploadingMedia,
    isPersonalProfile: profileData.isPersonalProfile,
    isCreatorProfile: profileData.isCreatorProfile,
    isBusinessProfile: profileData.isBusinessProfile,
    highlights: store.highlights,
    activeProfile: store.activeProfile,
    currentUser: store.currentUser,
    handleProfileAvatarTap: createActions.handleProfileAvatarTap,
    handleAvatarPress: createActions.handleAvatarPress,
    setNetworkTab: network.setNetworkTab,
    setShowNetworkModal: network.setShowNetworkModal,
    handleRemoveTag: edit.handleRemoveTag,
    handleAddPress: edit.handleAddPress,
    handleEditProfilePress: edit.handleEditProfilePress,
    handleShareProfile: network.handleShareProfile,
    handleOpenAddProduct: edit.handleOpenAddProduct,
    handleAddHighlight: createActions.handleAddHighlight,
    activeGridTab: ui.activeGridTab,
    setActiveGridTab: ui.setActiveGridTab,
    visiblePresetPosts: profileData.visiblePresetPosts,
    visibleTaggedPosts: profileData.visibleTaggedPosts,
    displayProducts: catalog.displayProducts,
    productCollabProducts: profileData.productCollabProducts,
    showStoreLabelsOnProducts: catalog.showStoreLabelsOnProducts,
    openGridItem: grid.openGridItem,
    handleSwitchToStoreFromProduct: edit.handleSwitchToStoreFromProduct,
  };

  return { modals, shell };
}
