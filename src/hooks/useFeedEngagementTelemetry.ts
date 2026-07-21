import { useCallback, useRef } from "react";
import { postEngagementEvents } from "@/lib/reelsSessionApi";

type FeedRow = {
  id: string;
  type?: string;
  creator?: { id?: string } | null;
};

export function useFeedEngagementTelemetry(opts: {
  userId: string | undefined;
  rows: FeedRow[];
  enabled: boolean;
}) {
  const sessionIdRef = useRef(`feed_${Date.now()}`);
  const viewStartRef = useRef(Date.now());
  const lastPostRef = useRef<string | null>(null);
  const impressedRef = useRef(new Set<string>());
  const rowsRef = useRef(opts.rows);
  rowsRef.current = opts.rows;

  const emit = useCallback(
    (
      events: Array<{
        eventType: string;
        contentId: string;
        creatorId?: string | null;
        watchMs?: number;
      }>
    ) => {
      if (!opts.userId || !opts.enabled || !events.length) return;
      postEngagementEvents({
        userId: opts.userId,
        events: events.map((e) => ({
          surface: "feed" as const,
          eventType: e.eventType,
          contentId: e.contentId,
          contentType: "post",
          creatorId: e.creatorId ?? null,
          sessionId: sessionIdRef.current,
          watchMs: e.watchMs ?? null,
        })),
      });
    },
    [opts.userId, opts.enabled]
  );

  const flushCurrentPost = useCallback(() => {
    const prevId = lastPostRef.current;
    if (!prevId) return;
    const watchMs = Date.now() - viewStartRef.current;
    const row = rowsRef.current.find((r) => r.id === prevId);
    const creatorId = row?.creator?.id ?? null;
    emit([
      {
        eventType: watchMs < 800 ? "skip" : "watch_ms",
        contentId: prevId,
        creatorId,
        watchMs,
      },
    ]);
  }, [emit]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index?: number; item?: FeedRow }> }) => {
    if (!opts.enabled || !viewableItems?.length) return;

    const primary = viewableItems[0];
    const row = primary.item;
    if (!row?.id || row.type === "ASK_AURA_AI") return;

    const prevId = lastPostRef.current;
    if (prevId && prevId !== row.id) {
      const watchMs = Date.now() - viewStartRef.current;
      const prevRow = rowsRef.current.find((r) => r.id === prevId);
      emit([
        {
          eventType: watchMs < 800 ? "skip" : "watch_ms",
          contentId: prevId,
          creatorId: prevRow?.creator?.id ?? null,
          watchMs,
        },
      ]);
    }

    if (!impressedRef.current.has(row.id)) {
      impressedRef.current.add(row.id);
      emit([
        { eventType: "impression", contentId: row.id, creatorId: row.creator?.id ?? null },
        { eventType: "view_start", contentId: row.id, creatorId: row.creator?.id ?? null },
      ]);
    }

    lastPostRef.current = row.id;
    viewStartRef.current = Date.now();
  }).current;

  const logFeedLikeOrSave = useCallback(
    (contentId: string, creatorId: string | null | undefined, eventType: "like" | "save") => {
      emit([{ eventType, contentId, creatorId: creatorId ?? null }]);
    },
    [emit]
  );

  const flushOnBlur = useCallback(() => {
    flushCurrentPost();
    lastPostRef.current = null;
  }, [flushCurrentPost]);

  return {
    onViewableItemsChanged,
    viewabilityConfig: { itemVisiblePercentThreshold: 55 },
    logFeedLikeOrSave,
    flushOnBlur,
  };
}
