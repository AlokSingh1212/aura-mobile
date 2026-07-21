import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import {
  addPostComment,
  fetchPostComments,
  fetchPostEngagement,
  toggleFollowProfile,
} from "@/lib/profileApi";
import { buildPostShareUrl } from "@/lib/postShare";
import { resolveFeedPostMeta } from "@/lib/postNavigation";
import { appendActivity } from "@/lib/activityLog";
import { validateOutboundText } from "@/lib/moderation";
import { postEngagementEvents } from "@/lib/reelsSessionApi";

type UseHomeFeedEngagementOptions = {
  feedItems: any[];
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  toggleFeedSave: (id: string) => Promise<void>;
  logEngagement: (id: string, type: "share" | "purchase" | "view" | "like" | "save" | "cart_add") => Promise<any>;
  findShareItem?: (id: string) => any;
};

export function useHomeFeedEngagement({
  feedItems,
  currentUser,
  activeProfile,
  triggerHaptic,
  toggleFeedSave,
  logEngagement,
  findShareItem,
}: UseHomeFeedEngagementOptions) {
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [repostCounts, setRepostCounts] = useState<Record<string, number>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [justFollowedProfiles, setJustFollowedProfiles] = useState<Record<string, number>>({});

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState<any>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showReshareSheet, setShowReshareSheet] = useState(false);
  const [reshareTargetPost, setReshareTargetPost] = useState<any>(null);

  const [showThreeDotsModal, setShowThreeDotsModal] = useState(false);
  const [threeDotsTargetPost, setThreeDotsTargetPost] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetProfileId, setReportTargetProfileId] = useState("");
  const [reportTargetPostId, setReportTargetPostId] = useState<string | undefined>(undefined);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsTargetPost, setCommentsTargetPost] = useState<any>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const commentInputRef = useRef<any>(null);

  useEffect(() => {
    if (!feedItems?.length) return;
    const likedPatch: Record<string, boolean> = {};
    const savedPatch: Record<string, boolean> = {};
    const likesPatch: Record<string, number> = {};
    const commentsPatch: Record<string, number> = {};
    const sharesPatch: Record<string, number> = {};
    const repostsPatch: Record<string, number> = {};
    feedItems.forEach((item: any) => {
      if (item.content?.liked) likedPatch[item.id] = true;
      if (item.content?.saved) savedPatch[item.id] = true;
      likesPatch[item.id] = item.content?.likesCount ?? item.likesCount ?? 0;
      commentsPatch[item.id] = item.content?.commentsCount ?? item.commentsCount ?? 0;
      sharesPatch[item.id] = item.content?.sharesCount ?? item.sharesCount ?? 0;
      repostsPatch[item.id] = item.content?.repostsCount ?? item.repostsCount ?? 0;
    });
    setLikedReels((prev) => ({ ...prev, ...likedPatch }));
    setSavedPosts((prev) => ({ ...prev, ...savedPatch }));
    setLikeCounts((prev) => ({ ...prev, ...likesPatch }));
    setCommentCounts((prev) => ({ ...prev, ...commentsPatch }));
    setShareCounts((prev) => ({ ...prev, ...sharesPatch }));
    setRepostCounts((prev) => ({ ...prev, ...repostsPatch }));
  }, [feedItems]);

  const submitFeedComment = useCallback(async () => {
    if (!newCommentText.trim() || !commentsTargetPost?.id) return;
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in to comment.");
      return;
    }
    if (!useStore.getState().authToken) {
      Alert.alert("Session expired", "Please sign in again to comment.");
      return;
    }

    const moderation = validateOutboundText(newCommentText);
    if (!moderation.ok) {
      Alert.alert("Comment not posted", moderation.error || "This content is not allowed.");
      return;
    }

    triggerHaptic("success");
    const postId = commentsTargetPost.id;
    const username = activeProfile?.username || currentUser.email?.split("@")[0] || "you";
    const optimistic = {
      id: `c_${Date.now()}`,
      username,
      text: moderation.cleanText,
      time: "now",
      parentId: replyingTo ? replyingTo.commentId : undefined,
    };
    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimistic],
    }));
    const text = moderation.cleanText;
    setNewCommentText("");
    setReplyingTo(null);
    const result = await addPostComment(postId, currentUser.id, text);
    if (result.success && result.comment) {
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== optimistic.id).concat(result.comment),
      }));
      setCommentCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + 1,
      }));
    } else {
      setPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== optimistic.id),
      }));
      Alert.alert("Could not post comment", result.error || "Try again.");
    }
    setTimeout(() => commentInputRef.current?.focus(), 50);
  }, [
    activeProfile?.username,
    commentsTargetPost?.id,
    currentUser?.email,
    currentUser?.id,
    newCommentText,
    replyingTo,
    triggerHaptic,
  ]);

  const handleReportSubmit = useCallback(
    async (reason: string, description?: string) => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/profile/report`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            targetProfileId: reportTargetProfileId,
            reason,
            postId: reportTargetPostId,
            description: description || "Reported via mobile full-screen options.",
          }),
        });
        const data = await res.json();
        if (data.success) {
          return true;
        }
        Alert.alert("Error", data.error || "Failed to submit report.");
        return false;
      } catch {
        Alert.alert("Error", "Failed to contact trust & safety servers.");
        return false;
      }
    },
    [reportTargetProfileId, reportTargetPostId]
  );

  const handleFollowPress = useCallback(
    async (creatorProfileId: string) => {
      if (!activeProfile?.id) {
        Alert.alert("Sign in required", "Sign in to follow creators.");
        return;
      }
      triggerHaptic("medium");
      try {
        const result = await toggleFollowProfile(activeProfile.id, creatorProfileId);
        if (result.success && result.isFollowing) {
          setJustFollowedProfiles((prev) => ({
            ...prev,
            [creatorProfileId]: Date.now(),
          }));
        } else if (!result.success) {
          Alert.alert("Error", "Could not follow profile.");
        }
      } catch {
        Alert.alert("Error", "Connection error.");
      }
    },
    [activeProfile?.id, triggerHaptic]
  );

  const handleCommentsPress = useCallback(
    async (item: any) => {
      triggerHaptic("medium");
      setCommentsTargetPost(item);
      setShowCommentsModal(true);
      try {
        const [comments, stats] = await Promise.all([
          fetchPostComments(item.id),
          fetchPostEngagement(item.id, currentUser?.id),
        ]);
        setPostComments((prev) => ({ ...prev, [item.id]: comments }));
        setCommentCounts((prev) => ({ ...prev, [item.id]: stats.commentCount }));
        setLikeCounts((prev) => ({ ...prev, [item.id]: stats.likeCount }));
        setShareCounts((prev) => ({ ...prev, [item.id]: stats.shareCount }));
        if (currentUser?.id) {
          setLikedReels((prev) => ({ ...prev, [item.id]: stats.liked }));
          setSavedPosts((prev) => ({ ...prev, [item.id]: stats.saved }));
        }
      } catch {
        setPostComments((prev) => ({ ...prev, [item.id]: prev[item.id] || [] }));
      }
    },
    [currentUser?.id, triggerHaptic]
  );

  const handleThreeDotsPress = useCallback(
    (item: any) => {
      triggerHaptic("medium");
      setThreeDotsTargetPost(item);
      setShowThreeDotsModal(true);
    },
    [triggerHaptic]
  );

  const handleSavePress = useCallback(
    (id: string) => {
      triggerHaptic("medium");
      setSavedPosts((prev) => {
        const nextState = !prev[id];
        if (nextState) {
          Alert.alert("Collection Synced", "Post saved securely to your luxury archive collection ledger.");
        }
        return { ...prev, [id]: nextState };
      });
    },
    [triggerHaptic]
  );

  const handleLikePress = useCallback(
    (id: string) => {
      if (!currentUser?.id) {
        Alert.alert("Sign in required", "Sign in to like posts.");
        return;
      }
      triggerHaptic("heavy");
      const wasLiked = !!likedReels[id];

      setLikedReels((prev) => ({ ...prev, [id]: !wasLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? -1 : 1)),
      }));

      logEngagement(id, "like")
        .then((result) => {
          if (result?.likeCount != null) {
            setLikeCounts((prev) => ({ ...prev, [id]: result.likeCount! }));
          }
          if (typeof result?.liked === "boolean") {
            setLikedReels((prev) => ({ ...prev, [id]: result.liked! }));
          }
          if (!wasLiked) {
            appendActivity({ type: "like", title: "Liked a post", targetId: id });
            const item = feedItems.find((f: { id: string }) => f.id === id);
            if (currentUser?.id) {
              postEngagementEvents({
                userId: currentUser.id,
                events: [
                  {
                    surface: "feed",
                    eventType: "like",
                    contentId: id,
                    contentType: "post",
                    creatorId: item?.creator?.id ?? null,
                  },
                ],
              });
            }
          }
        })
        .catch(() => {
          setLikedReels((prev) => ({ ...prev, [id]: wasLiked }));
          setLikeCounts((prev) => ({
            ...prev,
            [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)),
          }));
        });
    },
    [currentUser?.id, feedItems, likedReels, logEngagement, triggerHaptic]
  );

  const handleShare = useCallback(
    (item: any) => {
      triggerHaptic("medium");
      setShareTargetPost(item);
      setShareLink(buildPostShareUrl(item.id));
      setShowShareSheet(true);
    },
    [triggerHaptic]
  );

  const buildReshareTarget = useCallback((item: any) => {
    const meta = resolveFeedPostMeta(item);
    return {
      id: item.id,
      caption: meta.caption,
      mediaUrl: item.content?.mediaUrl || item.content?.videoUrl || item.mediaUrl,
      thumbnail: item.content?.thumbnail || item.thumbnail,
      authorUsername: meta.authorUsername,
      repostOf: meta.repostOf,
    };
  }, []);

  const handleReshare = useCallback(
    (item: any) => {
      if (!currentUser?.id) {
        Alert.alert("Sign in required", "Sign in to reshare to your profile.");
        return;
      }
      triggerHaptic("medium");
      setReshareTargetPost(item);
      setShowReshareSheet(true);
    },
    [currentUser?.id, triggerHaptic]
  );

  const handleFeedItemSave = useCallback(
    async (id: string) => {
      triggerHaptic("medium");
      const next = !savedPosts[id];
      setSavedPosts((prev) => ({ ...prev, [id]: next }));
      await toggleFeedSave(id);
      await logEngagement(id, "save");
      if (next && currentUser?.id) {
        const item = feedItems.find((f: { id: string }) => f.id === id);
        postEngagementEvents({
          userId: currentUser.id,
          events: [
            {
              surface: "feed",
              eventType: "save",
              contentId: id,
              contentType: "post",
              creatorId: item?.creator?.id ?? null,
            },
          ],
        });
      }
      if (next) {
        appendActivity({ type: "save", title: "Saved a post", targetId: id });
      }
    },
    [currentUser?.id, feedItems, logEngagement, savedPosts, toggleFeedSave, triggerHaptic]
  );

  const handleFeedItemShare = useCallback(
    (id: string) => {
      const item = findShareItem?.(id);
      if (item) handleShare(item);
    },
    [findShareItem, handleShare]
  );

  return {
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
    handleFeedItemShare,
    setShareCounts,
    setRepostCounts,
  };
}
