import { API_HOST } from "@/constants/api";
import { searchAudioTracks, type AudioTrack } from "@/lib/audioLibrary";
import type { ProfileCatalogProduct } from "@/lib/profileApi";

export interface LocationResult {
  id: string;
  label: string;
  fullName: string;
  lat: number;
  lon: number;
}

export interface ProfileSearchResult {
  id: string;
  userId: string;
  username: string;
  name: string;
  logo: string | null;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  price: number;
  images: string[];
  maisonId?: string;
}

export interface HashtagSearchResult {
  tag: string;
  count: number;
}

export async function searchLocations(q: string): Promise<LocationResult[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(
    `${API_HOST}/api/mobile/locations/search?q=${encodeURIComponent(q.trim())}`
  );
  const data = await res.json();
  if (data.success && Array.isArray(data.locations)) return data.locations;
  return [];
}

export async function searchProfiles(q: string): Promise<ProfileSearchResult[]> {
  if (!q.trim()) return [];
  const res = await fetch(
    `${API_HOST}/api/mobile/profile/search?q=${encodeURIComponent(q.trim())}&limit=25`
  );
  const data = await res.json();
  if (data.success && Array.isArray(data.profiles)) return data.profiles;
  return [];
}

export async function searchNearbyLocations(
  lat: number,
  lon: number
): Promise<(LocationResult & { distanceKm?: number })[]> {
  const res = await fetch(
    `${API_HOST}/api/mobile/locations/nearby?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`
  );
  const data = await res.json();
  if (data.success && Array.isArray(data.locations)) return data.locations;
  return [];
}

export async function searchHashtags(q: string): Promise<HashtagSearchResult[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim().replace(/^#/, ""));
  params.set("limit", "15");
  const res = await fetch(`${API_HOST}/api/mobile/hashtags/search?${params}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.hashtags)) return data.hashtags;
  return [];
}

export async function searchProducts(q: string, userId?: string): Promise<ProductSearchResult[]> {
  const params = new URLSearchParams({ q: q.trim() });
  if (userId) params.set("userId", userId);
  const res = await fetch(`${API_HOST}/api/mobile/products?${params}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.products)) {
    return data.products.map((p: { id: string; title: string; price: number; images?: string[]; maisonId?: string }) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      images: p.images || [],
      maisonId: p.maisonId,
    }));
  }
  return [];
}

export async function searchAudio(q: string): Promise<AudioTrack[]> {
  if (!q.trim()) {
    const { fetchAudioCatalog } = await import("@/lib/audioLibrary");
    const { tracks } = await fetchAudioCatalog();
    return tracks.slice(0, 12);
  }
  return searchAudioTracks(q.trim(), "all");
}

export function mapCatalogProducts(products: ProfileCatalogProduct[]): ProductSearchResult[] {
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    images: p.images || [],
    maisonId: p.maisonId,
  }));
}
