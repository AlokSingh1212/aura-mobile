import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer } from "expo-audio";
import { mapFeedItemToReelCard } from "@/lib/reelMedia";
import { prefetchVideo } from "@/utils/videoCache";

type UseHomeReelsPlaybackOptions = {
  displayStories: any[];
  activeFeedTab: "grid" | "reels" | "live" | "posts";
  showReelCamera: boolean;
  currentUserId?: string;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeReelsPlayback({
  displayStories,
  activeFeedTab,
  showReelCamera,
  currentUserId,
  triggerHaptic,
}: UseHomeReelsPlaybackOptions) {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [reelsOverlayOpen, setReelsOverlayOpen] = useState(false);
  const [reelsOverlaySeed, setReelsOverlaySeed] = useState<any>(null);
  const [feedMuted, setFeedMuted] = useState(true);
  const feedSoundRef = useRef<any>(null);

  const handleOpenFeedReel = useCallback(
    (item: any) => {
      triggerHaptic("medium");
      setReelsOverlaySeed(mapFeedItemToReelCard(item));
      setReelsOverlayOpen(true);
    },
    [triggerHaptic]
  );

  const closeReelsOverlay = useCallback(() => {
    setReelsOverlayOpen(false);
    setReelsOverlaySeed(null);
  }, []);

  useEffect(() => {
    const syncFeedAudio = async () => {
      try {
        if (feedSoundRef.current) {
          feedSoundRef.current.pause();
          feedSoundRef.current.remove();
          feedSoundRef.current = null;
        }

        if (feedMuted || showReelCamera) {
          return;
        }

        if (activeFeedTab === "reels" && displayStories.length > activeStoryIndex) {
          const activeItem = displayStories[activeStoryIndex];
          if (activeItem?.audioTrack?.url) {
            const player = createAudioPlayer(activeItem.audioTrack.url, { downloadFirst: false });
            player.loop = true;
            player.play();
            feedSoundRef.current = player;
          }
        }
      } catch (error) {
        console.warn("Error syncing feed soundtrack playback:", error);
      }
    };

    syncFeedAudio();

    return () => {
      if (feedSoundRef.current) {
        feedSoundRef.current.pause();
        feedSoundRef.current.remove();
      }
    };
  }, [activeStoryIndex, activeFeedTab, feedMuted, showReelCamera, displayStories]);

  useEffect(() => {
    if (activeFeedTab === "reels" && displayStories.length > 0) {
      const start = activeStoryIndex + 1;
      const end = Math.min(activeStoryIndex + 2, displayStories.length - 1);

      for (let i = start; i <= end; i++) {
        const item = displayStories[i];
        if (item?.url && item.url.endsWith(".mp4")) {
          prefetchVideo(item.url).catch(() => {});
        }
      }
    }
  }, [activeStoryIndex, activeFeedTab, displayStories, currentUserId]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveStoryIndex(viewableItems[0].index || 0);
      triggerHaptic("light");
    }
  }).current;

  return {
    activeStoryIndex,
    setActiveStoryIndex,
    reelsOverlayOpen,
    reelsOverlaySeed,
    feedMuted,
    setFeedMuted,
    handleOpenFeedReel,
    closeReelsOverlay,
    onViewableItemsChanged,
  };
}
