import { API_HOST } from "@/constants/api";
import type { SocialGraph } from "@/lib/socialGraph";

let syncContext: { userId: string | null; profileId: string | null } = {
  userId: null,
  profileId: null,
};

export function setSocialGraphSyncContext(userId: string | null, profileId: string | null) {
  syncContext = { userId, profileId };
}

export async function fetchRemoteSocialGraph(
  profileId: string
): Promise<Partial<SocialGraph> | null> {
  try {
    const res = await fetch(
      `${API_HOST}/api/mobile/social-graph?profileId=${encodeURIComponent(profileId)}`
    );
    const data = await res.json();
    if (data.success && data.graph) return data.graph as Partial<SocialGraph>;
  } catch {
    /* offline */
  }
  return null;
}

export async function pushRemoteSocialGraph(graph: SocialGraph) {
  const { userId, profileId } = syncContext;
  if (!userId || !profileId) return;
  try {
    await fetch(`${API_HOST}/api/mobile/social-graph`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, profileId, graph }),
    });
  } catch {
    /* retry on next mutation */
  }
}

function mergeUsers(local: SocialGraph["blocked"], remote: SocialGraph["blocked"]) {
  const map = new Map<string, (typeof local)[0]>();
  for (const u of [...remote, ...local]) {
    map.set(u.profileId, u);
  }
  return [...map.values()];
}

export function mergeSocialGraphs(local: SocialGraph, remote: Partial<SocialGraph>): SocialGraph {
  return {
    blocked: mergeUsers(local.blocked, remote.blocked || []),
    muted: mergeUsers(local.muted, remote.muted || []),
    closeFriends: mergeUsers(local.closeFriends, remote.closeFriends || []),
    favorites: mergeUsers(local.favorites, remote.favorites || []),
    archived: remote.archived?.length ? remote.archived : local.archived,
    hiddenPostIds: [
      ...new Set([...(remote.hiddenPostIds || []), ...local.hiddenPostIds]),
    ],
  };
}
