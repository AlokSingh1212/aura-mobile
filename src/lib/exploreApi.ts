import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type ExploreHashtag = {
  tag: string;
  postCount: number;
  recentCount: number;
  velocity: number;
  label: string;
};

export type ExploreCreator = {
  profileId: string;
  username: string;
  name: string;
  avatar: string;
  momentum: number;
  postCount: number;
};

export type ExploreTile = {
  id: string;
  type: "hashtag" | "creator" | "topic" | "product";
  label: string;
  subtitle?: string;
  coverUrl?: string;
  query?: string;
  profileId?: string;
};

export type ExploreGridItem = {
  id: string;
  url: string;
  thumbnail: string;
  caption?: string;
  isVideo: boolean;
  creator?: { id: string; username: string; avatar: string };
  rankScore?: number;
};

export type ExploreBrowsePayload = {
  success: boolean;
  mode?: string;
  trending?: {
    hashtags: ExploreHashtag[];
    creators: ExploreCreator[];
    topics: ExploreTile[];
  };
  personalized?: ExploreTile[];
  grid?: ExploreGridItem[];
  tiles?: ExploreTile[];
  query?: string;
  meta?: { algorithm?: string };
  error?: string;
};

export async function fetchExploreBrowse(userId?: string): Promise<ExploreBrowsePayload> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${API_HOST}/api/mobile/explore${q}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function searchExplore(userId: string | undefined, query: string): Promise<ExploreBrowsePayload> {
  const params = new URLSearchParams({ mode: "search", q: query });
  if (userId) params.set("userId", userId);
  const res = await fetch(`${API_HOST}/api/mobile/explore?${params}`, {
    headers: authHeaders(),
  });
  return res.json();
}
