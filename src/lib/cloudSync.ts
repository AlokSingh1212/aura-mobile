import { setEcosystemSyncUserId, hydrateEcosystemFromRemote } from "@/lib/ecosystemSettings";
import {
  hydrateSocialGraphFromRemote,
  invalidateSocialGraphCache,
} from "@/lib/socialGraph";
import { setSocialGraphSyncContext } from "@/lib/socialGraphApi";

import { syncAddressesWithCloud } from "@/lib/addressesApi";

export async function syncCloudUserState(userId: string, profileId?: string | null) {
  setEcosystemSyncUserId(userId);
  setSocialGraphSyncContext(userId, profileId || null);
  if (profileId) {
    invalidateSocialGraphCache();
    await hydrateSocialGraphFromRemote(profileId).catch(() => {});
  }
  await hydrateEcosystemFromRemote(userId).catch(() => {});
  await syncAddressesWithCloud(userId).catch(() => {});
}

export function clearCloudUserState() {
  setEcosystemSyncUserId(null);
  setSocialGraphSyncContext(null, null);
}
