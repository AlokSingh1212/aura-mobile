import { API_HOST } from "@/constants/api";

export type SavedPost = {
  id: string;
  postId: string;
  type?: string;
  caption?: string;
  thumbnail?: string;
  authorUsername?: string;
  authorName?: string;
  savedAt?: string;
};

export async function fetchSavedPosts(userId: string): Promise<SavedPost[]> {
  try {
    const res = await fetch(
      `${API_HOST}/api/mobile/feed/saved?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.posts)) return data.posts;
  } catch {
    /* empty */
  }
  return [];
}

export async function unsavePost(userId: string, postId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/mobile/feed/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, postId }),
    });
    const data = await res.json();
    return !!data.success && !data.saved;
  } catch {
    return false;
  }
}
