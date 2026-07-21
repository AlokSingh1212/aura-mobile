import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchRemoteEcosystemSettings,
  patchRemoteEcosystemSection,
  pushRemoteEcosystemSettings,
} from "@/lib/ecosystemSettingsApi";
import {
  notifySettingsEnforcementChanged,
  setEnforcedSettings,
} from "@/lib/settingsEnforcement";
import { pushRemoteAddresses } from "@/lib/addressesApi";
import type { EcosystemSettings, ShopSettings, NotificationSettings, PrivacySettings, CreatorSettings, TimeSettings, ContentSettings, MessageSettings, TagSettings, AccessibilitySettings, LanguageSettings, PaymentSettings, SecuritySettings, StoreSettings } from "@/lib/ecosystemSettingsModel";
import { DEFAULT_ECOSYSTEM_SETTINGS } from "@/lib/ecosystemSettingsModel";

export type {
  ShopSettings,
  NotificationSettings,
  PrivacySettings,
  CreatorSettings,
  TimeSettings,
  ContentSettings,
  MessageSettings,
  TagSettings,
  AccessibilitySettings,
  LanguageSettings,
  PaymentMethod,
  PaymentSettings,
  SecuritySettings,
  StoreSettings,
  EcosystemSettings,
} from "@/lib/ecosystemSettingsModel";
export { DEFAULT_ECOSYSTEM_SETTINGS } from "@/lib/ecosystemSettingsModel";

const STORAGE_KEY = "@aura/ecosystem_settings_v2";
const ADDRESSES_KEY = "@aura/saved_addresses_v1";

let cache: EcosystemSettings | null = null;
let syncUserId: string | null = null;

export function setEcosystemSyncUserId(userId: string | null) {
  syncUserId = userId;
}

function deepMergeSettings(parsed: Partial<EcosystemSettings>): EcosystemSettings {
  const d = DEFAULT_ECOSYSTEM_SETTINGS;
  return {
    shop: { ...d.shop, ...parsed.shop },
    notifications: { ...d.notifications, ...parsed.notifications },
    privacy: { ...d.privacy, ...parsed.privacy },
    creator: { ...d.creator, ...parsed.creator },
    time: { ...d.time, ...parsed.time },
    content: { ...d.content, ...parsed.content },
    messages: { ...d.messages, ...parsed.messages },
    tags: { ...d.tags, ...parsed.tags },
    accessibility: { ...d.accessibility, ...parsed.accessibility },
    language: { ...d.language, ...parsed.language },
    payments: {
      ...d.payments,
      ...parsed.payments,
      methods: parsed.payments?.methods ?? d.payments.methods,
    },
    security: { ...d.security, ...parsed.security },
    store: { ...d.store, ...parsed.store },
  };
}

export async function loadEcosystemSettings(): Promise<EcosystemSettings> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = deepMergeSettings(JSON.parse(raw));
      setEnforcedSettings(cache, { notify: false });
      return cache;
    }
    const legacy = await AsyncStorage.getItem("@aura/ecosystem_settings_v1");
    if (legacy) {
      cache = deepMergeSettings(JSON.parse(legacy));
      setEnforcedSettings(cache, { notify: false });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      return cache;
    }
  } catch {
    /* defaults */
  }
  cache = { ...DEFAULT_ECOSYSTEM_SETTINGS };
  setEnforcedSettings(cache, { notify: false });
  return cache;
}

export async function saveEcosystemSettings(
  next: Partial<EcosystemSettings>
): Promise<EcosystemSettings> {
  const current = await loadEcosystemSettings();
  const merged = deepMergeSettings({ ...current, ...next });
  cache = merged;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  setEnforcedSettings(merged);
  notifySettingsEnforcementChanged();
  if (syncUserId) {
    pushRemoteEcosystemSettings(syncUserId, merged).catch(() => {});
  }
  return merged;
}

type SectionKey = keyof EcosystemSettings;

