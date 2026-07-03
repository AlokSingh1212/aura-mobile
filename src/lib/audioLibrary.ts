import { API_HOST } from "@/constants/api";
import { AUDIO_LIBRARY } from "@/constants/audio";

export type AudioTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  category: string;
  durationMs: number;
  isTrending: boolean;
  usesCount: number;
  bpm?: number;
};

let cachedTracks: AudioTrack[] | null = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

function fallbackTracks(): AudioTrack[] {
  return AUDIO_LIBRARY.map((t, i) => ({
    id: `local_${i}`,
    title: t.title,
    artist: t.artist,
    url: t.url,
    cover: t.cover,
    category: t.category,
    durationMs: 120000,
    isTrending: t.isTrending ?? false,
    usesCount: 1000 + i * 100,
  }));
}

export async function fetchAudioCatalog(opts?: {
  q?: string;
  category?: string;
  force?: boolean;
}): Promise<{ tracks: AudioTrack[]; categories: string[] }> {
  const now = Date.now();
  if (!opts?.force && !opts?.q && !opts?.category && cachedTracks && now - cacheTime < CACHE_MS) {
    return { tracks: cachedTracks, categories: [] };
  }

  try {
    const params = new URLSearchParams();
    if (opts?.q) params.set("q", opts.q);
    if (opts?.category && opts.category !== "all") params.set("category", opts.category);

    const res = await fetch(`${API_HOST}/api/mobile/media/audio?${params.toString()}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
      if (!opts?.q && !opts?.category) {
        cachedTracks = data.tracks;
        cacheTime = now;
      }
      return { tracks: data.tracks, categories: data.categories ?? [] };
    }
  } catch {
    /* fallback below */
  }

  const tracks = fallbackTracks();
  return { tracks, categories: ["all", "trending", "pop", "bollywood", "hiphop", "electronic"] };
}

export async function searchAudioTracks(
  q: string,
  category: string
): Promise<AudioTrack[]> {
  const { tracks } = await fetchAudioCatalog({ q, category, force: true });
  return tracks;
}
