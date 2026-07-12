import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type LiveComment = { id: string; user: string; text: string };

export async function fetchActiveLiveSessions(userId?: string) {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${API_BASE}/live${q}`, { headers: authHeaders() });
  const data = await res.json();
  return data.success ? (data.sessions as any[]) : [];
}

export async function fetchLiveSession(sessionId: string, role: "viewer" | "broadcaster" = "viewer") {
  const res = await fetch(`${API_BASE}/live?sessionId=${sessionId}&role=${role}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.success ? data.session : null;
}

export async function postLiveComment(opts: {
  sessionId: string;
  username: string;
  text: string;
  userId?: string;
}) {
  const res = await fetch(`${API_BASE}/live`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      action: "comment",
      sessionId: opts.sessionId,
      username: opts.username,
      text: opts.text,
      userId: opts.userId,
    }),
  });
  return res.json();
}

export async function postLiveHeart(sessionId: string, userId?: string) {
  const res = await fetch(`${API_BASE}/live`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ action: "heart", sessionId, userId }),
  });
  return res.json();
}

export function formatLiveComments(raw: any[]): LiveComment[] {
  return (raw || []).map((c) => ({
    id: c.id,
    user: c.username,
    text: c.text,
  }));
}
