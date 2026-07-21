import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export async function fetchTrendingHashtags(limit = 20): Promise<{ tag: string; postCount: number }[]> {
  const res = await fetch(`${API_HOST}/api/mobile/hashtags?limit=${limit}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.hashtags)) {
    return data.hashtags.map((h: { tag: string; postCount: number }) => ({
      tag: h.tag,
      postCount: h.postCount ?? 0,
    }));
  }
  return [];
}

export async function attachPublishedHashtags(params: {
  userId: string;
  feedItemId: string;
  caption?: string;
  tags?: string[];
}): Promise<boolean> {
  const res = await fetch(`${API_HOST}/api/mobile/hashtags`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: params.userId,
      feedItemId: params.feedItemId,
      storyId: params.feedItemId,
      caption: params.caption || "",
      tags: params.tags || [],
    }),
  });
  const data = await res.json();
  return !!data.success;
}
