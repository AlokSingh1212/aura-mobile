import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useStore } from "@/store/useStore";
import {
  addPostComment,
  deleteProfilePost,
  fetchPostComments,
  fetchPostEngagement,
  type PostComment,
} from "@/lib/profileApi";

export interface EngagementPostItem {
  id: string;
  caption?: string;
  url?: string;
  profile?: { name?: string; username?: string; logo?: string | null };
  user?: { name?: string };
}

export function toEngagementItem(
  post: { id: string; caption?: string; url?: string },
  profile: { username: string; name: string; logo?: string | null }
): EngagementPostItem {
  return {
    id: post.id,
    caption: post.caption,
    url: post.url,
    profile: { name: profile.name, username: profile.username, logo: profile.logo },
    user: { name: profile.name },
  };
}

export function usePostEngagement(opts?: {
  isOwnPost?: boolean;
  onDeleted?: (postId: string) => void;
}) {
  const { triggerHaptic, logEngagement, toggleFeedSave, logFeedShare, currentUser, activeProfile } =
    useStore();

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsTarget, setCommentsTarget] = useState<EngagementPostItem | null>(null);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [optionsTarget, setOptionsTarget] = useState<EngagementPostItem | null>(null);

  const [shareVisible, setShareVisible] = useState(false);
  const [shareTarget, setShareTarget] = useState<EngagementPostItem | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const hydratePostEngagement = useCallback(
    async (postId: string) => {
      if (!postId) return;
      try {
        const stats = await fetchPostEngagement(postId, currentUser?.id);
        setLikeCounts((prev) => ({ ...prev, [postId]: stats.likeCount }));
        if (currentUser?.id) {
          setLikedPosts((prev) => ({ ...prev, [postId]: stats.liked }));
          setSavedPosts((prev) => ({ ...prev, [postId]: stats.saved }));
        }
      } catch {
        /* non-blocking */
      }
    },
    [currentUser?.id]
  );

  const handleLike = useCallback(
    (id: string) => {
      triggerHaptic("heavy");
      const wasLiked = !!likedPosts[id];
      setLikedPosts((prev) => ({ ...prev, [id]: !wasLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) + (wasLiked ? -1 : 1)),
      }));
      logEngagement(id, "like").catch(() => {
        setLikedPosts((prev) => ({ ...prev, [id]: wasLiked }));
        setLikeCounts((prev) => ({
          ...prev,
          [id]: Math.max(0, (prev[id] || 0) + (wasLiked ? 1 : -1)),
        }));
      });
    },
    [likedPosts, logEngagement, triggerHaptic]
  );

  const handleSave = useCallback(
    (id: string) => {
      triggerHaptic("medium");
      const next = !savedPosts[id];
      setSavedPosts((prev) => ({ ...prev, [id]: next }));
      toggleFeedSave(id).catch(() => {
        setSavedPosts((prev) => ({ ...prev, [id]: !next }));
      });
      if (next) {
        Alert.alert("Saved", "Post saved to your collection.");
      }
    },
    [savedPosts, toggleFeedSave, triggerHaptic]
  );

  const handleShare = useCallback(
    async (item: EngagementPostItem) => {
      triggerHaptic("medium");
      setShareTarget(item);
      setShareLink(null);
      setShareVisible(true);
      const shareUrl = await logFeedShare(item.id);
      setShareLink(shareUrl || `https://aura.app/post/${item.id}`);
    },
    [logFeedShare, triggerHaptic]
  );

  const handleComments = useCallback(
    async (item: EngagementPostItem) => {
      triggerHaptic("medium");
      setCommentsTarget(item);
      setCommentsVisible(true);

      if (postComments[item.id]?.length) return;

      setLoadingComments((prev) => ({ ...prev, [item.id]: true }));
      try {
        const comments = await fetchPostComments(item.id);
        setPostComments((prev) => ({ ...prev, [item.id]: comments }));
      } catch {
        setPostComments((prev) => ({ ...prev, [item.id]: [] }));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [postComments, triggerHaptic]
  );

  const handleThreeDots = useCallback(
    (item: EngagementPostItem) => {
      triggerHaptic("medium");
      setOptionsTarget(item);
      setOptionsVisible(true);
    },
    [triggerHaptic]
  );

  const confirmDeletePost = useCallback(
    (item: EngagementPostItem) => {
      if (!currentUser?.id) {
        Alert.alert("Sign in required", "Sign in to manage your posts.");
        return;
      }
      Alert.alert(
        "Delete post?",
        "This can't be undone. The post will be permanently removed from your profile.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              triggerHaptic("heavy");
              setOptionsVisible(false);
              const result = await deleteProfilePost(item.id, currentUser.id);
              if (result.success) {
                opts?.onDeleted?.(item.id);
                Alert.alert("Deleted", "Your post has been removed.");
              } else {
                Alert.alert("Could not delete", result.error || "Try again.");
              }
            },
          },
        ]
      );
    },
    [currentUser?.id, opts, triggerHaptic]
  );

  const copyPostLink = useCallback(
    async (item: EngagementPostItem) => {
      triggerHaptic("light");
      const link = `https://aura.app/post/${item.id}`;
      await Clipboard.setStringAsync(link);
      Alert.alert("Link copied", link);
    },
    [triggerHaptic]
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      if (!text.trim()) return;
      if (!currentUser?.id) {
        Alert.alert("Sign in required", "Sign in to comment.");
        return;
      }

      const optimistic: PostComment = {
        id: `tmp_${Date.now()}`,
        username: activeProfile?.username || currentUser.email?.split("@")[0] || "you",
        text: text.trim(),
        time: "now",
        userId: currentUser.id,
      };
      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimistic],
      }));
      triggerHaptic("success");

      const result = await addPostComment(postId, currentUser.id, text.trim());
      if (result.success && result.comment) {
        setPostComments((prev) => ({
          ...prev,
          [postId]: (prev[postId] || [])
            .filter((c) => c.id !== optimistic.id)
            .concat(result.comment!),
        }));
      } else {
        setPostComments((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).filter((c) => c.id !== optimistic.id),
        }));
        Alert.alert("Could not post comment", result.error || "Try again.");
      }
    },
    [activeProfile?.username, currentUser?.email, currentUser?.id, triggerHaptic]
  );

  return {
    likedPosts,
    savedPosts,
    likeCounts,
    postComments,
    loadingComments,
    commentsVisible,
    commentsTarget,
    setCommentsVisible,
    optionsVisible,
    optionsTarget,
    setOptionsVisible,
    shareVisible,
    shareTarget,
    setShareVisible,
    shareLink,
    handleLike,
    handleSave,
    handleShare,
    handleComments,
    handleThreeDots,
    confirmDeletePost,
    copyPostLink,
    addComment,
    hydratePostEngagement,
  };
}
