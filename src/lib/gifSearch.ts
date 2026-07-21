import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type GifSearchResult = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
};

export async function searchGifs(q: string, userId: string): Promise<GifSearchResult[]> {
  const params = new URLSearchParams({
    userId,
    q: q.trim() || "trending",
    limit: "24",
  });
  const res = await fetch(`${API_HOST}/api/mobile/media/gifs/search?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "GIF search failed");
  }
  return Array.isArray(data.gifs) ? data.gifs : [];
}
