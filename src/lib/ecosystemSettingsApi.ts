import { API_HOST } from "@/constants/api";
import type { EcosystemSettings } from "@/lib/ecosystemSettings";

export async function fetchRemoteEcosystemSettings(
  userId: string
): Promise<EcosystemSettings | null> {
  try {
    const res = await fetch(
      `${API_HOST}/api/mobile/settings/ecosystem?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    if (data.success && data.settings) return data.settings as EcosystemSettings;
  } catch {
    /* offline */
  }
  return null;
}

export async function patchRemoteEcosystemSection<K extends keyof EcosystemSettings>(
  userId: string,
  section: K,
  patch: Partial<EcosystemSettings[K]>
) {
  try {
    await fetch(`${API_HOST}/api/mobile/settings/ecosystem`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, section, patch }),
    });
  } catch {
    /* local wins until online */
  }
}

export async function pushRemoteEcosystemSettings(userId: string, settings: EcosystemSettings) {
  try {
    await fetch(`${API_HOST}/api/mobile/settings/ecosystem`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, settings }),
    });
  } catch {
    /* offline */
  }
}
