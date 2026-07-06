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
import { buildPostShareUrl } from "@/lib/postShare";
import { appendActivity } from "@/lib/activityLog";

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
  const { triggerHaptic, logEngagement, toggleFeedSave, currentUser, activeProfile } =
    useStore();

  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [repostCounts, setRepostCounts] = useState<Record<string, number>>({});
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsTarget, setCommentsTarget] = useState<EngagementPostItem | null>(null);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [optionsTarget, setOptionsTarget] = useState<EngagementPostItem | null>(null);

  const [shareVisible, setShareVisible] = useState(false);
  const [shareTarget, setShareTarget] = useState<EngagementPostItem | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const [reshareVisible, setReshareVisible] = useState(false);
  const [reshareTarget, setReshareTarget] = useState<EngagementPostItem | null>(null);

  const hydratePostEngagement = useCallback(
    async (postId: string) => {
      if (!postId) return;
      try {
        const stats = await fetchPostEngagement(postId, currentUser?.id);
        setLikeCounts((prev) => ({ ...prev, [postId]: stats.likeCount }));
        setCommentCounts((prev) => ({ ...prev, [postId]: stats.commentCount }));
        setShareCounts((prev) => ({ ...prev, [postId]: stats.shareCount }));
        setRepostCounts((prev) => ({ ...prev, [postId]: stats.repostCount ?? 0 }));
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
      logEngagement(id, "like")
        .then((result) => {
          if (result?.likeCount != null) {
            setLikeCounts((prev) => ({ ...prev, [id]: result.likeCount! }));
          }
        if (typeof result?.liked === "boolean") {
          setLikedPosts((prev) => ({ ...prev, [id]: result.liked! }));
        }
        if (!wasLiked) {
          appendActivity({ type: "like", title: "Liked a post", targetId: id });
        }
      })
        .catch(() => {
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
        appendActivity({ type: "save", title: "Saved a post", targetId: id });
        Alert.alert("Saved", "Post saved to your collection.");
      }
    },
    [savedPosts, toggleFeedSave, triggerHaptic]
  );

  const handleShare = useCallback(
    (item: EngagementPostItem) => {
      triggerHaptic("medium");
      setShareTarget(item);
      setShareLink(buildPostShareUrl(item.id));
      setShareVisible(true);
    },
    [triggerHaptic]
  );

  const handleShareRecorded = useCallback((postId: string, shareCount?: number) => {
    setShareCounts((prev) => ({
      ...prev,
      [postId]: shareCount ?? (prev[postId] ?? 0) + 1,
    }));
  }, []);

  const handleReshare = useCallback(
    (item: EngagementPostItem) => {
      if (!currentUser?.id) {
        Alert.alert("Sign in required", "Sign in to reshare to your profile.");
        return;
      }
      triggerHaptic("medium");
      setReshareTarget(item);
      setReshareVisible(true);
    },
    [currentUser?.id, triggerHaptic]
  );

  const handleRepostCountUpdate = useCallback((sourcePostId: string, repostCount?: number) => {
    if (repostCount == null) return;
    setRepostCounts((prev) => ({ ...prev, [sourcePostId]: repostCount }));
  }, []);

  const hydratePostsEngagement = useCallback(
    async (postIds: string[]) => {
      const unique = [...new Set(postIds.filter(Boolean))];
      await Promise.all(unique.map((id) => hydratePostEngagement(id)));
    },
    [hydratePostEngagement]
  );

  const handleComments = useCallback(
    async (item: EngagementPostItem) => {
      triggerHaptic("medium");
      setCommentsTarget(item);
      setCommentsVisible(true);

      setLoadingComments((prev) => ({ ...prev, [item.id]: true }));
      try {
        const [comments, stats] = await Promise.all([
          fetchPostComments(item.id),
          fetchPostEngagement(item.id, currentUser?.id),
        ]);
        setPostComments((prev) => ({ ...prev, [item.id]: comments }));
        setCommentCounts((prev) => ({ ...prev, [item.id]: stats.commentCount }));
        setShareCounts((prev) => ({ ...prev, [item.id]: stats.shareCount }));
        setRepostCounts((prev) => ({ ...prev, [item.id]: stats.repostCount ?? 0 }));
        setLikeCounts((prev) => ({ ...prev, [item.id]: stats.likeCount }));
        if (currentUser?.id) {
          setLikedPosts((prev) => ({ ...prev, [item.id]: stats.liked }));
          setSavedPosts((prev) => ({ ...prev, [item.id]: stats.saved }));
        }
      } catch {
        setPostComments((prev) => ({ ...prev, [item.id]: prev[item.id] || [] }));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [currentUser?.id, triggerHaptic]
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
      const { authToken } = useStore.getState();
      if (!authToken) {
        Alert.alert("Session expired", "Please sign in again to comment.");
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
        setCommentCounts((prev) => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
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
    commentCounts,
    shareCounts,
    repostCounts,
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
    reshareVisible,
    reshareTarget,
    setReshareVisible,
    handleLike,
    handleSave,
    handleShare,
    handleShareRecorded,
    handleReshare,
    handleRepostCountUpdate,
    handleComments,
    handleThreeDots,
    confirmDeletePost,
    copyPostLink,
    addComment,
    hydratePostEngagement,
    hydratePostsEngagement,
  };
}
