export const BRAND_PARTNERSHIP_INVITE_PREFIX = "[ATTACHMENT:BRAND_PARTNERSHIP_INVITE]";

export type BrandPartnershipInvite = {
  dealId: string;
  title: string;
  budget: number;
  dealType: string;
  terms: string;
  brandMaisonId: string;
  brandName: string;
  brandLogo?: string | null;
  creatorProfileId: string;
  creatorUsername?: string;
  initiator: "BRAND" | "CREATOR";
  status: "pending" | "accepted" | "declined" | "completed";
};

export function parseBrandPartnershipInviteAttachment(content: string): BrandPartnershipInvite | null {
  if (!content.startsWith(BRAND_PARTNERSHIP_INVITE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(content.slice(BRAND_PARTNERSHIP_INVITE_PREFIX.length)) as BrandPartnershipInvite;
    if (!parsed?.dealId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function brandPartnershipPreviewText(content: string): string | null {
  const invite = parseBrandPartnershipInviteAttachment(content);
  if (!invite) return null;
  if (invite.status === "accepted") return `Partnership live · ${invite.title}`;
  if (invite.status === "declined") return `Partnership declined · ${invite.title}`;
  if (invite.status === "completed") return `Partnership completed · ${invite.title}`;
  return `Brand partnership · ${invite.title} · ₹${Math.round(invite.budget).toLocaleString("en-IN")}`;
}
