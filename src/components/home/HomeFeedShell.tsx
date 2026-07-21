import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeFeedHeader } from "@/components/home/HomeFeedHeader";
import { HomeStoriesStrip } from "@/components/home/HomeStoriesStrip";
import { HomeCategoryChips } from "@/components/home/HomeCategoryChips";
import { HomePostsFeedTab } from "@/components/home/HomePostsFeedTab";
import { HomeReelsFeedTab } from "@/components/home/HomeReelsFeedTab";
import { homeShellStyles as styles } from "@/components/home/homeShellStyles";
import type { HomeFeedItemRenderContext } from "@/components/home/HomeFeedItemRenderer";

type HomeFeedTab = "grid" | "reels" | "live" | "posts";

type HomeFeedShellProps = {
  activeFeedTab: HomeFeedTab;
  isReelsFullScreen: boolean;
  bottomBarHeight: number;
  selectedCategory: string;
  activeProfile: any;
  unreadNotificationsCount: number;
  cartItemCount: number;
  searchTiles?: any[];
  activeSearchQuery?: string;
  showSearchOverlay?: boolean;
  setShowSearchOverlay?: (show: boolean) => void;
  handleOpenFeedReel?: (item: any) => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  onCategoryChange: (category: string) => void;
  onSearchClear: () => void;
  onSearchQuery: (query: string) => void;
  onOpenProfileSwitcher: () => void;
  onOpenActivity: () => void;
  profileLogo: string | null;
  profileTabInitial?: string;
  isCurrentlyLive: boolean;
  myLiveSession: any;
  yourStoryHasSlides: boolean;
  yourStoryNode: any;
  otherLiveSessions: any[];
  visibleInstaStories: any[];
  onOpenLiveShowroom: (payload: {
    mode: "lobby" | "viewer";
    maisonId: string;
    maisonName: string;
    sessionId?: string;
  }) => void;
  onOpenStoryGroup: (group: any) => void;
  onSelectCategory: (chip: string) => void;
  displayStories: any[];
  loadingFeed: boolean;
  storiesLength: number;
  reelHeight: number;
  activeStoryIndex: number;
  isScreenFocused: boolean;
  feedMuted: boolean;
  setFeedMuted: (muted: boolean) => void;
  products: any[];
  likedReels: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  floatingBottomOffset: number;
  commentCounts: Record<string, number>;
  likeCounts: Record<string, number>;
  shareCounts: Record<string, number>;
  repostCounts: Record<string, number>;
  postComments: Record<string, any[]>;
  reelsHandlers: {
    handleMaisonProfilePress: (item: any) => void;
    handleLikePress: (id: string) => void;
    handleCommentsPress: (item: any) => void;
    handleShare: (item: any) => void;
    handleReshare: (item: any) => void;
    handleSavePress: (id: string) => void;
    handleThreeDotsPress: (item: any) => void;
    handleAdCtaPress: (ctaType: string, metadata: any) => void;
  };
  onReelsViewableItemsChanged: (info: any) => void;
  loadMoreStories: () => void;
  onReelsContainerLayout: (height: number) => void;
  onOpenReelRecorder: () => void;
  topInset: number;
  reelsFlatListRef: React.RefObject<any>;
  listData: any[];
  loadingFeedItems: boolean;
  feedItemCtx: HomeFeedItemRenderContext;
  getItemLayout: (data: any, index: number) => { length: number; offset: number; index: number };
  onPostsViewableItemsChanged: (info: { viewableItems: any[] }) => void;
  viewabilityConfig: any;
};

