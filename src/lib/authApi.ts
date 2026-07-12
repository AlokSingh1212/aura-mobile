import { API_BASE, API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type AuthMeResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    isVerified: boolean;
    isOnboarded: boolean;
    activeProfileId: string | null;
    walletBalance: number;
    countryCode: string | null;
    profiles: Array<Record<string, unknown>>;
    activeProfile: Record<string, unknown> | null;
    telemetry: {
      followersCount: number;
      followingCount: number;
      auraScore: number;
    } | null;
  };
  error?: string;
};

export async function validateAuthSession(): Promise<AuthMeResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  return res.json();
}

export async function deactivateAccount(userId: string) {
  const res = await fetch(`${API_HOST}/api/mobile/auth/deactivate-account`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function fetchUserDataExport(userId: string) {
  const res = await fetch(
    `${API_BASE}/auth/export-data?userId=${encodeURIComponent(userId)}`,
    { headers: authHeaders() }
  );
  return res.json();
}
