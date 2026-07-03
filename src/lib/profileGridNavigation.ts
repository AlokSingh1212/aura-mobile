import { useCallback, useState } from "react";

export type ProfileGridTab = "posts" | "reels" | "products" | "collabs";

export interface ProfileGridViewerState {
  visible: boolean;
  tab: ProfileGridTab;
  initialItemId: string;
}

export function useProfileGridViewer() {
  const [viewer, setViewer] = useState<ProfileGridViewerState>({
    visible: false,
    tab: "posts",
    initialItemId: "",
  });

  const openGridItem = useCallback((tab: ProfileGridTab, initialItemId: string) => {
    setViewer({ visible: true, tab, initialItemId });
  }, []);

  const closeViewer = useCallback(() => {
    setViewer((prev) => ({ ...prev, visible: false }));
  }, []);

  return { viewer, openGridItem, closeViewer };
}
