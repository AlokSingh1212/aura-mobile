import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { getProfileDisplayName } from "@/lib/sessionIdentity";
import { useLayoutCache } from "@/utils/useLayoutCache";
import { normalizeUsername } from "@/lib/postNavigation";
import { useSocialGraph } from "@/hooks/useSocialGraph";
import { useHomeStoryViewer } from "@/hooks/useHomeStoryViewer";
import { useHomeFeedEngagement } from "@/hooks/useHomeFeedEngagement";
import { useHomeOnboarding } from "@/hooks/useHomeOnboarding";
import { useHomeAdActions } from "@/hooks/useHomeAdActions";
import { useHomeAddProfile } from "@/hooks/useHomeAddProfile";
import { useHomeReelsFeed } from "@/hooks/useHomeReelsFeed";
import { useHomeNewPost } from "@/hooks/useHomeNewPost";
import { useHomeReelsPlayback } from "@/hooks/useHomeReelsPlayback";
import { useHomeHeartBurst } from "@/hooks/useHomeHeartBurst";
import { useHomeLiveSessions } from "@/hooks/useHomeLiveSessions";
import { useHomeRouteEffects } from "@/hooks/useHomeRouteEffects";
import { useHomeFeedList } from "@/hooks/useHomeFeedList";
import { useHomeFeedItemContext } from "@/hooks/useHomeFeedItemContext";
import { useHomeVisibleStories } from "@/hooks/useHomeVisibleStories";
import { useHomeProfileNavigation } from "@/hooks/useHomeProfileNavigation";
import { useHomePostsFeedTelemetry } from "@/hooks/useHomePostsFeedTelemetry";
import { useHomeActivityPolling } from "@/hooks/useHomeActivityPolling";
import { useHomeBottomNavHandlers } from "@/hooks/useHomeBottomNavHandlers";
import { useHomeThreeDotsActions } from "@/hooks/useHomeThreeDotsActions";
import { useHomeBootstrapEffects } from "@/hooks/useHomeBootstrapEffects";
import { unreadNotificationCount } from "@/lib/notificationDisplay";
import { useHomeFeedLayout } from "@/hooks/useHomeFeedLayout";
import { useHomeStoryOverlayActions } from "@/hooks/useHomeStoryOverlayActions";
import { useHomeCategoryFeed } from "@/hooks/useHomeCategoryFeed";
import { INFLUENCER_CATEGORIES } from "@/components/home/homeOnboardingConstants";
import type { TabKey } from "@/components/shop/AuraBottomNav";
import { homeShellStyles as styles } from "@/components/home/homeShellStyles";

const { height } = Dimensions.get("window");

export type HomeScreenGate = "loading" | "unauthenticated" | "suspended" | "ready";

