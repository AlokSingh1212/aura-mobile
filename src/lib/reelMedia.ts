import { resolvePrimaryMediaUrl } from "@/lib/resolvePostMedia";

/** True when URL points to video media suitable for the Reels player. */
export function isReelVideoUrl(url: string | null | undefined): boolean {
  if (!url || !String(url).trim()) return false;
  return /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(String(url));
}

/** Feed / story row should never appear in Reels unless it is actual video (not STORY_ONLY). */
export function isReelFeedItem(item: {
  type?: string;
  music?: string | null;
  content?: { videoUrl?: string; mediaUrl?: string; hlsUrl?: string };
  sponsoredMetadata?: { creativeMediaUrl?: string };
}): boolean {
  if (item.music === "STORY_ONLY") return false;

  const playback = resolvePrimaryMediaUrl(item);
  if (playback && isReelVideoUrl(playback)) return true;

  const videoUrl = item.content?.videoUrl;
  if (videoUrl && isReelVideoUrl(videoUrl)) return true;

  const sponsored = item.sponsoredMetadata?.creativeMediaUrl;
  if (item.type === "SPONSORED_AD" && isReelVideoUrl(sponsored)) return true;

  if (item.type === "CREATOR_COMMERCE") {
    const media = videoUrl || item.content?.mediaUrl;
    return isReelVideoUrl(media);
  }

  return false;
}

/** Map a feed row to the reel card shape used by FeedCard / reels session. */
export function mapFeedItemToReelCard(item: any) {
  const playbackUrl = resolvePrimaryMediaUrl(item);
  return {
    id: item.id,
    url:
      playbackUrl ||
      item.content?.videoUrl ||
      item.content?.mediaUrl ||
      item.sponsoredMetadata?.creativeMediaUrl ||
      item.url ||
      "",
    caption: item.content?.caption || item.caption || item.sponsoredMetadata?.ctaText || "",
    creator: item.creator,
    profile: item.creator
      ? {
          name: item.creator.name,
          username: item.creator.username,
          logo: item.creator.avatar,
          id: item.creator.id,
        }
      : item.profile,
    user: item.creator,
    music: item.music || "AURA Original Sound",
    likesCount: item.content?.likesCount || item.likesCount || 0,
    likes: item.content?.likesCount || item.likesCount || 0,
    commentsCount: item.content?.commentsCount || item.commentsCount || 0,
    comments: item.comments || [],
    isVideo: true,
    product: item.product,
    type: item.type,
    sponsoredMetadata: item.sponsoredMetadata,
    content: item.content,
    photoTags: item.photoTags || item.content?.photoTags || [],
    collab: item.collab || item.content?.collab || null,
    productStickers: item.productStickers || item.content?.productStickers || [],
    storyLayers:
      item.storyLayers ||
      item.content?.storyLayers ||
      (item.metadata && typeof item.metadata === "object"
        ? (item.metadata as { storyLayers?: unknown }).storyLayers
        : undefined),
    location: item.location || item.content?.location,
    aiLabel: item.aiLabel || item.content?.aiLabel,
  };
}
