import { useMemo } from "react";
import { normalizeUsername } from "@/lib/postNavigation";
import { isUserBlocked, isUserMuted } from "@/lib/socialGraph";
import { canViewStorySlide } from "@/lib/settingsRuntime";

type UseHomeVisibleStoriesOptions = {
  activeInstaStories: any[];
  socialGraph: any;
  socialGraphVersion: number;
  activeProfileId?: string;
};

export function useHomeVisibleStories({
  activeInstaStories,
  socialGraph,
  socialGraphVersion,
  activeProfileId,
}: UseHomeVisibleStoriesOptions) {
  const visibleInstaStories = useMemo(() => {
    if (!socialGraph) return activeInstaStories;
    return activeInstaStories.filter((story) => {
      if (story.isYourStory) return true;
      const profileId = story.profileId || story.id || story.username;
      const username = normalizeUsername(story.username || "");
      if (isUserBlocked(profileId, socialGraph, username) || isUserMuted(profileId, socialGraph, username)) {
        return false;
      }
      return canViewStorySlide(
        {
          closeFriendsOnly: story.closeFriendsOnly,
          audience: story.audience,
          profileId: story.profileId,
          userId: story.userId,
        },
        activeProfileId,
        socialGraph,
        false
      );
    });
  }, [activeInstaStories, socialGraph, socialGraphVersion, activeProfileId]);

  return { visibleInstaStories };
}
