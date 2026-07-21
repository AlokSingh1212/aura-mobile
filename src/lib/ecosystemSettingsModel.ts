// Types and defaults — no imports from settingsEnforcement or ecosystemSettings runtime.
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
  acceptBrandPartnerships?: boolean;
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
  allowVideoCalls: boolean;
  allowAudioCalls: boolean;
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
  allowBrandPartnerships?: boolean;
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
    acceptBrandPartnerships: true,
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
    allowVideoCalls: true,
    allowAudioCalls: true,
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
    allowBrandPartnerships: true,
  },
};
