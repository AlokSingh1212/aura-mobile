import { apiFetch } from "@/lib/apiClient";

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

export async function fetchWallet() {
  const res = await apiFetch("/wallet");
  return res.json() as Promise<{
    success: boolean;
    walletBalance?: number;
    auraCredits?: number;
    transactions?: WalletTransaction[];
    error?: string;
  }>;
}
