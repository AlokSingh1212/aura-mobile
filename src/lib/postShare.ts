const SHARE_BASE = "https://aura.app/post";

export function buildPostShareUrl(postId: string): string {
  return `${SHARE_BASE}/${postId}`;
}