export async function updateSettingsSection<K extends SectionKey>(
  section: K,
  patch: Partial<EcosystemSettings[K]>
): Promise<EcosystemSettings> {
  const current = await loadEcosystemSettings();
  const merged = await saveEcosystemSettings({
    [section]: { ...current[section], ...patch },
  } as Partial<EcosystemSettings>);
  if (syncUserId) {
    patchRemoteEcosystemSection(syncUserId, section, patch).catch(() => {});
  }
  const { syncCameraFromEcosystemSettings } = await import("@/lib/settingsRuntime");
  await syncCameraFromEcosystemSettings().catch(() => {});
  return merged;
}

export async function hydrateEcosystemFromRemote(userId: string) {
  const remote = await fetchRemoteEcosystemSettings(userId);
  if (!remote) return loadEcosystemSettings();
  cache = null;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deepMergeSettings(remote)));
  return loadEcosystemSettings();
}

export function invalidateEcosystemSettingsCache() {
  cache = null;
}

export async function updateShopSettings(p: Partial<ShopSettings>) {
  return updateSettingsSection("shop", p);
}
export async function updateNotificationSettings(p: Partial<NotificationSettings>) {
  return updateSettingsSection("notifications", p);
}
export async function updatePrivacySettings(p: Partial<PrivacySettings>) {
  return updateSettingsSection("privacy", p);
}
export async function updateCreatorSettings(p: Partial<CreatorSettings>) {
  return updateSettingsSection("creator", p);
}
export async function updateTimeSettings(p: Partial<TimeSettings>) {
  return updateSettingsSection("time", p);
}
export async function updateContentSettings(p: Partial<ContentSettings>) {
  return updateSettingsSection("content", p);
}
export async function updateMessageSettings(p: Partial<MessageSettings>) {
  return updateSettingsSection("messages", p);
}
export async function updateTagSettings(p: Partial<TagSettings>) {
  return updateSettingsSection("tags", p);
}
export async function updateAccessibilitySettings(p: Partial<AccessibilitySettings>) {
  return updateSettingsSection("accessibility", p);
}
export async function updateLanguageSettings(p: Partial<LanguageSettings>) {
  return updateSettingsSection("language", p);
}
export async function updatePaymentSettings(p: Partial<PaymentSettings>) {
  return updateSettingsSection("payments", p);
}
export async function updateSecuritySettings(p: Partial<SecuritySettings>) {
  return updateSettingsSection("security", p);
}
export async function updateStoreSettings(p: Partial<StoreSettings>) {
  return updateSettingsSection("store", p);
}

export async function refreshSettingsEnforcement() {
  const all = await loadEcosystemSettings();
  setEnforcedSettings(all, { notify: false });
  const { syncCameraFromEcosystemSettings } = await import("@/lib/settingsRuntime");
  await syncCameraFromEcosystemSettings().catch(() => {});
  return all;
}


export async function loadSavedAddresses(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAddressEntry(address: any): Promise<any[]> {
  const list = await loadSavedAddresses();
  const id = address.id || `addr_${Date.now()}`;
  const entry = { ...address, id };
  const idx = list.findIndex((a) => a.id === id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(list.slice(0, 10)));
  try {
    const { useStore } = await import("@/store/useStore");
    const uid = useStore.getState().currentUser?.id;
    if (uid) await pushRemoteAddresses(uid, list.slice(0, 10));
  } catch {
    /* best effort */
  }
  return list;
}

export async function deleteSavedAddress(id: string): Promise<any[]> {
  const list = (await loadSavedAddresses()).filter((a) => a.id !== id);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
  try {
    const { useStore } = await import("@/store/useStore");
    const uid = useStore.getState().currentUser?.id;
    if (uid) await pushRemoteAddresses(uid, list);
  } catch {
    /* best effort */
  }
  return list;
}

export function invalidateSettingsCache() {
  cache = null;
}
