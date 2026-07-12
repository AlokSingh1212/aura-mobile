/** True when URL points to video media suitable for the Reels player. */
export function isReelVideoUrl(url: string | null | undefined): boolean {
  if (!url || !String(url).trim()) return false;
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(url));
}

/** Feed / story row should never appear in Reels unless it is actual video (not STORY_ONLY). */
export function isReelFeedItem(item: {
  type?: string;
  music?: string | null;
  content?: { videoUrl?: string; mediaUrl?: string };
  sponsoredMetadata?: { creativeMediaUrl?: string };
}): boolean {
  if (item.music === "STORY_ONLY") return false;

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
