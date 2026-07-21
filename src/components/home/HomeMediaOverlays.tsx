import React from "react";
import type { EdgeInsets } from "react-native-safe-area-context";
import { ImageEditor, FILTER_PRESETS } from "@/components/ImageEditor";
import { ProductPreviewSheet } from "@/components/ProductPreviewSheet";
import { ReelsSessionOverlay } from "@/components/ReelsSessionOverlay";
import { ExploreBrainOverlay } from "@/components/explore/ExploreBrainOverlay";
import { HomeNewPostOverlay } from "@/components/home/HomeNewPostOverlay";
import { HomeAiAssistantModal } from "@/components/home/HomeAiAssistantModal";
import { HomeStoryViewerModal } from "@/components/home/HomeStoryViewerModal";
import { HomeLiveSettlementModal } from "@/components/home/HomeLiveSettlementModal";
import { StoryTemplateSheet } from "@/components/stories/StoryTemplateSheet";
import { CameraStudio } from "@/components/CameraStudio";
import { LiveShowroom } from "@/components/LiveShowroom";
import { HomeSearchOverlay } from "@/components/home/HomeSearchOverlay";

type HomeMediaOverlaysProps = {
  currentUserId?: string;
  insets: EdgeInsets;
  products: any[];
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  formatPrice: (price: number) => string;
  addToCart: (product: any) => void;
  logFeedCartAdd: (feedItemId: string, productId: string) => Promise<void>;
  selectedProductForPreview: any;
  previewSheetVisible: boolean;
  previewFeedItemId?: string;
  onCloseProductPreview: () => void;
  reelsOverlayOpen: boolean;
  reelsOverlaySeed: any;
  closeReelsOverlay: () => void;
  commentCounts: Record<string, number>;
  postComments: Record<string, any[]>;
  likeCounts: Record<string, number>;
  shareCounts: Record<string, number>;
  repostCounts: Record<string, number>;
  feedMuted: boolean;
  setFeedMuted: (muted: boolean) => void;
  likedReels: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  handleMaisonProfilePress: (item: any) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleReshare: (item: any) => void;
  handleSavePress: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
  handleAdCtaPress: (ctaType: string, metadata: any) => void;
  newPost: {
    showImageEditor: boolean;
    selectedMediaUri: string | null;
    setShowImageEditor: (show: boolean) => void;
    setSelectedMediaUri: (uri: string | null) => void;
    setNewPostCaption: (caption: string) => void;
    isPublishingPost: boolean;
    newPostCaption: string;
    newPostLocation: string;
    setNewPostLocation: (location: string) => void;
    newPostAudio: string;
    setNewPostAudio: (audio: string) => void;
    newPostAI: boolean;
    setNewPostAI: (value: boolean) => void;
    newPostProduct: string;
    setNewPostProduct: (id: string) => void;
    newPostTaggedPeople: string;
    setNewPostTaggedPeople: (value: string) => void;
    selectedAudience: "everyone" | "followers" | "close_friends";
    setSelectedAudience: (audience: "everyone" | "followers" | "close_friends") => void;
    newPostShareFeed: boolean;
    setNewPostShareFeed: (value: boolean) => void;
    commentsEnabled: boolean;
    setCommentsEnabled: (value: boolean) => void;
    likesHidden: boolean;
    setLikesHidden: (value: boolean) => void;
    crossPostEnabled: boolean;
    setCrossPostEnabled: (value: boolean) => void;
    allowDownload: boolean;
    setAllowDownload: (value: boolean) => void;
    promoteReel: boolean;
    setPromoteReel: (value: boolean) => void;
    isScheduled: boolean;
    setIsScheduled: (value: boolean) => void;
    scheduledTime: string;
    setScheduledTime: (value: string) => void;
    resetNewPostDraft: () => void;
    handleSharePost: () => void | Promise<void>;
  };
  showExploreGrid: boolean;
  bottomBarHeight: number;
  setShowExploreGrid: (show: boolean) => void;
  navigateToUserProfile: (username: string) => void;
  handleOpenFeedReel: (item: any) => void;
  showAiAssistant: boolean;
  setShowAiAssistant: (show: boolean) => void;
  setSelectedProductForPreview: (product: any) => void;
  setPreviewSheetVisible: (visible: boolean) => void;
  storyViewer: {
    selectedStoriesGroup: any;
    setSelectedStoriesGroup: (group: any) => void;
    activeSlideIndex: number;
    storyProgress: number;
    storyPaused: boolean;
    setStoryPaused: (paused: boolean) => void;
    storyReplyText: string;
    setStoryReplyText: (text: string) => void;
    activeSlideAddYours: any;
    handleStoryPrev: () => void;
    handleStoryNext: () => void;
    handleSendStoryReply: () => void | Promise<void>;
    handleStoryAddYours: () => void | Promise<void>;
    openStoryTemplateSheet: () => void;
    showStoryTemplateSheet: boolean;
    setShowStoryTemplateSheet: (show: boolean) => void;
    storyTemplateLoading: boolean;
    storyTemplateDetail: any;
  };
  onStoryOpenProfile: (username: string) => void;
  onStoryOpenProduct: (productId: string) => void;
  onTemplateParticipantPress: (profileId: string, username: string) => void;
  showLiveSettlement: boolean;
  settlementData: any;
  setShowLiveSettlement: (show: boolean) => void;
  showReelCamera: boolean;
  setShowReelCamera: (show: boolean) => void;
  onReelPublished: (reel: any) => void;
  showLiveShowroom: boolean;
  setShowLiveShowroom: (show: boolean) => void;
  showroomMode: "lobby" | "viewer";
  showroomMaisonId: string;
  showroomMaisonName: string;
  showroomSessionId?: string;
  showSearchOverlay?: boolean;
  setShowSearchOverlay?: (show: boolean) => void;
  searchTiles?: any[];
  activeSearchQuery?: string;
  onSearchQuery?: (query: string) => void;
  onSearchClear?: () => void;
  listData?: any[];
  loadingFeedItems?: boolean;
};

