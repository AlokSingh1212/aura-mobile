import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { mapFeedItemToReelCard } from "@/lib/reelMedia";

export type ReelsSessionResponse = {
  success: boolean;
  sessionId?: string;
  reels?: any[];
  meta?: { algorithm?: string; candidatePool?: number };
  error?: string;
};

export { mapFeedItemToReelCard };

export async function createReelsSession(opts: {
  userId: string;
  seedContentId?: string;
  limit?: number;
}): Promise<ReelsSessionResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${API_HOST}/api/mobile/reels/session`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      userId: opts.userId,
      seedContentId: opts.seedContentId,
      limit: opts.limit ?? 12,
    }),
  });
  return res.json();
}

export async function fetchMoreReelsSession(opts: {
  userId: string;
  sessionId: string;
  seenIds: string[];
  limit?: number;
}): Promise<ReelsSessionResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${API_HOST}/api/mobile/reels/session`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "more",
      userId: opts.userId,
      sessionId: opts.sessionId,
      seenIds: opts.seenIds,
      limit: opts.limit ?? 8,
    }),
  });
  return res.json();
}

export async function postEngagementEvents(opts: {
  userId: string;
  events: Array<{
    surface: "reels" | "feed" | "story" | "shop" | "profile" | "explore";
    eventType: string;
    contentId: string;
    contentType?: string;
    creatorId?: string | null;
    sessionId?: string | null;
    watchMs?: number | null;
    metadata?: Record<string, unknown>;
  }>;
}): Promise<void> {
  try {
    const headers = await authHeaders();
    await fetch(`${API_HOST}/api/mobile/engagement/events`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch {
    /* non-blocking telemetry */
  }
}
