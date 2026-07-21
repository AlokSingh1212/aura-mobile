export const COLLAB_INVITE_PREFIX = "[ATTACHMENT:COLLAB_INVITE]";

export type CollabInvitePayload = {
  postId: string;
  thumbnail: string;
  caption?: string;
  mediaType?: "post" | "reel";
  authorProfileId: string;
  authorUsername: string;
  authorName: string;
  authorLogo?: string | null;
  inviteeProfileId: string;
  status: "pending" | "accepted" | "declined";
};

export function parseCollabInviteAttachment(content: string): CollabInvitePayload | null {
  if (!content.startsWith(COLLAB_INVITE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(content.slice(COLLAB_INVITE_PREFIX.length)) as CollabInvitePayload;
    if (!parsed?.postId || !parsed?.inviteeProfileId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function collabInvitePreviewText(content: string): string | null {
  const invite = parseCollabInviteAttachment(content);
  if (!invite) return null;
  if (invite.status === "accepted") return `Collab accepted · @${invite.authorUsername}`;
  if (invite.status === "declined") return `Collab declined · @${invite.authorUsername}`;
  return `Collab invite · @${invite.authorUsername}`;
}
