import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type LivePlatformConfig = {
  agora: { appId: string | null; configured: boolean };
  ivs: { configured: boolean; region: string | null };
  razorpay: { configured: boolean };
  juspay: { configured: boolean };
  upstash: { configured: boolean };
};

export async function fetchLiveConfig(): Promise<LivePlatformConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/live/config`, { headers: authHeaders() });
    const data = await res.json();
    return data.success ? data.config : null;
  } catch {
    return null;
  }
}

export async function mintAgoraToken(opts: {
  channelName: string;
  uid?: number;
  role?: "publisher" | "subscriber";
}): Promise<{ appId: string; token: string; channelName: string; uid: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/live/config`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        channelName: opts.channelName,
        uid: opts.uid ?? 0,
        role: opts.role ?? "subscriber",
      }),
    });
    const data = await res.json();
    if (!data.success) return null;
    return {
      appId: data.appId,
      token: data.token,
      channelName: data.channelName,
      uid: data.uid,
    };
  } catch {
    return null;
  }
}
