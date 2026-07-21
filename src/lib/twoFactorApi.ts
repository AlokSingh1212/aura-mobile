import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export async function sendTwoFactorOtp(userId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/auth/send-otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  return { success: !!data.success, error: data.error || data.message };
}

export async function verifyTwoFactorOtp(
  userId: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/auth/verify-otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, otpCode }),
  });
  const data = await res.json();
  return { success: !!data.success, error: data.error || data.message };
}

export async function completeLoginWithOtp(
  userId: string,
  otpCode: string
): Promise<{ success: boolean; error?: string; token?: string; user?: any; profile?: any }> {
  const res = await fetch(`${API_HOST}/api/mobile/auth/login/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, otpCode }),
  });
  const data = await res.json();
  if (!data.success) {
    return { success: false, error: data.error || data.message };
  }
  return {
    success: true,
    token: data.token,
    user: data.user,
    profile: data.profile,
  };
}
