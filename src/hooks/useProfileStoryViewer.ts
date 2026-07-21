import { useMemo, useState } from "react";

type UseProfileStoryViewerOptions = {
  instaStories: any[];
};

export function useProfileStoryViewer({ instaStories }: UseProfileStoryViewerOptions) {
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);

  const yourStorySlides = useMemo(
    () =>
      instaStories
        .find((s) => s.isYourStory)
        ?.slides?.filter((sl: { url?: string }) => sl?.url) || [],
    [instaStories]
  );

  const hasActiveStory = yourStorySlides.length > 0;

  return {
    showStoryViewer,
    setShowStoryViewer,
    storyViewerIndex,
    setStoryViewerIndex,
    yourStorySlides,
    hasActiveStory,
  };
}
