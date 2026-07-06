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

const STORAGE_KEY = "@aura/ecosystem_settings_v2";

export type ShopSettings = {
  defaultCountryIso: string;
  expressDelivery: boolean;
  codEnabled: boolean;
  showBankOffers: boolean;
  emailOrderUpdates: boolean;
  showPriceHistory: boolean;
  autoApplyCoupons: boolean;
};

export type NotificationSettings = {
  orderUpdates: boolean;
  priceDrops: boolean;
  newArrivals: boolean;
  liveShows: boolean;
  messages: boolean;
  posts: boolean;
  stories: boolean;
  reels: boolean;
  mentions: boolean;
  emailDigest: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
};

export type PrivacySettings = {
  showActivityStatus: boolean;
  allowTagging: boolean;
  personalizedAds: boolean;
  privateAccount: boolean;
  showFollowersList: boolean;
  suggestAccountToOthers: boolean;
  allowStorySharing: boolean;
  showShopActivity: boolean;
};

export type CreatorSettings = {
  saveReelsToGallery: boolean;
  highQualityUpload: boolean;
  showPrompterByDefault: boolean;
  uploadOnWifiOnly: boolean;
  saveOriginalPhotos: boolean;
};

export type TimeSettings = {
  dailyLimitMinutes: number;
  limitEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  breakReminders: boolean;
};

export type ContentSettings = {
  sensitiveContent: "less" | "standard" | "more";
  politicalContent: "reduce" | "standard";
  shopRecommendations: boolean;
  liveRecommendations: boolean;
  mutedWords: string[];
};

export type MessageSettings = {
  dmFrom: "everyone" | "following" | "none";
  storyRepliesFrom: "everyone" | "following" | "off";
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
  requestFiltering: boolean;
};

export type TagSettings = {
  allowTagsFrom: "everyone" | "following" | "none";
  manualTagApproval: boolean;
  allowMentionsFrom: "everyone" | "following" | "none";
};

export type AccessibilitySettings = {
  autoCaptions: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  largerText: boolean;
  screenReaderHints: boolean;
};

export type LanguageSettings = {
  appLanguage: string;
  region: string;
  useDeviceLanguage: boolean;
};

export type PaymentMethod = {
  id: string;
  type: "UPI" | "CARD" | "WALLET";
  label: string;
  last4?: string;
  isDefault: boolean;
};

export type PaymentSettings = {
  methods: PaymentMethod[];
  defaultMethodId: string | null;
  saveCardsForCheckout: boolean;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  loginAlerts: boolean;
  regionLockEnabled: boolean;
};

/** Instagram-style seller / professional store controls */
export type StoreSettings = {
  vacationMode: boolean;
  vacationMessage: string;
  autoAcceptOrders: boolean;
  customerMessagesEnabled: boolean;
  showInventoryCount: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  processingDays: number;
  freeShippingMinOrder: number;
  returnWindowDays: number;
  allowOffers: boolean;
  showShopTab: boolean;
};

export type EcosystemSettings = {
  shop: ShopSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  creator: CreatorSettings;
  time: TimeSettings;
  content: ContentSettings;
  messages: MessageSettings;
  tags: TagSettings;
  accessibility: AccessibilitySettings;
  language: LanguageSettings;
  payments: PaymentSettings;
  security: SecuritySettings;
  store: StoreSettings;
};

export const DEFAULT_ECOSYSTEM_SETTINGS: EcosystemSettings = {
  shop: {
    defaultCountryIso: "IN",
    expressDelivery: false,
    codEnabled: true,
    showBankOffers: true,
    emailOrderUpdates: true,
    showPriceHistory: true,
    autoApplyCoupons: false,
  },
  notifications: {
    orderUpdates: true,
    priceDrops: true,
    newArrivals: true,
    liveShows: true,
    messages: true,
    posts: true,
    stories: true,
    reels: true,
    mentions: true,
    emailDigest: false,
    pushEnabled: true,
    smsEnabled: false,
  },
  privacy: {
    showActivityStatus: true,
    allowTagging: true,
    personalizedAds: true,
    privateAccount: false,
    showFollowersList: true,
    suggestAccountToOthers: true,
    allowStorySharing: true,
    showShopActivity: false,
  },
  creator: {
    saveReelsToGallery: false,
    highQualityUpload: true,
    showPrompterByDefault: false,
    uploadOnWifiOnly: true,
    saveOriginalPhotos: false,
  },
  time: {
    dailyLimitMinutes: 60,
    limitEnabled: false,
    quietHoursEnabled: false,
    quietStart: "22:00",
    quietEnd: "08:00",
    breakReminders: false,
  },
  content: {
    sensitiveContent: "standard",
    politicalContent: "standard",
    shopRecommendations: true,
    liveRecommendations: true,
    mutedWords: [],
  },
  messages: {
    dmFrom: "everyone",
    storyRepliesFrom: "following",
    showReadReceipts: true,
    showOnlineStatus: true,
    requestFiltering: true,
  },
  tags: {
    allowTagsFrom: "everyone",
    manualTagApproval: false,
    allowMentionsFrom: "everyone",
  },
  accessibility: {
    autoCaptions: true,
    reduceMotion: false,
    highContrast: false,
    largerText: false,
    screenReaderHints: true,
  },
  language: {
    appLanguage: "en",
    region: "IN",
    useDeviceLanguage: true,
  },
  payments: {
    methods: [],
    defaultMethodId: null,
    saveCardsForCheckout: true,
  },
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    loginAlerts: true,
    regionLockEnabled: false,
  },
  store: {
    vacationMode: false,
    vacationMessage: "We're taking a short break. Orders will resume soon.",
    autoAcceptOrders: true,
    customerMessagesEnabled: true,
    showInventoryCount: true,
    lowStockAlert: true,
    lowStockThreshold: 5,
    processingDays: 2,
    freeShippingMinOrder: 999,
    returnWindowDays: 7,
    allowOffers: true,
    showShopTab: true,
  },
};

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
  return all;
}

const ADDRESSES_KEY = "@aura/saved_addresses_v1";

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
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(list.slice(0, 5)));
  return list;
}

export async function deleteSavedAddress(id: string): Promise<any[]> {
  const list = (await loadSavedAddresses()).filter((a) => a.id !== id);
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
  return list;
}

export function invalidateSettingsCache() {
  cache = null;
}
