import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type PayoutRailInfo = {
  kycStatus: string | null;
  beneficiaryStatus: string | null;
  canReceivePayouts: boolean;
  blockReason: string | null;
  cooldownUntil: string | null;
};

export type PayoutProfile = {
  rail: PayoutRailInfo;
  kyc: {
    legalName: string;
    panLast4: string;
    status: string;
    rejectionReason: string | null;
    verifiedAt: string | null;
  } | null;
  beneficiary: {
    id: string;
    accountType: string;
    accountHolder: string;
    ifsc: string | null;
    accountLast4: string | null;
    upiMasked: string | null;
    status: string;
    cooldownUntil: string | null;
  } | null;
  transfers: {
    id: string;
    amount: number;
    purpose: string;
    status: string;
    utr: string | null;
    failureReason: string | null;
    processedAt: string | null;
    createdAt: string;
  }[];
};

export async function fetchPayoutProfile(): Promise<PayoutProfile | null> {
  const res = await fetch(`${API_HOST}/api/mobile/payouts`, { headers: authHeaders() });
  const data = await res.json();
  if (!data.success) return null;
  return {
    rail: data.rail,
    kyc: data.kyc,
    beneficiary: data.beneficiary,
    transfers: data.transfers || [],
  };
}

export async function submitPayoutKycApi(opts: {
  legalName: string;
  panNumber: string;
  dateOfBirth?: string;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/payouts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "submit_kyc", ...opts }),
  });
  return res.json();
}

export async function addPayoutBeneficiaryApi(opts: {
  accountType: "BANK" | "UPI";
  accountHolder: string;
  maisonId?: string;
  ifsc?: string;
  accountNumber?: string;
  upiId?: string;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/payouts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "add_beneficiary", ...opts }),
  });
  return res.json();
}

export function payoutErrorMessage(code: string): string {
  const map: Record<string, string> = {
    INVALID_PAN: "Enter a valid PAN (e.g. ABCDE1234F).",
    PAN_ALREADY_REGISTERED: "This PAN is already linked to another account.",
    KYC_REQUIRED: "Complete identity verification first.",
    ACCOUNT_NAME_MISMATCH: "Account holder name must match your KYC legal name.",
    INVALID_IFSC: "Enter a valid IFSC code.",
    INVALID_ACCOUNT_NUMBER: "Enter a valid bank account number.",
    INVALID_UPI: "Enter a valid UPI ID.",
    ESCROW_NOT_FUNDED: "Brand must fund escrow via Razorpay before you can accept.",
    RAZORPAYX_NOT_CONFIGURED: "Bank payouts are being configured. Try again shortly.",
  };
  return map[code] || "Could not save. Please check your details.";
}
