export const PRODUCT_COLLAB_INVITE_PREFIX = "[ATTACHMENT:PRODUCT_COLLAB_INVITE]";

export type ProductCollabInvitePayload = {
  collabId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  commissionRate: number;
  brandMaisonId: string;
  brandName: string;
  creatorProfileId: string;
  initiator: "CREATOR" | "BRAND";
  status: "pending" | "accepted" | "declined";
  affiliateCode?: string | null;
};

export function parseProductCollabInviteAttachment(content: string): ProductCollabInvitePayload | null {
  if (!content.startsWith(PRODUCT_COLLAB_INVITE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(content.slice(PRODUCT_COLLAB_INVITE_PREFIX.length)) as ProductCollabInvitePayload;
    if (!parsed?.collabId || !parsed?.productId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function productCollabPreviewText(content: string): string | null {
  const invite = parseProductCollabInviteAttachment(content);
  if (!invite) return null;
  if (invite.status === "accepted") return `Product collab live · ${invite.commissionRate}%`;
  if (invite.status === "declined") return `Product collab declined · ${invite.productTitle}`;
  return `Product collab · ${invite.productTitle} · ${invite.commissionRate}%`;
}
