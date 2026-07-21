import { useCallback } from "react";
import { Alert } from "react-native";
import { resolveAuthorFromItem } from "@/lib/feedSocialFilter";
import { appendActivity } from "@/lib/activityLog";
import { API_HOST } from "@/constants/api";

type UseHomeThreeDotsActionsOptions = {
  threeDotsTargetPost: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  setShowThreeDotsModal: (show: boolean) => void;
  handleSavePress: (id: string) => void;
  handleShare: (item: any) => void;
  archiveFeedPost: (payload: any) => Promise<unknown>;
  hideFeedPost: (postId: string) => Promise<unknown>;
  muteAccount: (author: any) => Promise<unknown>;
  blockAccount: (author: any) => Promise<unknown>;
  setReportTargetProfileId: (id: string) => void;
  setReportTargetPostId: (id: string | undefined) => void;
  setShowReportModal: (show: boolean) => void;
};

export function useHomeThreeDotsActions({
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
}: UseHomeThreeDotsActionsOptions) {
  const closeThreeDots = useCallback(() => setShowThreeDotsModal(false), [setShowThreeDotsModal]);

  const onAboutAccount = useCallback(() => {
    triggerHaptic("light");
    setShowThreeDotsModal(false);
    const postUser = threeDotsTargetPost?.creator?.name || threeDotsTargetPost?.user?.name || "Creator";
    Alert.alert(
      "About this account",
      `${postUser} • Verified AURA creator • Joined the AURA platform to share curated luxury content and shoppable stories.`
    );
  }, [setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onSave = useCallback(() => {
    triggerHaptic("light");
    setShowThreeDotsModal(false);
    handleSavePress(threeDotsTargetPost?.id || "");
  }, [handleSavePress, setShowThreeDotsModal, threeDotsTargetPost?.id, triggerHaptic]);

  const onShare = useCallback(() => {
    triggerHaptic("light");
    setShowThreeDotsModal(false);
    handleShare(threeDotsTargetPost || {});
  }, [handleShare, setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onCopyLink = useCallback(() => {
    triggerHaptic("light");
    setShowThreeDotsModal(false);
    const link = `https://aura.app/post/${threeDotsTargetPost?.id || ""}`;
    Alert.alert("Link Copied", `Post link copied to clipboard:\n${link}`);
  }, [setShowThreeDotsModal, threeDotsTargetPost?.id, triggerHaptic]);

  const onArchive = useCallback(() => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    const post = threeDotsTargetPost;
    if (!post?.id) return;
    Alert.alert(
      "Archive post?",
      "This post will be hidden from your profile. Restore it anytime from Settings → Archives.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            const isReel = post.type === "CREATOR_COMMERCE" || !!post.content?.videoUrl;
            await archiveFeedPost({
              id: post.id,
              type: isReel ? "reel" : "post",
              title: post.content?.caption?.slice(0, 80) || "Post",
              thumbnail: post.content?.mediaUrl || post.content?.thumbnail,
              authorUsername: activeProfile?.username,
            });
            appendActivity({
              type: "view",
              title: "Archived a post",
              targetId: post.id,
              thumbnail: post.content?.mediaUrl || post.content?.thumbnail,
            });
            Alert.alert("Archived", "Post moved to your archive.");
          },
        },
      ]
    );
  }, [activeProfile?.username, archiveFeedPost, setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onInterested = useCallback(() => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    Alert.alert(
      "Curated for you",
      "AURA's recommendation engine will prioritize similar content in your feed based on your style preferences."
    );
  }, [setShowThreeDotsModal, triggerHaptic]);

  const onHidePost = useCallback(async () => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    const postId = threeDotsTargetPost?.id;
    if (!postId) return;
    await hideFeedPost(postId);
    appendActivity({ type: "view", title: "Hidden a post", targetId: postId });
    Alert.alert("Content Hidden", "This post has been removed from your feed.");
  }, [hideFeedPost, setShowThreeDotsModal, threeDotsTargetPost?.id, triggerHaptic]);

  const onMute = useCallback(async () => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    const author = resolveAuthorFromItem(threeDotsTargetPost || {});
    await muteAccount(author);
    Alert.alert("Muted", `@${author.username} has been muted. Their posts won't appear in your feed.`);
  }, [muteAccount, setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onBlock = useCallback(() => {
    triggerHaptic("heavy");
    setShowThreeDotsModal(false);
    const author = resolveAuthorFromItem(threeDotsTargetPost || {});
    Alert.alert(
      "Block account?",
      `@${author.username} won't be able to see your profile or message you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            await blockAccount(author);
            Alert.alert("Blocked", `@${author.username} has been blocked.`);
          },
        },
      ]
    );
  }, [blockAccount, setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onNotInterested = useCallback(async () => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    const postId = threeDotsTargetPost?.id;
    if (postId) {
      try {
        await fetch(`${API_HOST}/api/mobile/feed/engagement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeProfile?.id || "anonymous",
            postId,
            type: "not_interested",
          }),
        });
      } catch (err) {
        console.error("Failed to log not_interested", err);
      }
      await hideFeedPost(postId);
    }
    Alert.alert("Not Interested", "You'll see fewer posts like this in your AURA feed.");
  }, [activeProfile?.id, hideFeedPost, setShowThreeDotsModal, threeDotsTargetPost?.id, triggerHaptic]);

  const onUnfollow = useCallback(() => {
    triggerHaptic("medium");
    setShowThreeDotsModal(false);
    Alert.alert(
      "Unfollow",
      `Are you sure you want to unfollow ${threeDotsTargetPost?.creator?.name || threeDotsTargetPost?.user?.name || "this creator"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unfollow",
          style: "destructive",
          onPress: () => Alert.alert("Unfollowed", "You have unfollowed this creator."),
        },
      ]
    );
  }, [setShowThreeDotsModal, threeDotsTargetPost, triggerHaptic]);

  const onReport = useCallback(() => {
    triggerHaptic("heavy");
    setShowThreeDotsModal(false);
    const author = resolveAuthorFromItem(threeDotsTargetPost || {});
    setReportTargetProfileId(author.profileId);
    setReportTargetPostId(threeDotsTargetPost?.id);
    setShowReportModal(true);
  }, [
    setReportTargetPostId,
    setReportTargetProfileId,
    setShowReportModal,
    setShowThreeDotsModal,
    threeDotsTargetPost,
    triggerHaptic,
  ]);

  return {
    closeThreeDots,
    threeDotsHandlers: {
      onClose: closeThreeDots,
      onAboutAccount,
      onSave,
      onShare,
      onCopyLink,
      onArchive,
      onInterested,
      onHidePost,
      onMute,
      onBlock,
      onNotInterested,
      onUnfollow,
      onReport,
    },
  };
}
