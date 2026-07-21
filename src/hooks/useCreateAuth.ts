import { useEffect } from "react";
import { router } from "expo-router";
import { useStore } from "@/store/useStore";
import type { PublishResult } from "@/lib/publishContent";

export function useCreateAuth() {
  const { currentUser, authHydrated, activeProfile } = useStore();

  useEffect(() => {
    if (!authHydrated) return;
    if (!currentUser?.id) {
      router.replace("/login");
    }
  }, [authHydrated, currentUser?.id]);

  return {
    ready: authHydrated && !!currentUser?.id,
    userId: currentUser?.id ?? "",
    profileId: activeProfile?.id ?? null,
    profileName: activeProfile?.name ?? currentUser?.name ?? "You",
  };
}

export function syncAfterPublish(
  kind: "story" | "post" | "reel",
  result: PublishResult,
  caption: string,
  isVideo = false
) {
  const store = useStore.getState();
  const { publicUrl, contentId } = result;

  if (kind === "story") {
    store.addInstaStorySlide({
      id: contentId || `story_${Date.now()}`,
      url: publicUrl,
      caption,
      isVideo,
      addYours: result.addYours,
      storyLayers: result.storyLayers,
    });
    store.fetchFeedItems("", "For You", true);
    if (store.currentUser?.id) {
      store.loadUserStories(store.currentUser.id);
      store.loadStoryRings(store.currentUser.id);
    }
    return;
  }

  store.fetchFeedItems("", "For You", true);
  store.fetchFeed(true);

  if (store.currentUser?.id) {
    store.loadUserStories(store.currentUser.id);
  }
}
