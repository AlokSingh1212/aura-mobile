import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type StoryTemplateDetail = {
  id: string;
  promptText: string;
  participationCount: number;
  countLabel: string;
  recentCount: number;
  recentCountLabel: string;
  startedBy: {
    profileId: string;
    username: string;
    name: string;
    avatar: string;
  };
  participants: Array<{
    storyId: string;
    profileId: string;
    username: string;
    name: string;
    avatar: string;
    isFollowing?: boolean;
  }>;
  windowNote: string;
};

export type AddYoursMeta = {
  templateId: string;
  promptText: string;
  coverStyle?: string;
  participationCount: number;
  countLabel: string;
  startedByUsername?: string;
  startedByProfileId?: string;
};

export async function fetchAddYoursForStory(storyId: string): Promise<AddYoursMeta | null> {
  const res = await fetch(
    `${API_HOST}/api/mobile/story-templates?storyId=${encodeURIComponent(storyId)}`
  );
  const data = await res.json();
  return data.addYours || null;
}

export async function fetchStoryTemplateDetail(
  templateId: string,
  userId?: string
): Promise<StoryTemplateDetail | null> {
  const q = userId ? `&userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(
    `${API_HOST}/api/mobile/story-templates?templateId=${encodeURIComponent(templateId)}${q}`
  );
  const data = await res.json();
  return data.template || null;
}
