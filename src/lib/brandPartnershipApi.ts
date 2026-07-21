import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type BrandPartnershipAction = "accept" | "decline" | "complete" | "confirm";

export type BrandPartnershipDeal = {
  id: string;
  maisonId: string;
  creatorId: string;
  creatorProfileId?: string | null;
  title: string;
  budget: number;
  type: string;
  status: string;
  initiator: string;
  terms: string;
  escrowStatus: string;
  paymentMode?: string;
  escrowRequired?: boolean;
  maison?: { name: string; logo?: string | null };
  creator?: { name?: string | null; email?: string | null };
};

export type PartnershipCreator = {
  id: string;
  profileId: string;
  userId: string;
  username: string;
  name: string;
  logo?: string | null;
  category?: string;
};

export async function fetchBrandPartnerships(opts: {
  userId: string;
  maisonId?: string;
  creatorId?: string;
  creatorProfileId?: string;
  status?: string;
}): Promise<BrandPartnershipDeal[]> {
  const params = new URLSearchParams({ userId: opts.userId });
  if (opts.maisonId) params.set("maisonId", opts.maisonId);
  if (opts.creatorId) params.set("creatorId", opts.creatorId);
  if (opts.creatorProfileId) params.set("creatorProfileId", opts.creatorProfileId);
  if (opts.status) params.set("status", opts.status);

  const res = await fetch(`${API_HOST}/api/mobile/brand-deals?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.success && Array.isArray(data.deals) ? data.deals : [];
}

export async function fetchPartnershipCreators(userId: string): Promise<PartnershipCreator[]> {
  const params = new URLSearchParams({ userId, creators: "true" });
  const res = await fetch(`${API_HOST}/api/mobile/brand-deals?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.success && Array.isArray(data.creators) ? data.creators : [];
}

export async function proposeBrandPartnershipApi(opts: {
  userId: string;
  maisonId: string;
  creatorProfileId: string;
  budget: number;
  type: string;
  terms: string;
  title?: string;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/brand-deals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...opts, action: "propose" }),
  });
  return res.json();
}

export async function respondBrandPartnershipApi(opts: {
  userId: string;
  profileId: string;
  dealId: string;
  respondAction: BrandPartnershipAction;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/brand-deals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      profileId: opts.profileId,
      dealId: opts.dealId,
      action: "respond",
      respondAction: opts.respondAction,
    }),
  });
  return res.json();
}

export function confirmBrandPartnershipAction(
  action: BrandPartnershipAction
): Promise<boolean> {
  return new Promise((resolve) => {
    const { Alert } = require("react-native");
    const titles: Record<BrandPartnershipAction, string> = {
      accept: "Accept brand partnership?",
      decline: "Decline brand partnership?",
      complete: "Mark deliverables complete?",
      confirm: "Release partnership payment?",
    };
    const bodies: Record<BrandPartnershipAction, string> = {
      accept: "Budget moves to escrow when you accept. Payment releases after the brand confirms deliverables.",
      decline: "You won't receive this partnership offer.",
      complete: "The brand will be notified to review and release payment.",
      confirm: "Creator payment will be released from escrow to their wallet.",
    };
    Alert.alert(titles[action], bodies[action], [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      {
        text: action === "decline" ? "Decline" : "Confirm",
        style: action === "decline" ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export async function respondBrandPartnershipWithConfirmation(opts: {
  userId: string;
  profileId: string;
  dealId: string;
  respondAction: BrandPartnershipAction;
}) {
  const confirmed = await confirmBrandPartnershipAction(opts.respondAction);
  if (!confirmed) return { success: false, error: "cancelled" };
  const data = await respondBrandPartnershipApi(opts);
  if (!data.success) {
    const { Alert } = require("react-native");
    const msg =
      data.error === "INSUFFICIENT_BRAND_BALANCE"
        ? "Brand wallet balance is too low to lock escrow."
        : data.error === "ESCROW_NOT_FUNDED"
          ? "Brand must fund escrow via Razorpay before you can accept."
          : data.error === "BRAND_PARTNERSHIPS_DISABLED"
          ? "Brand partnerships are disabled in store settings."
          : data.error === "CREATOR_PARTNERSHIPS_DISABLED"
            ? "This creator is not accepting partnership offers."
            : data.error || "Could not update partnership.";
    Alert.alert("Brand partnership", msg);
  }
  return data;
}

export async function fundPartnershipEscrowApi(userId: string, dealId: string) {
  const res = await fetch(`${API_HOST}/api/mobile/brand-deals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, action: "fund_escrow", dealId }),
  });
  return res.json();
}

export async function verifyPartnershipEscrowApi(opts: {
  userId: string;
  dealId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/brand-deals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...opts, action: "verify_escrow" }),
  });
  return res.json();
}

export function partnershipTypeLabel(type: string): string {
  return type.replace(/_/g, " ").toLowerCase();
}
