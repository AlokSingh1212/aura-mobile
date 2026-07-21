import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type MaisonPremiumStatus = {
  success: boolean;
  maisonId?: string;
  isActive?: boolean;
  premiumVerified?: boolean;
  showcaseEnabled?: boolean;
  premiumUntil?: string | null;
  priceInr?: number;
  periodDays?: number;
  website?: string | null;
  error?: string;
};

export type ShowcaseMaison = {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  about: string | null;
  designType: string;
  username: string;
  website: string | null;
  isPremiumVerified: boolean;
  productCount: number;
};

export async function fetchMaisonPremiumStatus(
  userId: string,
  maisonId: string
): Promise<MaisonPremiumStatus> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_HOST}/api/mobile/maison-premium?userId=${encodeURIComponent(userId)}&maisonId=${encodeURIComponent(maisonId)}`,
    { headers }
  );
  return res.json();
}

export async function createMaisonPremiumCheckout(userId: string, maisonId: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_HOST}/api/mobile/maison-premium`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ userId, maisonId }),
  });
  return res.json();
}

export async function verifyMaisonPremiumPayment(opts: {
  userId: string;
  maisonId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_HOST}/api/mobile/maison-premium`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", ...opts }),
  });
  return res.json();
}

export async function fetchShowcaseMaisons(limit = 24): Promise<ShowcaseMaison[]> {
  const res = await fetch(
    `${API_HOST}/api/mobile/maison-premium?action=showcase&limit=${limit}`
  );
  const data = await res.json();
  return data.maisons || [];
}
