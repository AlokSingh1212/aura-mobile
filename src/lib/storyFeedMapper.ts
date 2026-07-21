import { mapApiStoryToSlide, type StorySlide } from "@/lib/storyLayers";

export type InstaStoryGroup = {
  id: string;
  profileId?: string;
  username: string;
  avatar: string;
  active?: boolean;
  isYourStory?: boolean;
  slides: StorySlide[];
};

function profileAvatar(story: Record<string, unknown>): string {
  const profile = story.profile as { logo?: string; username?: string } | undefined;
  if (profile?.logo) return profile.logo;
  const user = story.user as { name?: string } | undefined;
  const name = profile?.username || user?.name || "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=fff`;
}

export function groupStoriesIntoRings(
  stories: Record<string, unknown>[],
  yourProfileId?: string | null
): InstaStoryGroup[] {
  const map = new Map<string, InstaStoryGroup>();

  for (const raw of stories) {
    const slide = mapApiStoryToSlide(raw);
    const profileId = (raw.profileId as string) || (raw.userId as string) || slide.id;
    const profile = raw.profile as { username?: string; name?: string } | undefined;
    const username = profile?.username || profile?.name || "user";

    if (!map.has(profileId)) {
      map.set(profileId, {
        id: profileId,
        profileId,
        username,
        avatar: profileAvatar(raw),
        active: true,
        slides: [],
      });
    }
    map.get(profileId)!.slides.push(slide);
  }

  const rings = [...map.values()].filter((g) => g.slides.length > 0);
  if (yourProfileId) {
    return rings.map((g) => ({
      ...g,
      isYourStory: g.profileId === yourProfileId,
    }));
  }
  return rings;
}
