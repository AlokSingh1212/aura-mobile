import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { FeedCard } from "@/components/FeedCard";
import {
  createReelsSession,
  fetchMoreReelsSession,
  postEngagementEvents,
} from "@/lib/reelsSessionApi";
import { isReelVideoUrl, mapFeedItemToReelCard } from "@/lib/reelMedia";
import { API_HOST } from "@/constants/api";

type Props = {
  visible: boolean;
  userId: string | undefined;
  seedContentId?: string;
  seedItem?: any;
  onClose: () => void;
  /** Passed through to FeedCard */
  feedCardProps: Omit<
    React.ComponentProps<typeof FeedCard>,
    "item" | "index" | "activeReelIndex" | "reelHeight" | "commentsCount" | "likesCount" | "sharesCount" | "repostsCount"
  >;
  getItemMetrics?: (item: any) => {
    commentsCount?: number;
    likesCount?: number;
    sharesCount?: number;
    repostsCount?: number;
  };
  triggerHaptic: (type: "light" | "medium" | "heavy") => void;
};

export function ReelsSessionOverlay({
  visible,
  userId,
  seedContentId,
  seedItem,
  onClose,
  feedCardProps,
  getItemMetrics,
  triggerHaptic,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reelHeight = height - insets.top;
  const listRef = useRef<FlatList>(null);

  const [queue, setQueue] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const viewStartRef = useRef<number>(Date.now());
  const lastContentRef = useRef<string | null>(null);
  const queueRef = useRef<any[]>([]);
  queueRef.current = queue;

  const seenIds = useCallback(() => queue.map((q) => q.id), [queue]);

  const logWatch = useCallback(
    (contentId: string, creatorId: string | null | undefined, watchMs: number, eventType: "watch_ms" | "skip") => {
      if (!userId) return;
      postEngagementEvents({
        userId,
        events: [
          {
            surface: "reels",
            eventType,
            contentId,
            contentType: "reel",
            creatorId: creatorId || null,
            sessionId,
            watchMs,
          },
        ],
      });
    },
    [userId, sessionId]
  );

  const bootstrap = useCallback(async () => {
    if (!visible) return;

    const seedMapped = seedItem ? mapFeedItemToReelCard(seedItem) : null;
    const seedUrl = seedMapped?.url || seedItem?.content?.videoUrl || seedItem?.url;

    console.warn("[ReelsOverlay] bootstrap starting", {
      userId,
      seedContentId,
      seedItemExist: !!seedItem,
      seedItemUrl: seedItem?.url,
      seedUrl,
      isReelVideoUrlResult: isReelVideoUrl(seedUrl),
    });

    if (!userId) {
      if (seedMapped && isReelVideoUrl(seedUrl)) {
        console.warn("[ReelsOverlay] no userId, setQueue with seedMapped only");
        setQueue([seedMapped]);
      } else {
        console.warn("[ReelsOverlay] no userId, could not map seedMapped");
      }
      return;
    }

    setLoading(true);
    try {
      console.warn("[ReelsOverlay] calling createReelsSession with seedContentId", seedContentId || seedItem?.id);
      const res = await createReelsSession({
        userId,
        seedContentId: seedContentId || seedItem?.id,
        limit: 12,
      });

      console.warn("[ReelsOverlay] res received", {
        success: res.success,
        reelsCount: res.reels?.length,
        sessionId: res.sessionId,
        error: res.error,
      });

      let filtered =
        res.success && res.reels?.length
          ? res.reels.filter((r) => isReelVideoUrl(r.url || r.content?.videoUrl))
          : [];

      if (seedContentId) {
        const seedIdx = filtered.findIndex((r) => r.id === seedContentId);
        if (seedIdx > 0) {
          const [seed] = filtered.splice(seedIdx, 1);
          filtered = [seed, ...filtered];
        } else if (seedIdx === -1 && seedMapped && isReelVideoUrl(seedUrl)) {
          filtered = [seedMapped, ...filtered];
        }
      } else if (!filtered.length && seedMapped && isReelVideoUrl(seedUrl)) {
        filtered = [seedMapped];
      }

      console.warn("[ReelsOverlay] filtered queue size", filtered.length);

      if (filtered.length) {
        setSessionId(res.sessionId || null);
        setQueue(filtered);
        setActiveIndex(0);
        viewStartRef.current = Date.now();
        lastContentRef.current = filtered[0]?.id || null;
      } else {
        console.warn("[ReelsOverlay] filtered queue is EMPTY!");
      }
    } catch (err: any) {
      console.warn("[ReelsOverlay] bootstrap threw error, falling back to feed query:", err?.message || err);
      let fallbackQueue = seedMapped && isReelVideoUrl(seedUrl) ? [seedMapped] : [];
      try {
        const feedRes = await fetch(`${API_HOST}/api/mobile/feed`);
        const feedData = await feedRes.json();
        if (feedData?.success && Array.isArray(feedData.feedItems)) {
          const feedReels = feedData.feedItems
            .map((item: any) => mapFeedItemToReelCard(item))
            .filter((card: any) => isReelVideoUrl(card.url) && card.id !== seedContentId);
          fallbackQueue = [...fallbackQueue, ...feedReels];
        }
      } catch (feedErr: any) {
        console.warn("[ReelsOverlay] fallback feed query failed:", feedErr?.message || feedErr);
      }

      if (fallbackQueue.length) {
        console.warn("[ReelsOverlay] fallback queue populated, size:", fallbackQueue.length);
        setQueue(fallbackQueue);
        setActiveIndex(0);
        viewStartRef.current = Date.now();
        lastContentRef.current = fallbackQueue[0]?.id || null;
        queueRef.current = fallbackQueue;
      } else {
        console.warn("[ReelsOverlay] fallback queue is empty!");
      }
    } finally {
      setLoading(false);
      console.warn("[ReelsOverlay] bootstrap finished");
    }
  }, [userId, visible, seedContentId, seedItem]);

  useEffect(() => {
    if (visible) bootstrap();
    else {
      setQueue([]);
      setSessionId(null);
      setActiveIndex(0);
    }
  }, [visible, bootstrap]);

  const appendMore = useCallback(async () => {
    if (!userId || !sessionId || loadingMore || queue.length === 0) return;
    setLoadingMore(true);
    try {
      const res = await fetchMoreReelsSession({
        userId,
        sessionId,
        seenIds: seenIds(),
        limit: 8,
      });
      if (res.success && res.reels?.length) {
        setQueue((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const next = res.reels!.filter((r) => isReelVideoUrl(r.url) && !ids.has(r.id));
          return next.length ? [...prev, ...next] : prev;
        });
      }
    } finally {
      setLoadingMore(false);
    }
  }, [userId, sessionId, loadingMore, queue.length, seenIds]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems?.length) return;
    const idx = viewableItems[0].index ?? 0;
    const q = queueRef.current;
    const prevId = lastContentRef.current;
    const watchMs = Date.now() - viewStartRef.current;

    if (prevId && watchMs > 0) {
      const prevItem = q.find((item) => item.id === prevId);
      const eventType = watchMs < 800 ? "skip" : "watch_ms";
      logWatch(prevId, prevItem?.creator?.id || prevItem?.profile?.id, watchMs, eventType);
    }

    setActiveIndex(idx);
    viewStartRef.current = Date.now();
    lastContentRef.current = q[idx]?.id || null;
    triggerHaptic("light");

    if (idx >= q.length - 3) {
      appendMore();
    }
  }).current;

  const handleClose = () => {
    const prevId = lastContentRef.current;
    const watchMs = Date.now() - viewStartRef.current;
    if (prevId && userId) {
      const prevItem = queue.find((q) => q.id === prevId);
      logWatch(prevId, prevItem?.creator?.id || prevItem?.profile?.id, watchMs, watchMs < 800 ? "skip" : "watch_ms");
    }
    onClose();
  };

  useEffect(() => {
    if (!visible || !BackHandler) return;
    const onBackPress = () => {
      handleClose();
      return true;
    };
    const subscription = BackHandler.addEventListener
      ? BackHandler.addEventListener("hardwareBackPress", onBackPress)
      : null;
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.root, { paddingTop: insets.top, zIndex: 1000, elevation: 1000 }]}>
      <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 8 }]} onPress={handleClose} hitSlop={12}>
        <Lucide name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>

      {loading && queue.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const metrics = getItemMetrics?.(item) || {};
            return (
              <FeedCard
                {...feedCardProps}
                item={item}
                index={index}
                activeReelIndex={activeIndex}
                reelHeight={reelHeight}
                isScreenFocused={visible}
                commentsCount={metrics.commentsCount}
                likesCount={metrics.likesCount}
                sharesCount={metrics.sharesCount}
                repostsCount={metrics.repostsCount}
              />
            );
          }}
          pagingEnabled
          snapToInterval={reelHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
          getItemLayout={(_, index) => ({
            length: reelHeight,
            offset: reelHeight * index,
            index,
          })}
          onEndReached={appendMore}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
