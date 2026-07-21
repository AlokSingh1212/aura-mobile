import { useMemo } from "react";
import type { HomeFeedItemRenderContext } from "@/components/home/HomeFeedItemRenderer";

type UseHomeFeedItemContextOptions = {
  activeFeedItemIndex: number;
  products: any[];
  feedMuted: boolean;
  isScreenFocused: boolean;
  likedReels: Record<string, boolean>;
  savedPosts: Record<string, boolean>;
  likeCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  shareCounts: Record<string, number>;
  repostCounts: Record<string, number>;
  postComments: Record<string, any[]>;
  activeProfile: any;
  justFollowedProfiles: Record<string, number>;
  heartAnimItem: string | null;
  heartAnimScale: any;
  heartAnimOpacity: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setShowAiAssistant: (show: boolean) => void;
  handleLikePress: (id: string) => void;
  handleCommentsPress: (item: any) => void;
  handleShare: (item: any) => void;
  handleReshare: (item: any) => void;
  handleFeedItemSave: (id: string) => void;
  handleThreeDotsPress: (item: any) => void;
  handleFollowPress: (creatorId: string) => void;
  triggerHeartBurst: (itemId: string) => void;
  handleOpenFeedReel: (item: any) => void;
  handleAdCtaPress: (ctaType: string, metadata: any) => void;
  setSelectedProductForPreview: (product: any) => void;
  setPreviewFeedItemId: (id: string | undefined) => void;
  setPreviewSheetVisible: (visible: boolean) => void;
  formatPrice: (price: number) => string;
  addToCart: (product: any) => void;
  logFeedCartAdd: (feedItemId: string, productId: string) => Promise<void>;
  logEngagement: (feedItemId: string, type: "share" | "purchase" | "view" | "like" | "save" | "cart_add") => Promise<any>;
  setShowroomMode: (mode: "lobby" | "viewer") => void;
  setShowroomMaisonId: (id: string) => void;
  setShowroomMaisonName: (name: string) => void;
  setShowroomSessionId: (id: string | undefined) => void;
  setShowLiveShowroom: (show: boolean) => void;
  setFeedMuted: (muted: boolean) => void;
};

export function useHomeFeedItemContext(options: UseHomeFeedItemContextOptions) {
  const feedItemCtx = useMemo<HomeFeedItemRenderContext>(
    () => ({
      activeFeedItemIndex: options.activeFeedItemIndex,
      products: options.products,
      feedMuted: options.feedMuted,
      isScreenFocused: options.isScreenFocused,
      likedReels: options.likedReels,
      savedPosts: options.savedPosts,
      likeCounts: options.likeCounts,
      commentCounts: options.commentCounts,
      shareCounts: options.shareCounts,
      repostCounts: options.repostCounts,
      postComments: options.postComments,
      activeProfile: options.activeProfile,
      justFollowedProfiles: options.justFollowedProfiles,
      heartAnimItem: options.heartAnimItem,
      heartAnimScale: options.heartAnimScale,
      heartAnimOpacity: options.heartAnimOpacity,
      triggerHaptic: options.triggerHaptic,
      setShowAiAssistant: options.setShowAiAssistant,
      handleLikePress: options.handleLikePress,
      handleCommentsPress: options.handleCommentsPress,
      handleShare: options.handleShare,
      handleReshare: options.handleReshare,
      handleFeedItemSave: options.handleFeedItemSave,
      handleThreeDotsPress: options.handleThreeDotsPress,
      handleFollowPress: options.handleFollowPress,
      triggerHeartBurst: options.triggerHeartBurst,
      handleOpenFeedReel: options.handleOpenFeedReel,
      handleAdCtaPress: options.handleAdCtaPress,
      setSelectedProductForPreview: options.setSelectedProductForPreview,
      setPreviewFeedItemId: options.setPreviewFeedItemId,
      setPreviewSheetVisible: options.setPreviewSheetVisible,
      formatPrice: options.formatPrice,
      addToCart: options.addToCart,
      logFeedCartAdd: options.logFeedCartAdd,
      logEngagement: options.logEngagement,
      setShowroomMode: options.setShowroomMode,
      setShowroomMaisonId: options.setShowroomMaisonId,
      setShowroomMaisonName: options.setShowroomMaisonName,
      setShowroomSessionId: options.setShowroomSessionId,
      setShowLiveShowroom: options.setShowLiveShowroom,
      setFeedMuted: options.setFeedMuted,
    }),
    [
      options.activeFeedItemIndex,
      options.products,
      options.feedMuted,
      options.isScreenFocused,
      options.likedReels,
      options.savedPosts,
      options.likeCounts,
      options.commentCounts,
      options.shareCounts,
      options.repostCounts,
      options.postComments,
      options.activeProfile,
      options.justFollowedProfiles,
      options.heartAnimItem,
      options.heartAnimScale,
      options.heartAnimOpacity,
      options.triggerHaptic,
      options.handleLikePress,
      options.handleCommentsPress,
      options.handleShare,
      options.handleReshare,
      options.handleFeedItemSave,
      options.handleThreeDotsPress,
      options.handleFollowPress,
      options.triggerHeartBurst,
      options.handleOpenFeedReel,
      options.handleAdCtaPress,
      options.formatPrice,
      options.addToCart,
      options.logFeedCartAdd,
      options.logEngagement,
      options.setShowroomMode,
      options.setShowroomMaisonId,
      options.setShowroomMaisonName,
      options.setShowroomSessionId,
      options.setShowLiveShowroom,
      options.setFeedMuted,
    ]
  );

  return { feedItemCtx };
}