export function useHomeScreen() {
  const {
    products,
    stories,
    loadingFeed,
    fetchFeed,
    fetchProducts,
    triggerHaptic,
    activeMaisonId,
    currentUser,
    authHydrated,
    authOnboard,
    activeProfile,
    userProfiles,
    createNewProfile,
    switchActiveProfile,
    fetchProfiles,
    notifications,
    loadingNotifications,
    fetchNotifications,
    markNotificationsRead,
    hasMoreFeed,
    detectLocation,
    feedItems,
    reelsSponsoredAd,
    loadingFeedItems,
    fetchFeedItems,
    fetchSearchResults,
    searchTiles,
    activeSearchQuery,
    logEngagement,
    toggleFeedSave,
    logFeedCartAdd,
    cart,
    formatPrice,
    addToCart,
    isAccountSuspended,
    authLogOut,
  } = useStore();

  const {
    graph: socialGraph,
    version: socialGraphVersion,
    hideFeedPost,
    archiveFeedPost,
    muteAccount,
    blockAccount,
  } = useSocialGraph();

  const loadUserStories = useStore((s) => s.loadUserStories);
  const loadStoryRings = useStore((s) => s.loadStoryRings);
  const { instaStories: activeInstaStories } = useStore();

  const params = useLocalSearchParams<{
    openDMs?: string;
    openInbox?: string;
    openSearch?: string;
    activeTab?: string;
    openCamera?: string;
    conversationId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { getLayoutHeight } = useLayoutCache();
  const isScreenFocused = useIsFocused();

  const currentMaisonName = getProfileDisplayName(activeProfile, currentUser);
  const profileLogo = activeProfile?.logo || null;
  const profileTabInitial = (getProfileDisplayName(activeProfile, currentUser) || "U")[0]?.toUpperCase();

  const onboarding = useHomeOnboarding({
    currentUser,
    authHydrated,
    userProfiles,
    isScreenFocused,
    authOnboard,
    triggerHaptic,
  });

  const adActions = useHomeAdActions({
    products: products || [],
    currentUser,
    triggerHaptic,
  });

  const addProfile = useHomeAddProfile({
    currentUser,
    createNewProfile,
    triggerHaptic,
  });

  const newPost = useHomeNewPost({
    currentUser,
    activeProfile,
    fetchFeed,
    triggerHaptic,
  });

  const liveSessions = useHomeLiveSessions({
    currentUserId: currentUser?.id,
    activeProfile,
  });

  const [reelsContainerHeight, setReelsContainerHeight] = useState(0);
  const [tappedReelItem] = useState<any>(null);
  const reelsFlatListRef = useRef<FlatList>(null);

  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [showExploreGrid, setShowExploreGrid] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("For You");
  const [previewSheetVisible, setPreviewSheetVisible] = useState(false);
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<any>(null);
  const [previewFeedItemId, setPreviewFeedItemId] = useState<string | undefined>(undefined);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<"grid" | "reels" | "live" | "posts">("posts");
  const [activeFeedItemIndex, setActiveFeedItemIndex] = useState(0);
  const [leadGenVisible, setLeadGenVisible] = useState(false);
  const [leadGenMeta, setLeadGenMeta] = useState<any>({});
  const [showReelCamera, setShowReelCamera] = useState(false);
  const [localReels, setLocalReels] = useState<any[]>([]);
  const [isReelsFullScreen, setIsReelsFullScreen] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showLiveSettlement, setShowLiveSettlement] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);

  const loadMoreStories = useCallback(() => {
    if (hasMoreFeed && !loadingFeed) {
      fetchFeed();
    }
  }, [fetchFeed, hasMoreFeed, loadingFeed]);

  const openReelRecorder = useCallback(() => {
    triggerHaptic("medium");
    setShowReelCamera(true);
  }, [triggerHaptic]);

  useHomeBootstrapEffects({
    detectLocation,
    currentUser,
    authHydrated,
    activeProfileLogo: activeProfile?.logo,
    loadUserStories,
    loadStoryRings,
    fetchProfiles,
    fetchFeed,
    fetchProducts,
    fetchFeedItems,
  });

  useHomeActivityPolling({
    activeProfileId: activeProfile?.id,
    fetchNotifications,
  });

  const storyViewer = useHomeStoryViewer({
    activeInstaStories,
    currentUser,
    activeProfile,
    triggerHaptic,
  });

  const { setSelectedStoriesGroup, openStoriesGroup, setShowStoryTemplateSheet } = storyViewer;

  const yourStoryNode = activeInstaStories.find((s) => s.isYourStory);
  const yourStoryHasSlides =
    (yourStoryNode?.slides?.filter((sl: { url?: string }) => sl?.url)?.length || 0) > 0;

  useHomeRouteEffects({
    params,
    activeProfile,
    fetchNotifications,
    setShowActivityDrawer,
    setShowExploreGrid,
    setActiveFeedTab,
    setIsReelsFullScreen,
    setShowReelCamera,
    triggerHaptic,
  });

  const {
    showLiveShowroom,
    setShowLiveShowroom,
    myLiveSession,
    isCurrentlyLive,
    otherLiveSessions,
    showroomMode,
    setShowroomMode,
    showroomMaisonId,
    setShowroomMaisonId,
    showroomMaisonName,
    setShowroomMaisonName,
    showroomSessionId,
    setShowroomSessionId,
  } = liveSessions;

  const { bottomBarHeight, getItemLayout, reelHeight, floatingBottomOffset } = useHomeFeedLayout({
    windowHeight: height,
    insets,
    getLayoutHeight,
    isReelsFullScreen,
    activeFeedTab,
    reelsContainerHeight,
  });

  const { displayStories } = useHomeReelsFeed({
    feedItems,
    stories,
    localReels,
    reelsSponsoredAd,
    tappedReelItem,
    socialGraph,
    socialGraphVersion,
    activeProfileId: activeProfile?.id,
    currentUserId: currentUser?.id,
  });

  const reelsPlayback = useHomeReelsPlayback({
    displayStories,
    activeFeedTab,
    showReelCamera,
    currentUserId: currentUser?.id,
    triggerHaptic,
  });

  const {
    activeStoryIndex,
    reelsOverlayOpen,
    reelsOverlaySeed,
    feedMuted,
    setFeedMuted,
    handleOpenFeedReel,
    closeReelsOverlay,
    onViewableItemsChanged,
  } = reelsPlayback;

  const homeFeedEngagement = useHomeFeedEngagement({
    feedItems,
    currentUser,
    activeProfile,
    triggerHaptic,
    toggleFeedSave,
    logEngagement,
    findShareItem: (id) => displayStories.find((s: any) => s.id === id),
  });

  const {
    likedReels,
    likeCounts,
    commentCounts,
    shareCounts,
    repostCounts,
    savedPosts,
    postComments,
    justFollowedProfiles,
    showShareSheet,
    setShowShareSheet,
    shareTargetPost,
    setShareTargetPost,
    shareLink,
    setShareLink,
    showReshareSheet,
    setShowReshareSheet,
    reshareTargetPost,
    setReshareTargetPost,
    showThreeDotsModal,
    setShowThreeDotsModal,
    threeDotsTargetPost,
    showReportModal,
    setShowReportModal,
    reportTargetProfileId,
    setReportTargetProfileId,
    reportTargetPostId,
    setReportTargetPostId,
    showCommentsModal,
    setShowCommentsModal,
    commentsTargetPost,
    newCommentText,
    setNewCommentText,
    likedComments,
    setLikedComments,
    commentLikeCounts,
    setCommentLikeCounts,
    expandedComments,
    setExpandedComments,
    replyingTo,
    setReplyingTo,
    commentInputRef,
    submitFeedComment,
    handleReportSubmit,
    handleFollowPress,
    handleCommentsPress,
    handleThreeDotsPress,
    handleSavePress,
    handleLikePress,
    handleShare,
    buildReshareTarget,
    handleReshare,
    handleFeedItemSave,
    setShareCounts,
    setRepostCounts,
  } = homeFeedEngagement;

  const { navigateToUserProfile, handleMaisonProfilePress } = useHomeProfileNavigation({
    activeProfile,
    activeMaisonId,
    userProfiles,
    triggerHaptic,
    setShowCommentsModal,
    setShowActivityDrawer,
  });

  const { heartAnimItem, heartAnimScale, heartAnimOpacity, triggerHeartBurst } = useHomeHeartBurst();

  const unreadNotificationsCount = unreadNotificationCount(notifications ?? []);

  const { listData } = useHomeFeedList({
    feedItems,
    socialGraph,
    socialGraphVersion,
    activeProfileId: activeProfile?.id,
  });

  const { feedItemCtx } = useHomeFeedItemContext({
    activeFeedItemIndex,
    products,
    feedMuted,
    isScreenFocused,
    likedReels,
    savedPosts,
    likeCounts,
    commentCounts,
    shareCounts,
    repostCounts,
    postComments,
    activeProfile,
    justFollowedProfiles,
    heartAnimItem,
    heartAnimScale,
    heartAnimOpacity,
    triggerHaptic,
    setShowAiAssistant,
    handleLikePress,
    handleCommentsPress,
    handleShare,
    handleReshare,
    handleFeedItemSave,
    handleThreeDotsPress,
    handleFollowPress,
    triggerHeartBurst,
    handleOpenFeedReel,
    handleAdCtaPress: adActions.handleAdCtaPress,
    setSelectedProductForPreview,
    setPreviewFeedItemId,
    setPreviewSheetVisible,
    formatPrice,
    addToCart,
    logFeedCartAdd,
    logEngagement,
    setShowroomMode,
    setShowroomMaisonId,
    setShowroomMaisonName,
    setShowroomSessionId,
    setShowLiveShowroom,
    setFeedMuted,
  });

  const { feedEngagement, onPostsViewableItemsChanged } = useHomePostsFeedTelemetry({
    userId: currentUser?.id,
    listData,
    enabled: activeFeedTab === "posts" && isScreenFocused,
    isScreenFocused,
    activeFeedTab,
    setActiveFeedItemIndex,
  });

  const { visibleInstaStories } = useHomeVisibleStories({
    activeInstaStories,
    socialGraph,
    socialGraphVersion,
    activeProfileId: activeProfile?.id,
  });

  const isOwnThreeDotsPost =
    !!threeDotsTargetPost &&
    (threeDotsTargetPost.creator?.id === activeProfile?.id ||
      normalizeUsername(threeDotsTargetPost.creator?.username || "") ===
        normalizeUsername(activeProfile?.username || ""));

  const { threeDotsHandlers } = useHomeThreeDotsActions({
    threeDotsTargetPost,
    activeProfile,
    triggerHaptic,
    setShowThreeDotsModal,
    handleSavePress,
    handleShare,
    archiveFeedPost,
    hideFeedPost,
    muteAccount,
    blockAccount,
    setReportTargetProfileId,
    setReportTargetPostId,
    setShowReportModal,
  });

  const { handleCategorySelect } = useHomeCategoryFeed({
    setSelectedCategory,
    fetchFeedItems,
  });

  const { onStoryOpenProfile, onStoryOpenProduct, onTemplateParticipantPress } = useHomeStoryOverlayActions({
    setSelectedStoriesGroup,
    setShowStoryTemplateSheet,
    fetchSearchResults,
    setSelectedCategory,
    setActiveFeedTab,
    navigateToUserProfile,
    triggerHaptic,
  });

  const bottomNavTab: TabKey = activeFeedTab === "reels" && isReelsFullScreen ? "reels" : "home";

  const { homeTabHandlers } = useHomeBottomNavHandlers({
    setShowExploreGrid,
    setIsReelsFullScreen,
    setActiveFeedTab,
  });

  const feedHandlers = {
    handleMaisonProfilePress,
    handleLikePress,
    handleCommentsPress,
    handleShare,
    handleReshare,
    handleSavePress,
    handleThreeDotsPress,
    handleAdCtaPress: adActions.handleAdCtaPress,
  };

  let gate: HomeScreenGate = "ready";
  if (!authHydrated) gate = "loading";
  else if (!currentUser) gate = "unauthenticated";
  else if (isAccountSuspended) gate = "suspended";

  return {
    gate,
    suspension: { triggerHaptic, authLogOut },
    containerStyle: [styles.container, activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" }],
    statusBarStyle: activeFeedTab === "posts" ? ("dark" as const) : ("light" as const),
    bottomNav: { activeTab: bottomNavTab, homeTabHandlers },
    feedShell: {
      activeFeedTab,
      isReelsFullScreen,
      bottomBarHeight,
      selectedCategory,
      activeProfile,
      unreadNotificationsCount,
      cartItemCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      searchTiles,
      activeSearchQuery,
      showSearchOverlay,
      setShowSearchOverlay,
      handleOpenFeedReel,
      triggerHaptic,
      onCategoryChange: setSelectedCategory,
      onSearchClear: () => fetchFeedItems("", "For You", true),
      onSearchQuery: fetchSearchResults,
      onOpenProfileSwitcher: () => {
        triggerHaptic("medium");
        setShowProfileSwitcher(true);
      },
      onOpenActivity: () => {
        setShowActivityDrawer(true);
        if (activeProfile?.id) {
          markNotificationsRead(activeProfile.id);
        }
      },
      profileLogo,
      profileTabInitial,
      isCurrentlyLive,
      myLiveSession,
      yourStoryHasSlides,
      yourStoryNode,
      otherLiveSessions,
      visibleInstaStories,
      onOpenLiveShowroom: ({
        mode,
        maisonId,
        maisonName,
        sessionId,
      }: {
        mode: "lobby" | "viewer";
        maisonId: string;
        maisonName: string;
        sessionId?: string;
      }) => {
        setShowroomMode(mode);
        setShowroomMaisonId(maisonId);
        setShowroomMaisonName(maisonName);
        setShowroomSessionId(sessionId);
        setShowLiveShowroom(true);
      },
      onOpenStoryGroup: openStoriesGroup,
      onSelectCategory: handleCategorySelect,
      displayStories,
      loadingFeed,
      storiesLength: stories.length,
      reelHeight,
      activeStoryIndex,
      isScreenFocused,
      feedMuted,
      setFeedMuted,
      products,
      likedReels,
      savedPosts,
      floatingBottomOffset,
      commentCounts,
      likeCounts,
      shareCounts,
      repostCounts,
      postComments,
      reelsHandlers: feedHandlers,
      onReelsViewableItemsChanged: onViewableItemsChanged,
      loadMoreStories,
      onReelsContainerLayout: setReelsContainerHeight,
      onOpenReelRecorder: openReelRecorder,
      topInset: insets.top,
      reelsFlatListRef,
      listData,
      loadingFeedItems,
      feedItemCtx,
      getItemLayout,
      onPostsViewableItemsChanged,
      viewabilityConfig: feedEngagement.viewabilityConfig,
    },
    mediaOverlays: {
      currentUserId: currentUser?.id,
      insets,
      products,
      triggerHaptic,
      formatPrice,
      addToCart,
      logFeedCartAdd,
      selectedProductForPreview,
      previewSheetVisible,
      previewFeedItemId,
      onCloseProductPreview: () => {
        setPreviewSheetVisible(false);
        setSelectedProductForPreview(null);
        setPreviewFeedItemId(undefined);
      },
      reelsOverlayOpen,
      reelsOverlaySeed,
      closeReelsOverlay,
      commentCounts,
      postComments,
      likeCounts,
      shareCounts,
      repostCounts,
      feedMuted,
      setFeedMuted,
      likedReels,
      savedPosts,
      ...feedHandlers,
      newPost,
      showExploreGrid,
      bottomBarHeight,
      setShowExploreGrid,
      showSearchOverlay,
      setShowSearchOverlay,
      searchTiles,
      activeSearchQuery,
      onSearchQuery: fetchSearchResults,
      onSearchClear: () => fetchFeedItems("", "For You", true),
      listData,
      loadingFeedItems,
      navigateToUserProfile,
      handleOpenFeedReel,
      showAiAssistant,
      setShowAiAssistant,
      setSelectedProductForPreview,
      setPreviewSheetVisible,
      storyViewer,
      onStoryOpenProfile,
      onStoryOpenProduct,
      onTemplateParticipantPress,
      showLiveSettlement,
      settlementData,
      setShowLiveSettlement,
      showReelCamera,
      setShowReelCamera,
      onReelPublished: (reel: any) => setLocalReels((prev: any[]) => [reel, ...prev]),
      showLiveShowroom,
      setShowLiveShowroom,
      showroomMode,
      showroomMaisonId,
      showroomMaisonName,
      showroomSessionId,
    },
    engagementModals: {
      sheetHeight: height * 0.7,
      bottomInset: insets.bottom,
      currentMaisonName,
      isOwnThreeDotsPost,
      showShareSheet,
      setShowShareSheet,
      shareTargetPost,
      setShareTargetPost,
      shareLink,
      setShareLink,
      setShareCounts,
      showReshareSheet,
      setShowReshareSheet,
      reshareTargetPost,
      setReshareTargetPost,
      buildReshareTarget,
      setRepostCounts,
      showReportModal,
      setShowReportModal,
      reportTargetProfileId,
      reportTargetPostId,
      handleReportSubmit,
      showThreeDotsModal,
      threeDotsHandlers,
      showCommentsModal,
      setShowCommentsModal,
      commentsTargetPost,
      postComments,
      likedComments,
      setLikedComments,
      commentLikeCounts,
      setCommentLikeCounts,
      expandedComments,
      setExpandedComments,
      newCommentText,
      setNewCommentText,
      replyingTo,
      setReplyingTo,
      commentInputRef,
      triggerHaptic,
      submitFeedComment,
      navigateToUserProfile,
    },
    accountModals: {
      isScreenFocused,
      ...onboarding,
      influencerCategories: INFLUENCER_CATEGORIES,
      showProfileSwitcher,
      setShowProfileSwitcher,
      userProfiles,
      activeProfile,
      switchActiveProfile,
      onAddProfile: () => addProfile.setShowAddProfileModal(true),
      showActivityDrawer,
      setShowActivityDrawer,
      currentUserId: currentUser?.id,
      notifications,
      loadingNotifications,
      fetchNotifications,
      navigateToUserProfile,
      addProfile,
      browserModalVisible: adActions.browserModalVisible,
      setBrowserModalVisible: adActions.setBrowserModalVisible,
      browserUrl: adActions.browserUrl,
      productsSheetVisible: adActions.productsSheetVisible,
      setProductsSheetVisible: adActions.setProductsSheetVisible,
      productsSheetItems: adActions.productsSheetItems,
      leadGenVisible,
      setLeadGenVisible,
      leadGenMeta,
      triggerHaptic,
    },
  };
}