export function HomeMediaOverlays({
  currentUserId,
  insets,
  products,
  triggerHaptic,
  formatPrice,
  addToCart,
  logFeedCartAdd,
  selectedProductForPreview,
  previewSheetVisible,
  previewFeedItemId,
  onCloseProductPreview,
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
  handleMaisonProfilePress,
  handleLikePress,
  handleCommentsPress,
  handleShare,
  handleReshare,
  handleSavePress,
  handleThreeDotsPress,
  handleAdCtaPress,
  newPost,
  showExploreGrid,
  bottomBarHeight,
  setShowExploreGrid,
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
  onReelPublished,
  showLiveShowroom,
  setShowLiveShowroom,
  showroomMode,
  showroomMaisonId,
  showroomMaisonName,
  showroomSessionId,
  showSearchOverlay,
  setShowSearchOverlay,
  searchTiles,
  activeSearchQuery,
  onSearchQuery,
  onSearchClear,
  listData,
  loadingFeedItems,
}: HomeMediaOverlaysProps) {
  return (
    <>
      {selectedProductForPreview && (
        <ProductPreviewSheet
          visible={previewSheetVisible}
          product={selectedProductForPreview}
          feedItemId={previewFeedItemId}
          onClose={onCloseProductPreview}
        />
      )}

      <ReelsSessionOverlay
        visible={reelsOverlayOpen}
        userId={currentUserId}
        seedContentId={reelsOverlaySeed?.id}
        seedItem={reelsOverlaySeed}
        onClose={closeReelsOverlay}
        triggerHaptic={triggerHaptic}
        getItemMetrics={(item) => ({
          commentsCount:
            commentCounts[item.id] ??
            postComments[item.id]?.length ??
            item.content?.commentsCount ??
            item.commentsCount ??
            0,
          likesCount: likeCounts[item.id] ?? item.likes ?? item.content?.likesCount ?? 0,
          sharesCount: shareCounts[item.id] ?? item.content?.sharesCount ?? 0,
          repostsCount: repostCounts[item.id] ?? item.content?.repostsCount ?? item.repostsCount ?? 0,
        })}
        feedCardProps={{
          feedMuted,
          setFeedMuted,
          products,
          likedPosts: likedReels,
          savedPosts,
          floatingBottomOffset: 65,
          isScreenFocused: reelsOverlayOpen,
          handleMaisonProfilePress,
          handleLikePress,
          handleCommentsPress,
          handleShare,
          handleReshare,
          handleSavePress,
          handleThreeDotsPress,
          onCtaPress: handleAdCtaPress,
        }}
      />

      <ImageEditor
        visible={newPost.showImageEditor}
        imageUri={newPost.selectedMediaUri || ""}
        onClose={() => {
          newPost.setShowImageEditor(false);
          newPost.setSelectedMediaUri(null);
        }}
        onSave={(finalUri, appliedFilter) => {
          newPost.setSelectedMediaUri(finalUri);
          newPost.setShowImageEditor(false);
          if (appliedFilter && appliedFilter !== "normal") {
            const presetName = FILTER_PRESETS.find((f) => f.id === appliedFilter)?.name || appliedFilter;
            newPost.setNewPostCaption(`[Filter: ${presetName}] `);
          }
        }}
      />

      <ExploreBrainOverlay
        visible={showExploreGrid}
        userId={currentUserId}
        bottomInset={bottomBarHeight}
        onClose={() => setShowExploreGrid(false)}
        triggerHaptic={triggerHaptic}
        onCreatorPress={(username) => {
          setShowExploreGrid(false);
          navigateToUserProfile(username);
        }}
        onGridItemPress={(item) => {
          setShowExploreGrid(false);
          handleOpenFeedReel({
            id: item.id,
            url: item.url,
            caption: item.caption,
            creator: item.creator,
            content: {
              videoUrl: item.isVideo ? item.url : undefined,
              mediaUrl: item.isVideo ? undefined : item.url,
            },
          });
        }}
      />

      <HomeNewPostOverlay
        visible={!!newPost.selectedMediaUri}
        mediaUri={newPost.selectedMediaUri || ""}
        products={products || []}
        isPublishing={newPost.isPublishingPost}
        caption={newPost.newPostCaption}
        setCaption={newPost.setNewPostCaption}
        location={newPost.newPostLocation}
        setLocation={newPost.setNewPostLocation}
        audio={newPost.newPostAudio}
        setAudio={newPost.setNewPostAudio}
        aiLabel={newPost.newPostAI}
        setAiLabel={newPost.setNewPostAI}
        productId={newPost.newPostProduct}
        setProductId={newPost.setNewPostProduct}
        taggedPeople={newPost.newPostTaggedPeople}
        setTaggedPeople={newPost.setNewPostTaggedPeople}
        audience={newPost.selectedAudience}
        setAudience={newPost.setSelectedAudience}
        shareFeed={newPost.newPostShareFeed}
        setShareFeed={newPost.setNewPostShareFeed}
        commentsEnabled={newPost.commentsEnabled}
        setCommentsEnabled={newPost.setCommentsEnabled}
        likesHidden={newPost.likesHidden}
        setLikesHidden={newPost.setLikesHidden}
        crossPostEnabled={newPost.crossPostEnabled}
        setCrossPostEnabled={newPost.setCrossPostEnabled}
        allowDownload={newPost.allowDownload}
        setAllowDownload={newPost.setAllowDownload}
        promoteReel={newPost.promoteReel}
        setPromoteReel={newPost.setPromoteReel}
        isScheduled={newPost.isScheduled}
        setIsScheduled={newPost.setIsScheduled}
        scheduledTime={newPost.scheduledTime}
        setScheduledTime={newPost.setScheduledTime}
        triggerHaptic={triggerHaptic}
        onClose={newPost.resetNewPostDraft}
        onShare={newPost.handleSharePost}
      />

      <HomeAiAssistantModal
        visible={showAiAssistant}
        products={products || []}
        formatPrice={formatPrice}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowAiAssistant(false)}
        onAddToCart={(product) => {
          addToCart(product);
          logFeedCartAdd("ask_aura_ai_bar", product?.id);
        }}
        onProductPreview={(product) => {
          setSelectedProductForPreview(product);
          setPreviewSheetVisible(true);
        }}
      />

      <HomeStoryViewerModal
        storiesGroup={storyViewer.selectedStoriesGroup}
        activeSlideIndex={storyViewer.activeSlideIndex}
        storyProgress={storyViewer.storyProgress}
        storyPaused={storyViewer.storyPaused}
        storyReplyText={storyViewer.storyReplyText}
        activeSlideAddYours={storyViewer.activeSlideAddYours}
        userId={currentUserId}
        onClose={() => storyViewer.setSelectedStoriesGroup(null)}
        onPrev={storyViewer.handleStoryPrev}
        onNext={storyViewer.handleStoryNext}
        setStoryPaused={storyViewer.setStoryPaused}
        setStoryReplyText={storyViewer.setStoryReplyText}
        onSendReply={storyViewer.handleSendStoryReply}
        onOpenProfile={onStoryOpenProfile}
        onOpenProduct={onStoryOpenProduct}
        onQuestionPress={(question) => storyViewer.setStoryReplyText(`Re: ${question} — `)}
        onAddYoursPress={storyViewer.handleStoryAddYours}
        onAddYoursStickerPress={storyViewer.openStoryTemplateSheet}
        triggerHaptic={triggerHaptic}
      />

      <StoryTemplateSheet
        visible={storyViewer.showStoryTemplateSheet}
        loading={storyViewer.storyTemplateLoading}
        template={storyViewer.storyTemplateDetail}
        onClose={() => storyViewer.setShowStoryTemplateSheet(false)}
        onAddYours={storyViewer.handleStoryAddYours}
        onParticipantPress={onTemplateParticipantPress}
      />

      <HomeLiveSettlementModal
        visible={showLiveSettlement}
        data={settlementData}
        onClose={() => setShowLiveSettlement(false)}
        triggerHaptic={triggerHaptic}
      />

      <CameraStudio
        visible={showReelCamera}
        onClose={() => setShowReelCamera(false)}
        insets={insets}
        products={products}
        onPostPublished={onReelPublished}
      />

      <LiveShowroom
        visible={showLiveShowroom}
        onClose={() => setShowLiveShowroom(false)}
        initialMode={showroomMode}
        maisonId={showroomMaisonId}
        maisonName={showroomMaisonName}
        sessionId={showroomSessionId}
      />

      <HomeSearchOverlay
        visible={!!showSearchOverlay}
        onClose={() => setShowSearchOverlay?.(false)}
        searchTiles={searchTiles || []}
        activeSearchQuery={activeSearchQuery || ""}
        onSearchQuery={onSearchQuery || (() => {})}
        onSearchClear={onSearchClear || (() => {})}
        listData={listData || []}
        loadingFeedItems={!!loadingFeedItems}
        handleOpenFeedReel={handleOpenFeedReel}
        bottomBarHeight={bottomBarHeight}
      />
    </>
  );
}
