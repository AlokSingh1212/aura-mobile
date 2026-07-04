import type { LocationResult } from "@/lib/postComposerSearch";

/** Person tagged *in the photo/video* — overlay on media, not caption. */
export interface PhotoTag {
  profileId: string;
  username: string;
  name: string;
  logo?: string | null;
  /** Position on media (0–100), Instagram-style bubble anchor. */
  x?: number;
  y?: number;
  /** Links tag to detected face slot from scan. */
  faceId?: string;
}

/** Co-author invite — header credit, dual profile (Instagram Collab). */
export interface CollabPartner {
  profileId: string;
  username: string;
  name: string;
  logo?: string | null;
  status?: "pending" | "accepted" | "declined";
}

export interface VerifiedLocation {
  id: string;
  label: string;
  fullName: string;
  lat: number;
  lon: number;
}

export const MAX_PHOTO_TAGS = 5;
export const MAX_COLLAB_PARTNERS = 1;

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<VerifiedLocation | null> {
  const { API_HOST } = await import("@/constants/api");
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

/** Parse #hashtags and @mentions from caption (text-only; separate from photo tags). */
export function parseCaptionEntities(caption: string) {
  const hashtags: string[] = [];
  const mentions: string[] = [];
  const hashRe = /#([\w\u00C0-\u024F\u0900-\u097F]+)/gi;
  const mentionRe = /@([\w.]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = hashRe.exec(caption)) !== null) hashtags.push(m[1].toLowerCase());
  while ((m = mentionRe.exec(caption)) !== null) mentions.push(m[1].toLowerCase());
  return { hashtags, mentions };
}

export function insertMentionInCaption(caption: string, username: string): string {
  const mention = `@${username.replace(/^@/, "")}`;
  if (caption.includes(mention)) return caption;
  const trimmed = caption.trimEnd();
  return trimmed ? `${trimmed} ${mention}` : mention;
}

/** Normalize legacy metadata from older posts. */
export function readPostMetadata(meta: unknown): {
  photoTags: PhotoTag[];
  collab: CollabPartner | null;
  collabs: CollabPartner[];
} {
  if (!meta || typeof meta !== "object") {
    return { photoTags: [], collab: null, collabs: [] };
  }
  const m = meta as {
    photoTags?: PhotoTag[];
    tags?: PhotoTag[];
    collab?: CollabPartner | null;
    collabs?: CollabPartner[];
  };
  const photoTags = Array.isArray(m.photoTags)
    ? m.photoTags
    : Array.isArray(m.tags)
      ? m.tags.map((t) => ({ ...t, kind: undefined }))
      : [];

  const collabs: CollabPartner[] = [];
  const pushCollab = (c: CollabPartner | null | undefined) => {
    if (!c || c.status === "declined") return;
    if (!collabs.some((x) => x.profileId === c.profileId)) collabs.push(c);
  };
  pushCollab(m.collab ?? null);
  if (Array.isArray(m.collabs)) {
    for (const c of m.collabs) pushCollab(c);
  }

  return { photoTags, collab: collabs[0] ?? null, collabs };
}
