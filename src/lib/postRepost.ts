/** Reference to the original post when this item is a repost on someone's profile. */
export interface RepostOfRef {
  postId: string;
  authorUsername: string;
  authorName: string;
  authorProfileId?: string;
  authorLogo?: string | null;
  mediaType?: "post" | "reel" | "product";
  originalCaption?: string;
  thumbnail?: string | null;
}

export function readRepostOf(meta: unknown): RepostOfRef | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as { repostOf?: RepostOfRef }).repostOf;
  if (!raw || typeof raw !== "object" || !raw.postId) return null;
  return raw;
}

/** Resolve the source post id for resharing (follow repost chain to origin). */
export function resolveReshareSourceId(item: {
  id?: string;
  repostOf?: RepostOfRef | null;
  content?: { repostOf?: RepostOfRef | null };
}): string {
  const ref = item.repostOf || item.content?.repostOf;
  return ref?.postId || item.id || "";
}

export function repostMediaLabel(mediaType?: RepostOfRef["mediaType"]): string {
  if (mediaType === "reel") return "Reel";
  if (mediaType === "product") return "Product";
  return "Post";
}
