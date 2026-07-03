import { API_HOST } from "@/constants/api";
import type { LocationResult } from "@/lib/postComposerSearch";

export interface PostPersonTag {
  profileId: string;
  username: string;
  name: string;
  kind: "tag" | "collab";
}

export interface VerifiedLocation {
  id: string;
  label: string;
  fullName: string;
  lat: number;
  lon: number;
}

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<VerifiedLocation | null> {
  const res = await fetch(
    `${API_HOST}/api/mobile/locations/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`
  );
  const data = await res.json();
  if (data.success && data.location) return data.location as VerifiedLocation;
  return null;
}

export function locationResultToVerified(loc: LocationResult): VerifiedLocation {
  return {
    id: loc.id,
    label: loc.label,
    fullName: loc.fullName,
    lat: loc.lat,
    lon: loc.lon,
  };
}

export const MAX_POST_PEOPLE = 5;

export function splitPeopleTags(people: PostPersonTag[]) {
  return {
    tags: people.filter((p) => p.kind === "tag"),
    collabs: people.filter((p) => p.kind === "collab"),
  };
}
