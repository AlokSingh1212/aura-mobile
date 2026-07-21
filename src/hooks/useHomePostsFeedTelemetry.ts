import { useEffect, useRef } from "react";
import { useFeedEngagementTelemetry } from "@/hooks/useFeedEngagementTelemetry";

type UseHomePostsFeedTelemetryOptions = {
  userId?: string;
  listData: any[];
  enabled: boolean;
  isScreenFocused: boolean;
  activeFeedTab: "grid" | "reels" | "live" | "posts";
  setActiveFeedItemIndex: (index: number) => void;
};

export function useHomePostsFeedTelemetry({
  userId,
  listData,
  enabled,
  isScreenFocused,
  activeFeedTab,
  setActiveFeedItemIndex,
}: UseHomePostsFeedTelemetryOptions) {
  const feedEngagement = useFeedEngagementTelemetry({
    userId,
    rows: listData,
    enabled,
  });

  const onPostsViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    feedEngagement.onViewableItemsChanged({ viewableItems });
    if (viewableItems?.length > 0) {
      const idx = viewableItems[0].index;
      if (typeof idx === "number") {
        setActiveFeedItemIndex(idx);
      }
    }
  }).current;

  useEffect(() => {
    if (!isScreenFocused || activeFeedTab !== "posts") {
      feedEngagement.flushOnBlur();
    }
  }, [isScreenFocused, activeFeedTab, feedEngagement.flushOnBlur]);

  return { feedEngagement, onPostsViewableItemsChanged };
}
