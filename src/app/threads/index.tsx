import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store/useStore";
import { THREADS_THEME as T } from "@/constants/threadsTheme";
import { ThreadsHeader } from "@/components/threads/ThreadsHeader";
import { ThreadPostCard } from "@/components/threads/ThreadPostCard";
import { ThreadsComposeModal } from "@/components/threads/ThreadsComposeModal";
import {
  createThread,
  fetchThreadsFeed,
  repostThread,
  toggleThreadLike,
  type ThreadPostDto,
} from "@/lib/threadsApi";

type Tab = "forYou" | "following";

export default function ThreadsHubScreen() {
  const router = useRouter();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const currentUser = useStore((s) => s.currentUser);
  const activeProfile = useStore((s) => s.activeProfile);

  const [tab, setTab] = useState<Tab>("forYou");
  const [threads, setThreads] = useState<ThreadPostDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = currentUser?.id ? String(currentUser.id) : "";
  const profileId = activeProfile?.id ? String(activeProfile.id) : undefined;
  const username = activeProfile?.username || currentUser?.username;

  const loadFeed = useCallback(
    async (opts?: { refresh?: boolean; nextPage?: boolean }) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const isRefresh = opts?.refresh;
      const isNext = opts?.nextPage;

      if (isRefresh) setRefreshing(true);
      else if (isNext) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetchThreadsFeed({
          userId,
          profileId,
          tab,
          cursor: isNext ? cursor : null,
        });

        if (!res.success) {
          setError(res.error || "Could not load threads");
          return;
        }

        setError(null);
        const incoming = res.threads || [];
        setCursor(res.nextCursor || null);

        if (isNext) {
          setThreads((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...incoming.filter((p) => !ids.has(p.id))];
          });
        } else {
          setThreads(incoming);
        }
      } catch {
        setError("Network error loading threads");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, profileId, tab, cursor]
  );

  useEffect(() => {
    setCursor(null);
    setThreads([]);
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId]);

  const patchThread = (id: string, patch: Partial<ThreadPostDto>) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleLike = async (threadId: string) => {
    if (!userId) return;
    triggerHaptic("light");
    const target = threads.find((t) => t.id === threadId);
    if (!target) return;

    patchThread(threadId, {
      liked: !target.liked,
      likesCount: target.liked ? Math.max(0, target.likesCount - 1) : target.likesCount + 1,
    });

    const res = await toggleThreadLike({ userId, profileId, threadId });
    if (res.success && typeof res.likesCount === "number") {
      patchThread(threadId, { liked: !!res.liked, likesCount: res.likesCount });
    }
  };

  const handleRepost = async (threadId: string) => {
    if (!userId) return;
    triggerHaptic("medium");
    const target = threads.find((t) => t.id === threadId);
    if (!target) return;

    const res = await repostThread({ userId, profileId, threadId });
    if (res.success) {
      patchThread(threadId, {
        reposted: !!res.reposted,
        repostsCount: res.repostsCount ?? target.repostsCount,
      });
      if (res.reposted && res.post) {
        setThreads((prev) => [res.post!, ...prev]);
      }
    }
  };

  const handleReply = (threadId: string) => {
    triggerHaptic("light");
    router.push(`/threads/${threadId}` as any);
  };

  const handleOpen = (threadId: string) => {
    router.push(`/threads/${threadId}` as any);
  };

  const handleCompose = async (text: string) => {
    if (!userId) return;
    triggerHaptic("success");
    const res = await createThread({ userId, profileId, content: text });
    if (res.success && res.post) {
      setThreads((prev) => [res.post!, ...prev]);
    }
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {tab === "following" ? "Follow creators to see their threads" : "No threads yet"}
        </Text>
        <Text style={styles.emptySub}>
          {tab === "following"
            ? "People you follow will appear here."
            : "Be the first to share a design thought."}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ThreadsHeader
        tab={tab}
        onTabChange={setTab}
        onBack={() => router.back()}
        onCompose={() => setComposeVisible(true)}
        triggerHaptic={triggerHaptic}
        username={username}
      />

      {loading && threads.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThreadPostCard
              item={item}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={handleReply}
              onPress={handleOpen}
              triggerHaptic={triggerHaptic}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed({ refresh: true })}
              tintColor={T.primary}
            />
          }
          onEndReached={() => {
            if (cursor && !loadingMore) loadFeed({ nextPage: true });
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={T.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={threads.length === 0 ? styles.emptyList : undefined}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ThreadsComposeModal
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onSubmit={handleCompose}
        avatarUrl={activeProfile?.logo || null}
        username={username}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: T.borderSubtle,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    color: T.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  error: {
    color: T.danger,
    textAlign: "center",
    fontSize: 12,
    padding: 8,
  },
});