export function HomeFeedShell({
  activeFeedTab,
  isReelsFullScreen,
  bottomBarHeight,
  selectedCategory,
  activeProfile,
  unreadNotificationsCount,
  cartItemCount,
  searchTiles,
  activeSearchQuery,
  showSearchOverlay,
  setShowSearchOverlay,
  handleOpenFeedReel,
  triggerHaptic,
  onCategoryChange,
  onSearchClear,
  onSearchQuery,
  onOpenProfileSwitcher,
  onOpenActivity,
  profileLogo,
  profileTabInitial,
  isCurrentlyLive,
  myLiveSession,
  yourStoryHasSlides,
  yourStoryNode,
  otherLiveSessions,
  visibleInstaStories,
  onOpenLiveShowroom,
  onOpenStoryGroup,
  onSelectCategory,
  displayStories,
  loadingFeed,
  storiesLength,
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
  reelsHandlers,
  onReelsViewableItemsChanged,
  loadMoreStories,
  onReelsContainerLayout,
  onOpenReelRecorder,
  topInset,
  reelsFlatListRef,
  listData,
  loadingFeedItems,
  feedItemCtx,
  getItemLayout,
  onPostsViewableItemsChanged,
  viewabilityConfig,
}: HomeFeedShellProps) {
  const hideChrome = isReelsFullScreen && activeFeedTab === "reels";
  const showPostsChrome = !hideChrome && activeFeedTab === "posts";

  return (
    <SafeAreaView
      style={[
        styles.safeAreaContainer,
        activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" },
        { marginBottom: bottomBarHeight },
      ]}
      edges={["top"]}
    >
      {!hideChrome && (
        <HomeFeedHeader
          activeFeedTab={activeFeedTab}
          selectedCategory={selectedCategory}
          activeProfile={activeProfile}
          unreadNotificationsCount={unreadNotificationsCount}
          cartItemCount={cartItemCount}
          triggerHaptic={triggerHaptic}
          onCategoryChange={onCategoryChange}
          onSearchClear={onSearchClear}
          onSearchQuery={onSearchQuery}
          onOpenProfileSwitcher={onOpenProfileSwitcher}
          onOpenActivity={onOpenActivity}
          onOpenSearchOverlay={() => setShowSearchOverlay?.(true)}
        />
      )}

      {showPostsChrome && (
        <HomeStoriesStrip
          profileLogo={profileLogo}
          profileTabInitial={profileTabInitial || "U"}
          isCurrentlyLive={isCurrentlyLive}
          myLiveSession={myLiveSession}
          yourStoryHasSlides={yourStoryHasSlides}
          yourStoryNode={yourStoryNode}
          otherLiveSessions={otherLiveSessions}
          visibleInstaStories={visibleInstaStories}
          triggerHaptic={triggerHaptic}
          onOpenLiveShowroom={onOpenLiveShowroom}
          onOpenStoryGroup={onOpenStoryGroup}
        />
      )}

      {showPostsChrome && (
        <HomeCategoryChips
          selectedCategory={selectedCategory}
          triggerHaptic={triggerHaptic}
          onSelectCategory={onSelectCategory}
        />
      )}

      <View style={[styles.feedWrapper, activeFeedTab === "posts" && { backgroundColor: "#FFFFFF" }]}>
        {activeFeedTab === "reels" ? (
          <HomeReelsFeedTab
            displayStories={displayStories}
            loadingFeed={loadingFeed}
            storiesLength={storiesLength}
            reelHeight={reelHeight}
            activeStoryIndex={activeStoryIndex}
            isScreenFocused={isScreenFocused}
            feedMuted={feedMuted}
            setFeedMuted={setFeedMuted}
            products={products}
            likedReels={likedReels}
            savedPosts={savedPosts}
            floatingBottomOffset={floatingBottomOffset}
            commentCounts={commentCounts}
            likeCounts={likeCounts}
            shareCounts={shareCounts}
            repostCounts={repostCounts}
            postComments={postComments}
            handlers={reelsHandlers}
            onViewableItemsChanged={onReelsViewableItemsChanged}
            loadMoreStories={loadMoreStories}
            onReelsContainerLayout={onReelsContainerLayout}
            onOpenReelRecorder={onOpenReelRecorder}
            topInset={topInset}
            flatListRef={reelsFlatListRef}
          />
        ) : (
          <HomePostsFeedTab
            listData={listData}
            loadingFeedItems={loadingFeedItems}
            bottomBarHeight={bottomBarHeight}
            feedItemCtx={feedItemCtx}
            getItemLayout={getItemLayout}
            onViewableItemsChanged={onPostsViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            loadMoreStories={loadMoreStories}
            loadingFeed={loadingFeed}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
