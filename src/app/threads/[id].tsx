import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { THREADS_THEME as T } from "@/constants/threadsTheme";
import { ThreadPostCard } from "@/components/threads/ThreadPostCard";
import { ThreadsComposeModal } from "@/components/threads/ThreadsComposeModal";
import {
  createThread,
  fetchThreadDetail,
  repostThread,
  toggleThreadLike,
  type ThreadPostDto,
} from "@/lib/threadsApi";

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const currentUser = useStore((s) => s.currentUser);
  const activeProfile = useStore((s) => s.activeProfile);

  const [thread, setThread] = useState<ThreadPostDto | null>(null);
  const [chain, setChain] = useState<ThreadPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeVisible, setComposeVisible] = useState(false);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  const userId = currentUser?.id ? String(currentUser.id) : "";
  const profileId = activeProfile?.id ? String(activeProfile.id) : undefined;

  const loadDetail = useCallback(async () => {
    if (!userId || !id) return;
    setLoading(true);
    try {
      const res = await fetchThreadDetail({ threadId: String(id), userId, profileId });
      if (res.success && res.thread) {
        setThread(res.thread);
        setChain(res.chain || []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, profileId, id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const patchInList = (
    list: ThreadPostDto[],
    setList: React.Dispatch<React.SetStateAction<ThreadPostDto[]>>,
    threadId: string,
    patch: Partial<ThreadPostDto>
  ) => {
    setList((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...patch } : t)));
    if (thread?.id === threadId) setThread((t) => (t ? { ...t, ...patch } : t));
  };

  const handleLike = async (threadId: string) => {
    if (!userId) return;
    triggerHaptic("light");

    const all = [thread, ...chain].filter(Boolean) as ThreadPostDto[];
    const target = all.find((t) => t.id === threadId);
    if (!target) return;

    const optimistic = {
      liked: !target.liked,
      likesCount: target.liked ? Math.max(0, target.likesCount - 1) : target.likesCount + 1,
    };

    if (thread?.id === threadId) setThread({ ...thread, ...optimistic });
    patchInList(chain, setChain, threadId, optimistic);

    const res = await toggleThreadLike({ userId, profileId, threadId });
    if (res.success && typeof res.likesCount === "number") {
      const final = { liked: !!res.liked, likesCount: res.likesCount };
      if (thread?.id === threadId) setThread((t) => (t ? { ...t, ...final } : t));
      patchInList(chain, setChain, threadId, final);
    }
  };

  const handleRepost = async (threadId: string) => {
    if (!userId) return;
    triggerHaptic("medium");
    const res = await repostThread({ userId, profileId, threadId });
    if (res.success && thread?.id === threadId) {
      setThread({
        ...thread,
        reposted: !!res.reposted,
        repostsCount: res.repostsCount ?? thread.repostsCount,
      });
    }
  };

  const openReply = (targetId: string, username: string) => {
    setParentId(targetId);
    setReplyToUsername(username);
    setComposeVisible(true);
  };

  const handleReplySubmit = async (text: string) => {
    if (!userId || !parentId) return;
    triggerHaptic("success");
    const res = await createThread({
      userId,
      profileId,
      content: text,
      parentId,
    });
    if (res.success && res.post) {
      setChain((prev) => [...prev, res.post!]);
      const root = chain[0];
      if (root) {
        setChain((prev) =>
          prev.map((p) =>
            p.id === root.id ? { ...p, repliesCount: p.repliesCount + 1 } : p
          )
        );
      }
      if (thread) {
        setThread({ ...thread, repliesCount: thread.repliesCount + 1 });
      }
    }
  };

  const displayPosts = chain.length > 0 ? chain : thread ? [thread] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic("medium");
            router.back();
          }}
        >
          <Lucide name="chevron-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={T.primary} />
        </View>
      ) : !thread ? (
        <View style={styles.loader}>
          <Text style={styles.notFound}>Thread not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {displayPosts.map((item, idx) => (
            <ThreadPostCard
              key={item.id}
              item={item}
              showThreadLine={idx < displayPosts.length - 1}
              isLastInChain={idx === displayPosts.length - 1}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={(tid) => openReply(tid, item.author.username)}
              triggerHaptic={triggerHaptic}
            />
          ))}
        </ScrollView>
      )}

      {thread ? (
        <TouchableOpacity
          style={styles.replyBar}
          onPress={() => {
            const last = chain[chain.length - 1] || thread;
            openReply(last.id, last.author.username);
          }}
        >
          <Text style={styles.replyPlaceholder}>Reply to @{thread.author.username}…</Text>
          <Lucide name="arrow-up-circle" size={28} color={T.primary} />
        </TouchableOpacity>
      ) : null}

      <ThreadsComposeModal
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onSubmit={handleReplySubmit}
        avatarUrl={activeProfile?.logo || null}
        username={activeProfile?.username}
        replyTo={replyToUsername}
        placeholder="Add to the thread…"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "700",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    color: T.textMuted,
  },
  scroll: {
    paddingBottom: 80,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: T.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.surface,
    gap: 12,
  },
  replyPlaceholder: {
    flex: 1,
    color: T.textMuted,
    fontSize: 14,
  },
});
