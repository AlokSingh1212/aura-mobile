import { apiFetch } from "@/lib/apiClient";

export type CreatorEarnings = {
  linksCount: number;
  totalReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
  totalEarnings: number;
};

export type MaisonPayoutEntry = {
  id: string;
  amount: number;
  status: string;
  type: string;
  orderId: string;
  createdAt: string;
  settledAt: string | null;
};

export type MaisonEarnings = {
  maisonId: string;
  maisonName: string;
  escrowLocked: number;
  settled: number;
  refunded: number;
  entries: MaisonPayoutEntry[];
};

export async function fetchEarnings(maisonId?: string) {
  const path = maisonId ? `/earnings?maisonId=${encodeURIComponent(maisonId)}` : "/earnings";
  const res = await apiFetch(path);
  return res.json() as Promise<{
    success: boolean;
    creator?: CreatorEarnings | null;
    maison?: MaisonEarnings | null;
    error?: string;
  }>;
}
