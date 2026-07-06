import { apiFetch } from "@/lib/apiClient";

export type DeviceSession = {
  id: string;
  device: string;
  platform: string;
  location: string;
  lastActive: string;
  createdAt: string;
  current?: boolean;
};

export async function fetchDeviceSessions() {
  const res = await apiFetch("/auth/sessions");
  return res.json() as Promise<{ success: boolean; sessions?: DeviceSession[]; error?: string }>;
}

export async function revokeDeviceSession(sessionId: string) {
  const res = await apiFetch("/auth/sessions", {
    method: "DELETE",
    body: JSON.stringify({ sessionId }),
  });
  return res.json();
}

export async function revokeAllOtherSessions() {
  const res = await apiFetch("/auth/sessions", {
    method: "DELETE",
    body: JSON.stringify({ revokeAll: true }),
  });
  return res.json();
}
