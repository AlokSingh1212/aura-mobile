import { useCallback, useMemo } from "react";
import type { EdgeInsets } from "react-native-safe-area-context";

type UseHomeFeedLayoutOptions = {
  windowHeight: number;
  insets: EdgeInsets;
  getLayoutHeight: (id: string, caption: string, imageRatio: number) => number;
  isReelsFullScreen: boolean;
  activeFeedTab: "grid" | "reels" | "live" | "posts";
  reelsContainerHeight: number;
};

export function useHomeFeedLayout({
  windowHeight,
  insets,
  getLayoutHeight,
  isReelsFullScreen,
  activeFeedTab,
  reelsContainerHeight,
}: UseHomeFeedLayoutOptions) {
  const bottomBarHeight = 62 + insets.bottom;

  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const item = data[index];
      if (!item) return { length: 0, offset: 0, index };
      const itemHeight = getLayoutHeight(item.id, item.caption || "", item.imageRatio || 1);
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const prevItem = data[i];
        if (prevItem) {
          offset += getLayoutHeight(prevItem.id, prevItem.caption || "", prevItem.imageRatio || 1);
        }
      }
      return { length: itemHeight, offset, index };
    },
    [getLayoutHeight]
  );

  const reelHeight = useMemo(() => {
    if (isReelsFullScreen && activeFeedTab === "reels") {
      return reelsContainerHeight > 0
        ? reelsContainerHeight
        : windowHeight - insets.top - bottomBarHeight;
    }
    return windowHeight - insets.top - 210;
  }, [
    activeFeedTab,
    bottomBarHeight,
    insets.top,
    isReelsFullScreen,
    reelsContainerHeight,
    windowHeight,
  ]);

  const floatingBottomOffset = isReelsFullScreen ? 65 : 20;

  return {
    bottomBarHeight,
    getItemLayout,
    reelHeight,
    floatingBottomOffset,
  };
}
