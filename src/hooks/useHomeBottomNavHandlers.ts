import { useMemo } from "react";
import { router } from "expo-router";

type HomeFeedTab = "grid" | "reels" | "live" | "posts";

type UseHomeBottomNavHandlersOptions = {
  setShowExploreGrid: (show: boolean) => void;
  setIsReelsFullScreen: (full: boolean) => void;
  setActiveFeedTab: (tab: HomeFeedTab) => void;
};

export function useHomeBottomNavHandlers({
  setShowExploreGrid,
  setIsReelsFullScreen,
  setActiveFeedTab,
}: UseHomeBottomNavHandlersOptions) {
  const homeTabHandlers = useMemo(
    () => ({
      onHome: () => {
        setShowExploreGrid(false);
        setIsReelsFullScreen(false);
        setActiveFeedTab("posts");
      },
      onReels: () => {
        setShowExploreGrid(false);
        setIsReelsFullScreen(true);
        setActiveFeedTab("reels");
      },
      onInbox: () => {
        router.replace("/messages" as any);
      },
    }),
    [setActiveFeedTab, setIsReelsFullScreen, setShowExploreGrid]
  );

  return { homeTabHandlers };
}
