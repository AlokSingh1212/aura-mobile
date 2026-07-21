import { API_HOST } from "@/constants/api";

/** Resolve carousel + primary media URLs from feed/profile API shapes. */
export function resolvePostMediaUrls(item: any): string[] {
  const content = item?.content || {};

  const hlsUrl = content.hlsUrl || item?.hlsUrl;
  if (typeof hlsUrl === "string" && hlsUrl.trim()) {
    if (hlsUrl.startsWith("http")) return [hlsUrl];
    if (hlsUrl.startsWith("/")) {
      return [`${API_HOST.replace(/\/$/, "")}${hlsUrl}`];
    }
  }

  if (Array.isArray(item?.mediaUrls) && item.mediaUrls.length) {
    return item.mediaUrls.map(String).filter(Boolean);
  }
  if (Array.isArray(content.mediaUrls) && content.mediaUrls.length) {
    return content.mediaUrls.map(String).filter(Boolean);
  }

  const thumb = content.thumbnail || item?.thumbnail;
  if (typeof thumb === "string" && thumb.startsWith("[")) {
    try {
      const parsed = JSON.parse(thumb);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }

  const single =
    content.videoUrl ||
    content.mediaUrl ||
    content.url ||
    item?.url ||
    (typeof thumb === "string" ? thumb : "") ||
    "";

  return single ? [single] : [];
}

export function resolvePrimaryMediaUrl(item: any): string {
  return resolvePostMediaUrls(item)[0] || "";
}
