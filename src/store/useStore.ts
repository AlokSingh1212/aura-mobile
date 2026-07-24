import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { API_BASE } from "@/constants/api";
import { authHeaders, registerAuthTokenGetter, registerAuthLogoutHandler, registerAuthSuspensionHandler, IS_PRODUCTION_APP } from "@/lib/apiClient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { 
  getLocalProducts, 
  cacheProducts, 
  getLocalFeedItems, 
  cacheFeedItems, 
  addPendingAction, 
  getPendingActions, 
  deletePendingAction,
  getSyncPointer,
  setSyncPointer,
  cacheConversations,
  cacheMessages,
  clearDatabase
} from "@/utils/localDb";
import { AuraPixel } from "@/lib/auraPixel";
import {
  loadAuthBundle,
  resolveMaisonId,
  saveAuthBundle,
  syncInstaStoriesWithProfile,
  buildYourStoryNode,
} from "@/lib/sessionIdentity";
import { syncCloudUserState, clearCloudUserState } from "@/lib/cloudSync";
import { fetchServerCart, syncServerCart } from "@/lib/cartApi";
import { refreshSettingsEnforcement } from "@/lib/ecosystemSettings";
import { validateAuthSession } from "@/lib/authApi";
import { refreshI18nLanguage } from "@/lib/i18n";
import { mapApiStoryToSlide } from "@/lib/storyLayers";
import { groupStoriesIntoRings } from "@/lib/storyFeedMapper";
import {
  shouldDeliverPushNotification,
  type NotificationCategory,
} from "@/lib/settingsEnforcement";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const rawCategory = notification.request.content.data?.category;
      const category =
        typeof rawCategory === "string"
          ? (rawCategory as NotificationCategory)
          : undefined;
      const deliver = shouldDeliverPushNotification(category);
      return {
        shouldShowAlert: deliver,
        shouldPlaySound: deliver,
        shouldSetBadge: false,
        shouldShowBanner: deliver,
        shouldShowList: deliver,
      };
    } catch {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
  },
});

const CURRENCY_MAP: Record<string, { code: string; symbol: string; rate: number }> = {
  'IN': { code: 'INR', symbol: '₹', rate: 1.0 },
  'GB': { code: 'GBP', symbol: '£', rate: 0.0095 },
  'EU': { code: 'EUR', symbol: '€', rate: 0.011 },
  'JP': { code: 'JPY', symbol: '¥', rate: 1.82 },
  'US': { code: 'USD', symbol: '$', rate: 0.012 }
};

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return null;
    }

    // Resolve projectId dynamically from EAS config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (error) {
    console.warn("Error registering for push notifications:", error);
    return null;
  }
}

function hydrateProfileFromApi(profile: any) {
  if (!profile) return profile;
  const social = profile.maison?.socialLinks;
  const tags =
    profile.tags ||
    (social && typeof social === "object" && Array.isArray(social.tags)
      ? social.tags
      : []);
  const websiteLink =
    profile.websiteLink !== undefined
      ? String(profile.websiteLink ?? "").trim()
      : String(profile.website ?? social?.website ?? "").trim();
  const externalLinks = profile.externalLinks ?? [];
  const allLinks = profile.allLinks ?? (websiteLink ? [websiteLink] : []);
  return {
    ...profile,
    logo: profile.logo || profile.maison?.logo || null,
    websiteLink,
    externalLinks,
    allLinks,
    website: websiteLink,
    bioText: profile.bioText || profile.maison?.about || "",
    tags,
  };
}

async function syncDevicePushToken(userId: string) {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      // 1. Sync token to User table
      await fetch(`${API_BASE}/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token })
      });

      // 2. Sync token to Profile table if we have an active profile
      const activeProfile = useStore.getState().activeProfile;
      const username = activeProfile?.username;
      if (username) {
        await fetch(`${API_BASE}/profile/notifications/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, token })
        });
      }
    }
  } catch (error) {
    console.warn("Could not sync push token to backend registry:", error);
  }
}


interface StoreState {
  products: any[];
  stories: any[];
  cart: any[];
  syncCartFromServer: () => Promise<void>;
  persistCartToServer: () => Promise<void>;
  warehouses: any[];
  orders: any[];

  currency: { code: string; symbol: string; rate: number };
  countryCode: string;
  detectLocation: () => Promise<void>;
  formatPrice: (amount: number) => string;
  setCurrency: (code: string) => void;

  // New State variables for parity expansion
  adBids: any[];
  adMetrics: any;
  repricerOffers: any[];
  pickTasks: any[];
  loyaltyPoints: number;
  loyaltyElite: boolean;
  loyaltyEliteUntil: string | null;
  rewardLogs: any[];

  aiCreativeResult: any;
  loadingAiCreative: boolean;
  brandDeals: any[];
  loadingDeals: boolean;
  influencers: any[];

  loadingProducts: boolean;
  loadingFeed: boolean;
  loadingWarehouses: boolean;
  loadingOrders: boolean;

  // New Loaders
  loadingAds: boolean;
  loadingRepricer: boolean;
  loadingWMS: boolean;
  loadingLoyalty: boolean;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchFeed: (reset?: boolean) => Promise<void>;
  feedCursor: string | null;
  hasMoreFeed: boolean;
  fetchWarehouses: (maisonId?: string) => Promise<void>;
  fetchOrders: (maisonId?: string) => Promise<void>;
  createWarehouse: (data: any) => Promise<boolean>;
  createProduct: (data: any) => Promise<{ success: boolean; artifactId?: string }>;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  initiateCheckout: (payload: { userId: string; cartItems: any[]; shippingAddress?: string; couponCode?: string; profileId?: string | null }) => Promise<any>;
  verifyPayment: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature?: string; profileId?: string | null }) => Promise<any>;
  applyCoupon: (payload: { code: string; maisonId?: string }) => Promise<any>;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "success") => void;

  // New Programmatic Campaigns Actions
  fetchAdBids: (maisonId: string, model?: string) => Promise<void>;
  createAdBid: (payload: any) => Promise<boolean>;
  fundAdWallet: (maisonId: string, amount: number) => Promise<boolean>;
  generateAiCreative: (artifactId: string, maisonId: string) => Promise<boolean>;
  fetchBrandDeals: (filters?: { creatorId?: string; creatorProfileId?: string; maisonId?: string }) => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  proposeBrandDeal: (payload: {
    creatorProfileId?: string;
    creatorId?: string;
    maisonId: string;
    budget: number;
    type: string;
    terms: string;
    title?: string;
  }) => Promise<boolean>;
  respondToBrandDeal: (
    dealId: string,
    status: "ACCEPTED" | "DECLINED" | "COMPLETED" | "CONFIRM"
  ) => Promise<boolean>;

  // New Competitor repricing actions
  fetchRepricer: (maisonId: string) => Promise<void>;
  updateRepricerRule: (payload: any) => Promise<boolean>;
  triggerPriceAudit: (artifactId: string) => Promise<boolean>;

  // New WMS Picking Lists & Catalog CSV Ingestion actions
  fetchPickTasks: (maisonId?: string) => Promise<void>;
  completePickTask: (taskId: string, pickerId: string) => Promise<boolean>;
  importCatalog: (payload: any) => Promise<boolean>;

  // New Loyalty Matrix Reward points ledger actions
  fetchLoyaltyInfo: (userId: string) => Promise<void>;
  redeemPoints: (payload: any) => Promise<any>;

  // Global Profile Sync Parameters
  activeMaisonId: string;
  setActiveMaisonId: (id: string) => void;

  // Active Session & Authentication
  currentUser: any | null;
  setCurrentUser: (user: any | null) => void;
  authSignUp: (payload: any) => Promise<{ success: boolean; error?: string; user?: any; token?: string; devOtp?: string }>;
  authLogIn: (payload: any) => Promise<{ success: boolean; error?: string; token?: string; requiresOtp?: boolean; userId?: string; devOtp?: string }>;
  authCompleteLoginWithOtp: (userId: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  authOAuth: (payload: {
    provider: "google" | "apple";
    idToken?: string;
    identityToken?: string;
    email?: string;
    fullName?: string;
  }) => Promise<{ success: boolean; error?: string; token?: string }>;
  updateProfile: (payload: any) => Promise<{ success: boolean; error?: string }>;
  authOnboard: (payload: any) => Promise<{ success: boolean; error?: string; user?: any; profile?: any }>;
  authLogOut: () => void;
  authHydrated: boolean;
  authToken: string | null;
  restoreAuthSession: () => Promise<void>;
  syncProfileIdentity: () => void;
  patchActiveProfile: (patch: Record<string, unknown>) => void;

  isAccountSuspended: boolean;
  setAccountSuspended: (suspended: boolean) => void;
  activeProfile: any | null;
  primaryProfile: any | null;
  userProfiles: any[];
  fetchProfiles: (userId: string) => Promise<void>;
  createNewProfile: (payload: any) => Promise<{ success: boolean; error?: string }>;
  switchActiveProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  switchSavedAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  instaStories: any[];
  addInstaStorySlide: (slide: any) => void;
  loadUserStories: (userId: string) => Promise<void>;
  loadStoryRings: (userId: string) => Promise<void>;

  notifications: any[];
  loadingNotifications: boolean;
  fetchNotifications: (profileId: string, type?: "ALL" | "LIKE" | "COMMENT" | "FOLLOW") => Promise<void>;
  markNotificationsRead: (profileId: string) => Promise<void>;

  // View Other User Profile
  viewingProfile: any | null;
  viewingProducts: any[];
  viewingHighlights: any[];
  loadingViewProfile: boolean;
  fetchViewProfile: (username: string, viewerProfileId?: string) => Promise<void>;
  clearViewProfile: () => void;
  followProfile: (followerProfileId: string, followingProfileId: string) => Promise<{ success: boolean; isFollowing?: boolean }>;

  // Wishlist
  wishlist: any[];
  fetchWishlist: (userId: string) => Promise<void>;
  toggleWishlist: (userId: string, artifactId: string) => Promise<{ success: boolean; wishlisted?: boolean }>;

  feedItems: any[];
  reelsSponsoredAd: any | null;
  loadingFeedItems: boolean;
  searchTiles: any[];
  activeSearchQuery: string;
  fetchFeedItems: (category?: string, tab?: "For You" | "Following", reset?: boolean) => Promise<void>;
  fetchSearchResults: (query: string) => Promise<void>;
  logEngagement: (
    feedItemId: string,
    type: "view" | "like" | "save" | "share" | "cart_add" | "purchase"
  ) => Promise<{ likeCount?: number; liked?: boolean } | null>;
  toggleFeedSave: (feedItemId: string) => Promise<void>;
  logFeedShare: (
    feedItemId: string
  ) => Promise<{ shareUrl: string | null; shareCount?: number } | null>;
  logFeedCartAdd: (feedItemId: string, productId: string) => Promise<void>;
  flushPendingActions: () => Promise<void>;
  syncDeltaPointer: () => Promise<void>;
  isSubscribed: boolean;
  setSubscribed: (subscribed: boolean) => void;
}

const MOCK_PRODUCTS = [
  {
    id: "p1",
    title: "Obsidian Gold Vestment",
    price: 185000,
    vibe: "Quiet Luxury",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Fashion",
    arMetadata: {
      categoryId: "fashion",
      categoryLabel: "Fashion",
      subcategoryId: "tops",
      subcategoryLabel: "Tops & Tees",
      colors: ["Noir", "White", "Navy"],
      sizes: ["S", "M", "L", "XL"],
      attributes: {
        material: "Silk blend",
        fit: "Relaxed",
        gender: "Unisex",
        care: "Dry clean only",
      },
    },
    variants: [
      { title: "Noir / S", price: 185000, stock: 3 },
      { title: "Noir / M", price: 185000, stock: 5 },
      { title: "White / M", price: 185000, stock: 2 },
    ],
  },
  {
    id: "p2",
    title: "Atelier Silk Trench Jacket",
    price: 245000,
    vibe: "Avant-Garde",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.8,
    rating: 4.8,
    type: "Fashion",
    arMetadata: {
      categoryId: "fashion",
      categoryLabel: "Fashion",
      subcategoryId: "outerwear",
      subcategoryLabel: "Jackets & Coats",
      colors: ["Black", "Camel"],
      sizes: ["S", "M", "L"],
      attributes: {
        material: "Silk trench",
        closure: "Belt",
        season: "Winter",
      },
    },
    variants: [
      { title: "Black / M", price: 245000, stock: 4 },
      { title: "Camel / L", price: 245000, stock: 2 },
    ],
  },
  {
    id: "p3",
    title: "Cyber Penthouse Cuff",
    price: 95000,
    vibe: "Brutalist",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.7,
    rating: 4.7,
    type: "Jewelry",
    description: "Hand-finished statement cuff in obsidian ceramic with gold inlay.",
    arMetadata: {
      categoryId: "jewelry",
      categoryLabel: "Jewelry",
      subcategoryId: "rings",
      subcategoryLabel: "Rings",
      colors: ["Gold", "Obsidian"],
      sizes: ["7", "8", "9"],
      attributes: {
        material: "Gold-plated",
        stone: "Obsidian",
        occasion: "Statement",
      },
    },
    variants: [
      { title: "Gold / 7", price: 95000, stock: 6 },
      { title: "Gold / 8", price: 95000, stock: 3 },
    ],
  },
  {
    id: "p4",
    title: "Heritage Calfskin Carryall",
    price: 320000,
    vibe: "Quiet Luxury",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Fashion",
    arMetadata: {
      categoryId: "fashion",
      categoryLabel: "Fashion",
      subcategoryId: "outerwear",
      subcategoryLabel: "Jackets & Coats",
      colors: ["Tan", "Black"],
      sizes: ["One Size"],
      attributes: { material: "Calfskin leather", type: "Carryall" },
    },
    variants: [{ title: "Tan / One Size", price: 320000, stock: 2 }],
  },
  {
    id: "p5",
    title: "Monochrome Linen Shirt",
    price: 12500,
    vibe: "Quiet Luxury",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 4.6,
    rating: 4.6,
    type: "Fashion",
    arMetadata: {
      categoryId: "fashion",
      categoryLabel: "Fashion",
      subcategoryId: "tops",
      subcategoryLabel: "Tops & Tees",
      colors: ["White", "Beige"],
      sizes: ["S", "M", "L", "XL"],
      attributes: { material: "Linen", fit: "Regular", gender: "Men" },
    },
    variants: [
      { title: "White / M", price: 12500, stock: 8 },
      { title: "Beige / L", price: 12500, stock: 5 },
    ],
  },
  {
    id: "p6",
    title: "Sculpted Wool Blazer",
    price: 89000,
    vibe: "Avant-Garde",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 4.8,
    rating: 4.8,
    type: "Fashion",
    arMetadata: {
      categoryId: "fashion",
      categoryLabel: "Fashion",
      subcategoryId: "outerwear",
      subcategoryLabel: "Jackets & Coats",
      colors: ["Charcoal", "Navy"],
      sizes: ["M", "L", "XL"],
      attributes: { material: "Wool blend", closure: "Button" },
    },
    variants: [{ title: "Charcoal / L", price: 89000, stock: 4 }],
  },
  {
    id: "p7",
    title: "Aura Glow Serum",
    price: 4500,
    vibe: "Aesthetic Core",
    images: ["https://auragram.com/logo.png"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 4.7,
    rating: 4.7,
    type: "Beauty",
    arMetadata: {
      categoryId: "beauty",
      categoryLabel: "Beauty",
      subcategoryId: "skincare",
      subcategoryLabel: "Skincare",
      attributes: { volume: "30ml", skinType: "All", concern: "Brightening" },
    },
    variants: [{ title: "Standard", price: 4500, stock: 20 }],
  },
];

export const useStore = create<StoreState>((set, get) => ({
  products: [],
  stories: [],
  cart: [],

  syncCartFromServer: async () => {
    const user = get().currentUser;
    const profileId = get().activeProfile?.id;
    if (!user?.id || !profileId) return;
    try {
      const items = await fetchServerCart(user.id, profileId);
      set({ cart: items });
    } catch (e) {
      console.warn("Could not load profile cart:", e);
    }
  },

  persistCartToServer: async () => {
    const user = get().currentUser;
    const profileId = get().activeProfile?.id;
    if (!user?.id || !profileId) return;
    try {
      const items = get().cart.map((item) => ({
        id: item.id,
        quantity: item.quantity || 1,
        variantId: item.variantId ?? null,
      }));
      const synced = await syncServerCart(user.id, profileId, items);
      set({ cart: synced });
    } catch (e) {
      console.warn("Could not persist profile cart:", e);
    }
  },
  warehouses: [],
  orders: [],
  wishlist: [],
  feedItems: [],
  reelsSponsoredAd: null,
  loadingFeedItems: false,
  searchTiles: [],
  activeSearchQuery: "",

  currency: CURRENCY_MAP['IN'],
  countryCode: 'IN',

  // Advanced States
  adBids: [],
  adMetrics: null,
  repricerOffers: [],
  pickTasks: [],
  loyaltyPoints: 1240, // Simulated default points matching telemetry
  loyaltyElite: false,
  loyaltyEliteUntil: null,
  rewardLogs: [],

  aiCreativeResult: null,
  loadingAiCreative: false,
  brandDeals: [],
  loadingDeals: false,
  influencers: [],

  activeMaisonId: "",
  setActiveMaisonId: (id) => set({ activeMaisonId: id }),

  authHydrated: false,
  authToken: null,

  syncProfileIdentity: () => {
    const s = get();
    const activeMaisonId = resolveMaisonId(s.activeProfile, s.currentUser, s.activeMaisonId);
    let instaStories = syncInstaStoriesWithProfile(
      s.instaStories,
      s.activeProfile,
      s.currentUser
    );
    if (s.currentUser?.id) {
      const yourStory = instaStories.find((story) => story.isYourStory);
      instaStories = yourStory
        ? [yourStory]
        : [buildYourStoryNode(s.activeProfile, s.currentUser, [])];
    }
    set({ activeMaisonId, instaStories });
    if (s.currentUser?.id) {
      saveAuthBundle(AsyncStorage, {
        currentUser: s.currentUser,
        activeProfile: s.activeProfile,
        userProfiles: s.userProfiles,
        activeMaisonId,
        authToken: s.authToken,
      }).catch(() => {});
    }
  },

  patchActiveProfile: (patch: Record<string, unknown>) => {
    set((state) => ({
      activeProfile: state.activeProfile
        ? { ...state.activeProfile, ...patch }
        : state.activeProfile,
      userProfiles: state.userProfiles.map((prof) =>
        prof.id === state.activeProfile?.id ? { ...prof, ...patch } : prof
      ),
    }));
    get().syncProfileIdentity();
  },

  restoreAuthSession: async () => {
    try {
      const bundle = await loadAuthBundle(AsyncStorage);
      if (!bundle?.currentUser?.id) {
        // No cached session — mark hydrated immediately so login screen shows instantly
        set({ authHydrated: true });
        return;
      }

      // ✅ INSTANT LAUNCH: Restore from local cache and mark hydrated immediately
      // This lets the app navigate to the home screen in ~50ms (Instagram-style)
      set({
        currentUser: bundle.currentUser,
        activeProfile: bundle.activeProfile,
        userProfiles: bundle.userProfiles || [],
        authToken: bundle.authToken || null,
        activeMaisonId:
          bundle.activeMaisonId ||
          resolveMaisonId(bundle.activeProfile, bundle.currentUser),
        authHydrated: true,
      });

      // 🔄 BACKGROUND VALIDATION: Verify session with server silently
      // If server says session is invalid, log out then. User sees no delay.
      validateAuthSession().then(async (session) => {
        if (!session.success || !session.user) {
          // Keep cached session when offline / slow network — don't wipe on timeout.
          if (session.error === "CONNECTION_TIMEOUT") return;
          get().authLogOut();
          return;
        }

        const serverUser = session.user;
        set({
          currentUser: { ...bundle.currentUser, ...serverUser },
          activeProfile: (serverUser.activeProfile as typeof bundle.activeProfile) || bundle.activeProfile,
          userProfiles: (serverUser.profiles as typeof bundle.userProfiles) || bundle.userProfiles,
        });

        await saveAuthBundle(AsyncStorage, {
          currentUser: get().currentUser!,
          activeProfile: get().activeProfile,
          userProfiles: get().userProfiles,
          activeMaisonId: get().activeMaisonId,
          authToken: get().authToken,
        });

        get().syncProfileIdentity();
        refreshI18nLanguage().catch(() => {});
        get()
          .fetchProfiles(String(serverUser.id))
          .catch(() => {});
        syncCloudUserState(String(serverUser.id), get().activeProfile?.id).catch(() => {});
      }).catch((e) => {
        console.warn("Background auth validation failed:", e);
      });
    } catch (e) {
      console.warn("Auth session restore failed:", e);
      set({ authHydrated: true });
    }
  },

  instaStories: [
    {
      id: "ys",
      username: "Your story",
      avatar: "",
      isYourStory: true,
      slides: [],
    },
  ],

  loadingProducts: false,
  loadingFeed: false,
  loadingWarehouses: false,
  loadingOrders: false,
  loadingAds: false,
  loadingRepricer: false,
  loadingWMS: false,
  loadingLoyalty: false,
  notifications: [],
  loadingNotifications: false,
  feedCursor: null,
  hasMoreFeed: true,

  fetchProducts: async () => {
    // 💾 Hydrate from SQLite disk cache immediately
    try {
      const cachedProducts = getLocalProducts();
      if (cachedProducts && cachedProducts.length > 0) {
        set({ products: cachedProducts });
      }
    } catch (err) {
      console.warn("SQLite Products cache load failed:", err);
    }

    if (get().products.length === MOCK_PRODUCTS.length) {
      set({ loadingProducts: true });
    }
    try {
      const user = get().currentUser;
      const url = user ? `${API_BASE}/products?userId=${user.id}` : `${API_BASE}/products`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.products) {
        if (JSON.stringify(data.products) !== JSON.stringify(get().products)) {
          set({ products: data.products });
        }
        // 💾 Persist to SQLite disk cache
        try {
          cacheProducts(data.products);
        } catch (err) {
          console.warn("Failed to save products in SQLite:", err);
        }
      }
    } catch (e) {
      console.warn("Could not query products from API.", e);
      if (!IS_PRODUCTION_APP && get().products.length === 0) {
        set({ products: MOCK_PRODUCTS });
      }
    } finally {
      set({ loadingProducts: false });
    }
  },

  fetchFeed: async (reset = false) => {
    if (get().loadingFeed) {
      return;
    }

    if (reset) {
      set({ stories: [], feedCursor: null, hasMoreFeed: true });
    }

    if (!get().hasMoreFeed && !reset) {
      return;
    }

    set({ loadingFeed: true });

    try {
      const user = get().currentUser;
      const cursor = reset ? "" : get().feedCursor;
      const url = user
        ? `${API_BASE}/feed?userId=${user.id}&limit=10${cursor ? "&cursor=" + cursor : ""}`
        : `${API_BASE}/feed?limit=10${cursor ? "&cursor=" + cursor : ""}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const loadedStories = data.stories || [];
        const nextCursor = data.nextCursor;

        let finalUnique: any[] = [];
        set((state) => {
          const merged = reset ? loadedStories : [...state.stories, ...loadedStories];
          // deduplicate just in case
          const unique = merged.filter((item: any, idx: number, self: any[]) =>
            self.findIndex((t) => t.id === item.id) === idx
          );
          finalUnique = unique;
          return {
            stories: unique,
            feedCursor: nextCursor || null,
            hasMoreFeed: !!nextCursor
          };
        });

        // 💾 Persist successful fetch back to AsyncStorage disk cache
        if (finalUnique.length > 0) {
          try {
            await AsyncStorage.setItem("aura_feed_cache", JSON.stringify(finalUnique));
          } catch (err) {
            console.warn("Failed to write to offline cache:", err);
          }
        }
      }
    } catch (e) {
      console.warn("Could not query visual feed from local host. Using simulated stories fallback.", e);
    } finally {
      set({ loadingFeed: false });
    }
  },

  fetchWarehouses: async (maisonId) => {
    if (get().warehouses.length === 0) {
      set({ loadingWarehouses: true });
    }
    try {
      const url = maisonId ? `${API_BASE}/warehouses?maisonId=${maisonId}` : `${API_BASE}/warehouses`;
      const res = await fetch(url);
      const data = await res.json();
      if (JSON.stringify(data) !== JSON.stringify(get().warehouses)) {
        set({ warehouses: data });
      }
    } catch (e) {
      console.warn("Could not query warehouse nodes ledger from local host. Using simulated hubs.", e);
    } finally {
      set({ loadingWarehouses: false });
    }
  },

  createWarehouse: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchWarehouses(payload.maisonId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not create warehouse node on local host.", e);
      return false;
    }
  },

  fetchOrders: async (maisonId) => {
    if (get().orders.length === 0) {
      set({ loadingOrders: true });
    }
    try {
      const url = maisonId ? `${API_BASE}/orders?maisonId=${maisonId}` : `${API_BASE}/orders`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) {
        set({ orders: [] });
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && JSON.stringify(data) !== JSON.stringify(get().orders)) {
        set({ orders: data });
      }
    } catch (e) {
      console.warn("Could not query orders ledger.", e);
    } finally {
      set({ loadingOrders: false });
    }
  },

  createProduct: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/products/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchProducts();
        return { success: true, artifactId: data.artifact?.id };
      }
      console.warn("Product create refused:", data.error || data.message);
      return { success: false, error: data.error || data.message };
    } catch (e) {
      console.warn("Could not create dynamic catalog product on local host.", e);
      return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  },

  addToCart: (product) => {
    get().triggerHaptic("medium");
    const user = get().currentUser;
    AuraPixel.addToCart({
      userId: user?.id,
      contentId: product.id,
      sku: product.id,
      val: product.price,
      currency: "INR",
    });
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    });
    get().persistCartToServer();
  },

  removeFromCart: (productId) => {
    get().triggerHaptic("light");
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
    get().persistCartToServer();
  },

  clearCart: () => {
    set({ cart: [] });
    get().persistCartToServer();
  },

  triggerHaptic: (type = "light") => {
    try {
      if (type === "light") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === "medium") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === "heavy") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      // Swallowed on platforms/emulators that don't support physical haptic motors
    }
  },

  // 1. Programmatic Campaign Ads actions
  fetchAdBids: async (maisonId, model = "LAST_TOUCH") => {
    set({ loadingAds: true });
    try {
      const res = await fetch(`${API_BASE}/ads?maisonId=${maisonId}&attributionModel=${model}`);
      const data = await res.json();
      if (data.success) {
        set({ adBids: data.metrics.bids, adMetrics: data.metrics });
      }
    } catch (e) {
      console.warn("Could not query ad metrics from local host.", e);
    } finally {
      set({ loadingAds: false });
    }
  },

  createAdBid: async (payload) => {
    try {
      const user = get().currentUser;
      const res = await fetch(`${API_BASE}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchAdBids(payload.maisonId);
        return true;
      }
      console.warn("createAdBid failed:", data.error);
      return false;
    } catch (e) {
      console.warn("Could not place ad bid on local host.", e);
      return false;
    }
  },

  fundAdWallet: async (maisonId, amount) => {
    try {
      const res = await fetch(`${API_BASE}/ads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maisonId, amount })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchAdBids(maisonId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not top up ad wallet.", e);
      return false;
    }
  },

  generateAiCreative: async (artifactId, maisonId) => {
    set({ loadingAiCreative: true, aiCreativeResult: null });
    try {
      const res = await fetch(`${API_BASE}/ads/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId, maisonId })
      });
      const data = await res.json();
      if (data.success) {
        set({ aiCreativeResult: data });
        get().triggerHaptic("success");
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not generate AI creative copy.", e);
      return false;
    } finally {
      set({ loadingAiCreative: false });
    }
  },

  fetchBrandDeals: async (filters = {}) => {
    set({ loadingDeals: true });
    try {
      const userId = get().currentUser?.id;
      if (!userId) return;
      const query = new URLSearchParams({ userId });
      if (filters.creatorId) query.append("creatorId", filters.creatorId);
      if (filters.maisonId) query.append("maisonId", filters.maisonId);
      if (filters.creatorProfileId) query.append("creatorProfileId", filters.creatorProfileId);

      const res = await fetch(`${API_BASE}/brand-deals?${query.toString()}`, {
        headers: (await import("@/lib/apiClient")).authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        set({ brandDeals: data.deals });
      }
    } catch (e) {
      console.warn("Could not query brand deals from backend.", e);
    } finally {
      set({ loadingDeals: false });
    }
  },

  fetchInfluencers: async () => {
    try {
      const userId = get().currentUser?.id;
      if (!userId) return;
      const res = await fetch(`${API_BASE}/brand-deals?userId=${userId}&creators=true`, {
        headers: (await import("@/lib/apiClient")).authHeaders(),
      });
      const data = await res.json();
      if (data.success && data.creators?.length) {
        set({ influencers: data.creators });
      }
    } catch (e) {
      console.warn("Could not fetch influencers list.", e);
    }
  },

  proposeBrandDeal: async (payload) => {
    try {
      const userId = get().currentUser?.id;
      if (!userId) return false;
      const res = await fetch(`${API_BASE}/brand-deals`, {
        method: "POST",
        headers: (await import("@/lib/apiClient")).authHeaders(),
        body: JSON.stringify({ ...payload, userId, action: "propose", creatorProfileId: payload.creatorProfileId || payload.creatorId }),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchBrandDeals({ maisonId: payload.maisonId });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not propose brand deal.", e);
      return false;
    }
  },

  respondToBrandDeal: async (dealId, status) => {
    try {
      const userId = get().currentUser?.id;
      const profileId = get().activeProfile?.id;
      if (!userId || !profileId) return false;
      const respondAction =
        status === "ACCEPTED"
          ? "accept"
          : status === "DECLINED"
            ? "decline"
            : status === "COMPLETED"
              ? "complete"
              : "confirm";
      const res = await fetch(`${API_BASE}/brand-deals`, {
        method: "POST",
        headers: (await import("@/lib/apiClient")).authHeaders(),
        body: JSON.stringify({ userId, profileId, dealId, action: "respond", respondAction }),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchBrandDeals({ creatorId: userId, maisonId: get().activeMaisonId || undefined });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not respond to brand deal.", e);
      return false;
    }
  },

  // 2. Competitor price repricing actions
  fetchRepricer: async (maisonId) => {
    set({ loadingRepricer: true });
    try {
      const res = await fetch(`${API_BASE}/repricer?maisonId=${maisonId}`);
      const data = await res.json();
      set({ repricerOffers: data });
    } catch (e) {
      console.warn("Could not fetch repricer status.", e);
    } finally {
      set({ loadingRepricer: false });
    }
  },

  updateRepricerRule: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/repricer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchRepricer(payload.maisonId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not configure repricer rule.", e);
      return false;
    }
  },

  triggerPriceAudit: async (artifactId) => {
    try {
      const res = await fetch(`${API_BASE}/repricer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId })
      });
      const data = await res.json();
      return data.success || false;
    } catch (e) {
      console.warn("Could not trigger dynamic repricing.", e);
      return false;
    }
  },

  // 3. WMS Picking Lists & Ingestions actions
  fetchPickTasks: async (maisonId) => {
    set({ loadingWMS: true });
    try {
      const url = maisonId ? `${API_BASE}/wms?maisonId=${maisonId}` : `${API_BASE}/wms`;
      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      set({ pickTasks: data });
    } catch (e) {
      console.warn("Could not fetch pick tasks.", e);
    } finally {
      set({ loadingWMS: false });
    }
  },

  completePickTask: async (taskId, pickerId) => {
    try {
      const res = await fetch(`${API_BASE}/wms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "COMPLETE_PICK_TASK", taskId, pickerId })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not complete picking task.", e);
      return false;
    }
  },

  importCatalog: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/wms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "BULK_INGEST_CATALOG", ...payload })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchProducts();
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not bulk ingest catalog.", e);
      return false;
    }
  },

  // 4. Loyalty Reward points actions
  fetchLoyaltyInfo: async (userId) => {
    set({ loadingLoyalty: true });
    try {
      const res = await fetch(`${API_BASE}/loyalty?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        set({
          loyaltyPoints: data.auraCredits,
          loyaltyElite: data.isElite,
          loyaltyEliteUntil: data.eliteUntil,
          rewardLogs: data.rewardLogs
        });
      }
    } catch (e) {
      console.warn("Could not query loyalty account info.", e);
    } finally {
      set({ loadingLoyalty: false });
    }
  },

  redeemPoints: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REDEEM_COUPON", ...payload })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchLoyaltyInfo(payload.userId);
        return data;
      }
      return null;
    } catch (e) {
      console.warn("Redeem points request failed.", e);
      return null;
    }
  },

  activeProfile: null,
  primaryProfile: null,
  userProfiles: [],
  isAccountSuspended: false,
  setAccountSuspended: (suspended) => set({ isAccountSuspended: suspended }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  isSubscribed: false,
  setSubscribed: (subscribed) => set({ isSubscribed: subscribed }),

  authSignUp: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({
          currentUser: data.user,
          activeMaisonId: data.user.maisonId,
          authToken: data.token || null,
        });
        get().syncProfileIdentity();
        await get().fetchProfiles(data.user.id);
        get().syncProfileIdentity();
        return {
          success: true,
          user: data.user,
          token: data.token,
          devOtp: data.devOtp,
        };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Signup fetch failed:", e);
      return { success: false, error: e.message || "Failed to connect to AURA database node." };
    }
  },

  authLogIn: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.requiresOtp) {
        return {
          success: true,
          requiresOtp: true,
          userId: data.userId,
          devOtp: data.devOtp,
        };
      }
      if (data.success) {
        get().triggerHaptic("success");
        set({
          currentUser: data.user,
          activeMaisonId: data.user.maisonId,
          authToken: data.token || null,
        });
        const { upsertSavedAccount } = await import("@/lib/multiAccountSession");
        await upsertSavedAccount({
          userId: data.user.id,
          email: data.user.email || "",
          username: data.user.username || data.user.email || "",
          token: data.token || "",
        });
        get().syncProfileIdentity();
        await get().fetchProfiles(data.user.id);
        get().syncProfileIdentity();
        await refreshSettingsEnforcement();
        return { success: true, token: data.token };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Login fetch failed:", e);
      return { success: false, error: e.message || "Failed to connect to AURA database node." };
    }
  },

  switchSavedAccount: async (userId: string) => {
    try {
      const { loadSavedAccounts } = await import("@/lib/multiAccountSession");
      const accounts = await loadSavedAccounts();
      const account = accounts.find((a) => a.userId === userId);
      if (!account?.token) {
        return { success: false, error: "Account session expired. Sign in again." };
      }
      set({ authToken: account.token });
      const res = await fetch(`${API_BASE}/profile?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${account.token}` },
      });
      const data = await res.json();
      if (!data.success || !data.profile) {
        return { success: false, error: "Could not restore account session." };
      }
      const profile = data.profile;
      const user = {
        id: userId,
        name: profile.profileName || profile.name || account.username,
        email: account.email,
        username: profile.username || account.username,
        maisonId: profile.maisonId || profile.username,
        avatar: profile.logo,
      };
      set({ currentUser: user, activeMaisonId: user.maisonId });
      get().syncProfileIdentity();
      await get().fetchProfiles(userId);
      get().syncProfileIdentity();
      await refreshSettingsEnforcement();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Account switch failed." };
    }
  },

  authCompleteLoginWithOtp: async (userId, otpCode) => {
    try {
      const { completeLoginWithOtp } = await import("@/lib/twoFactorApi");
      const data = await completeLoginWithOtp(userId, otpCode);
      if (data.success && data.user) {
        get().triggerHaptic("success");
        set({
          currentUser: data.user,
          activeMaisonId: data.user.maisonId,
          authToken: data.token || null,
        });
        const { upsertSavedAccount } = await import("@/lib/multiAccountSession");
        await upsertSavedAccount({
          userId: data.user.id,
          email: data.user.email || "",
          username: data.user.username || data.user.email || "",
          token: data.token || "",
        });
        get().syncProfileIdentity();
        await get().fetchProfiles(data.user.id);
        get().syncProfileIdentity();
        await refreshSettingsEnforcement();
        return { success: true };
      }
      return { success: false, error: data.error || "Verification failed." };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to verify login code." };
    }
  },

  authOAuth: async (payload) => {
    try {
      const path = payload.provider === "apple" ? "auth/apple" : "auth/google";
      const res = await fetch(`${API_BASE}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({
          currentUser: data.user,
          activeMaisonId: data.user.maisonId,
          authToken: data.token || null,
        });
        get().syncProfileIdentity();
        await get().fetchProfiles(data.user.id);
        get().syncProfileIdentity();
        await refreshSettingsEnforcement();
        return { success: true, token: data.token };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      return { success: false, error: e.message || "OAuth sign-in failed." };
    }
  },

  updateProfile: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/profile/update`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({ currentUser: data.user });
        return { success: true };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Profile update fetch failed:", e);
      return { success: false, error: e.message || "Failed to update profile." };
    }
  },

  authOnboard: async (payload) => {
    try {
      let token = get().authToken;
      if (!token) {
        const bundle = await loadAuthBundle(AsyncStorage);
        if (bundle?.authToken) {
          token = bundle.authToken;
          set({ authToken: token });
        }
      }
      if (!token) {
        return {
          success: false,
          error: "Session expired. Please sign in again.",
        };
      }

      const res = await fetch(`${API_BASE}/auth/onboard`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({ currentUser: data.user, activeMaisonId: data.user.maisonId });
        await get().fetchProfiles(data.user.id);
        get().syncProfileIdentity();
        return { success: true, user: data.user, profile: data.profile };
      }
      const errMsg =
        data.error === "UNAUTHORIZED" || res.status === 401
          ? "Valid session token required. Please sign in again."
          : data.message || data.error;
      return { success: false, error: errMsg };
    } catch (e: any) {
      console.warn("Onboarding fetch failed:", e);
      return { success: false, error: e.message || "Failed to reach onboarding database gateway." };
    }
  },

  fetchProfiles: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/profile/list?userId=${userId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const profiles = (data.profiles || []).map(hydrateProfileFromApi);
        const activeProfile = hydrateProfileFromApi(data.activeProfile);
        const primaryProfile = hydrateProfileFromApi(data.primaryProfile);
        set({ userProfiles: profiles, activeProfile, primaryProfile });
        get().syncProfileIdentity();
        syncDevicePushToken(userId);
        AuraPixel.loadConfig(userId);
        await syncCloudUserState(userId, activeProfile?.id);
        await refreshSettingsEnforcement();
        await get().syncCartFromServer();
      }
    } catch (e) {
      console.warn("Could not fetch sovereign profiles:", e);
    }
  },

  createNewProfile: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/profile/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        const profiles = (data.profiles || []).map(hydrateProfileFromApi);
        const activeProfile = hydrateProfileFromApi(data.activeProfile);
        const primaryProfile = hydrateProfileFromApi(data.primaryProfile);
        set({
          userProfiles: profiles,
          activeProfile,
          primaryProfile,
          currentUser: get().currentUser
            ? {
                ...get().currentUser,
                activeProfileId: activeProfile.id,
                maisonId:
                  activeProfile.type === "BUSINESS"
                    ? activeProfile.maisonId || activeProfile.username
                    : get().currentUser?.maisonId,
                isBusinessAccount: activeProfile.type === "BUSINESS",
              }
            : null,
        });
        get().syncProfileIdentity();
        get().fetchProducts();
        get().fetchFeed();
        return { success: true };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Profile create request failed:", e);
      return { success: false, error: e.message || "Failed to contact database gateway." };
    }
  },

  switchActiveProfile: async (profileId) => {
    const user = get().currentUser;
    if (!user) return { success: false, error: "No active user logged in." };

    try {
      const res = await fetch(`${API_BASE}/profile/switch`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId: user.id, profileId })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        const profiles = (data.profiles || []).map(hydrateProfileFromApi);
        const activeProfile = hydrateProfileFromApi(data.activeProfile);
        const primaryProfile = hydrateProfileFromApi(data.primaryProfile);
        set({
          userProfiles: profiles,
          activeProfile,
          primaryProfile,
          currentUser: data.user,
        });
        get().syncProfileIdentity();
        get().fetchProducts();
        get().fetchFeed();
        await get().syncCartFromServer();
        await syncCloudUserState(user.id, activeProfile.id);
        return { success: true };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Profile switch request failed:", e);
      return { success: false, error: e.message || "Failed to contact database gateway." };
    }
  },

  addInstaStorySlide: (slide) => {
    set((state) => {
      const updated = state.instaStories.map((story) => {
        if (story.isYourStory) {
          return {
            ...story,
            slides: [slide, ...(story.slides || [])],
          };
        }
        return story;
      });
      return { instaStories: updated };
    });
    get().syncProfileIdentity();
  },

  loadUserStories: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/profile/stories?userId=${encodeURIComponent(userId)}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.stories)) return;

      const slides = data.stories.map((s: Record<string, unknown>) => mapApiStoryToSlide(s));

      set((state) => {
        const others = state.instaStories.filter((s) => !s.isYourStory);
        const yourStory = buildYourStoryNode(state.activeProfile, state.currentUser, slides);
        return { instaStories: [yourStory, ...others] };
      });
      get().syncProfileIdentity();
    } catch (e) {
      console.warn("Could not load user stories from server.", e);
    }
  },

  loadStoryRings: async (userId) => {
    try {
      const res = await fetch(
        `${API_BASE}/feed/stories?userId=${encodeURIComponent(userId)}&limit=40`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!data.success || !Array.isArray(data.stories)) return;

      const profileId = get().activeProfile?.id || null;
      const rings = groupStoriesIntoRings(data.stories, profileId).filter((g) => !g.isYourStory);

      set((state) => {
        const yourStory =
          state.instaStories.find((s) => s.isYourStory) ||
          buildYourStoryNode(state.activeProfile, state.currentUser, []);
        return { instaStories: [yourStory, ...rings] };
      });
      get().syncProfileIdentity();
    } catch (e) {
      console.warn("Could not load story rings from feed.", e);
    }
  },

  fetchNotifications: async (profileId, type = "ALL") => {
    set({ loadingNotifications: true });
    try {
      const qs = new URLSearchParams({ profileId });
      if (type && type !== "ALL") qs.set("type", type);
      const res = await fetch(`${API_BASE}/notifications?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        set({ notifications: data.notifications });
      }
    } catch (e) {
      console.warn("Could not fetch notifications from local host.", e);
    } finally {
      set({ loadingNotifications: false });
    }
  },

  markNotificationsRead: async (profileId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("light");
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      }
    } catch (e) {
      console.warn("Could not mark notifications as read.", e);
    }
  },

  authLogOut: () => {
    get().triggerHaptic("medium");
    saveAuthBundle(AsyncStorage, null).catch(() => {});
    clearCloudUserState();
    clearDatabase();
    set({
      currentUser: null,
      activeProfile: null,
      primaryProfile: null,
      userProfiles: [],
      activeMaisonId: "",
      authToken: null,
      notifications: [],
      viewingProfile: null,
      isAccountSuspended: false,
      viewingProducts: [],
      viewingHighlights: [],
    });
    get().syncProfileIdentity();
  },

  // View Other User's Profile
  viewingProfile: null,
  viewingProducts: [],
  viewingHighlights: [],
  loadingViewProfile: false,

  fetchViewProfile: async (username, viewerProfileId) => {
    set({ loadingViewProfile: true, viewingProfile: null, viewingProducts: [], viewingHighlights: [] });
    try {
      const query = viewerProfileId
        ? `${API_BASE}/profile/view?username=${username}&viewerProfileId=${viewerProfileId}`
        : `${API_BASE}/profile/view?username=${username}`;
      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        set({
          viewingProfile: data.profile,
          viewingProducts: data.products || [],
          viewingHighlights: data.highlights || []
        });
      }
    } catch (e) {
      console.warn("Could not fetch profile view.", e);
    } finally {
      set({ loadingViewProfile: false });
    }
  },

  clearViewProfile: () => {
    set({ viewingProfile: null, viewingProducts: [], viewingHighlights: [] });
  },

  followProfile: async (followerProfileId, followingProfileId) => {
    try {
      get().triggerHaptic("medium");
      const res = await fetch(`${API_BASE}/profile/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerProfileId, followingProfileId })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update the viewing profile follow state and counts
        const vp = get().viewingProfile;
        if (vp && vp.profileId === followingProfileId) {
          set({
            viewingProfile: {
              ...vp,
              isFollowing: data.isFollowing,
              followersCount: data.followersCount
            }
          });
        }
        get().triggerHaptic(data.isFollowing ? "success" : "light");
        return { success: true, isFollowing: data.isFollowing };
      }
      return { success: false };
    } catch (e) {
      console.warn("Follow toggle failed.", e);
      return { success: false };
    }
  },

  initiateCheckout: async (payload) => {
    try {
      get().triggerHaptic("medium");
      const profileId = payload.profileId ?? get().activeProfile?.id ?? null;
      const res = await fetch(`${API_BASE}/checkout/create-order`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...payload, profileId }),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("initiateCheckout failed.", e);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  verifyPayment: async (payload) => {
    try {
      get().triggerHaptic("success");
      const profileId = payload.profileId ?? get().activeProfile?.id ?? null;
      const res = await fetch(`${API_BASE}/checkout/verify-payment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...payload, profileId }),
      });
      const data = await res.json();
      if (data.success) {
        const user = get().currentUser;
        const total = get().cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
        AuraPixel.purchase({
          userId: user?.id,
          val: total,
          currency: "INR",
        });
        set({ cart: [] });
        await get().fetchOrders();
      }
      return data;
    } catch (e) {
      console.warn("verifyPayment failed.", e);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  applyCoupon: async (payload) => {
    try {
      get().triggerHaptic("light");
      const res = await fetch(`${API_BASE}/checkout/apply-coupon`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("applyCoupon failed.", e);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  fetchWishlist: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/wishlist?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.wishlist) {
        set({ wishlist: data.wishlist });
      }
    } catch (e) {
      console.warn("fetchWishlist failed.", e);
    }
  },

  toggleWishlist: async (userId, artifactId) => {
    try {
      get().triggerHaptic("medium");
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, artifactId })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchWishlist(userId);
      }
      return data;
    } catch (e) {
      console.warn("toggleWishlist failed.", e);
      return { success: false, error: String(e) };
    }
  },

  detectLocation: async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.country_code && CURRENCY_MAP[data.country_code]) {
        set({
          countryCode: data.country_code,
          currency: CURRENCY_MAP[data.country_code]
        });
        console.log(`[Store] Geo-Detected Country: ${data.country_code}, Currency: ${CURRENCY_MAP[data.country_code].code}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.log("[Store] Geo-Detection Sync Failure. Defaulting to India Node (INR).");
    }
  },

  formatPrice: (amount: number) => {
    const { currency } = get();
    if (!currency) return `₹${(amount || 0).toLocaleString()}`;
    const converted = amount * currency.rate;
    // Format compact or clean depending on values
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  },

  setCurrency: (code: string) => {
    if (CURRENCY_MAP[code]) {
      set({ countryCode: code, currency: CURRENCY_MAP[code] });
    }
  },

  fetchFeedItems: async (category = "", tab = "For You", reset = false) => {
    if (get().loadingFeedItems) return;

    if (reset || get().feedItems.length === 0) {
      // 💾 Hydrate from SQLite disk cache immediately
      try {
        const cachedItems = getLocalFeedItems(category, tab);
        if (cachedItems && cachedItems.length > 0) {
          set({ feedItems: cachedItems });
        }
      } catch (err) {
        console.warn("SQLite FeedItems cache load failed:", err);
      }
    }

    set({ loadingFeedItems: true });
    try {
      const user = get().currentUser;
      const userId = user?.id || "";
      const profileId = get().activeProfile?.id || "";
      const profileQuery = profileId ? `&profileId=${encodeURIComponent(profileId)}` : "";
      const url = `${API_BASE}/feed?userId=${userId}${profileQuery}&category=${encodeURIComponent(category)}&tab=${tab}&limit=15`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.feedItems) {
        set({
          feedItems: data.feedItems,
          reelsSponsoredAd: data.reelsSponsoredAd || null,
        });
        // 💾 Persist to SQLite disk cache
        try {
          cacheFeedItems(data.feedItems, category, tab);
        } catch (err) {
          console.warn("Failed to cache feed items in SQLite:", err);
        }
      }
    } catch (e) {
      console.warn("Could not query visual feedItems. Using database fallback", e);
    } finally {
      set({ loadingFeedItems: false });
    }
  },

  fetchSearchResults: async (query: string) => {
    if (get().loadingFeedItems) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      set({ activeSearchQuery: "", searchTiles: [] });
      await get().fetchFeedItems("", "For You", true);
      return;
    }

    set({ loadingFeedItems: true });
    try {
      const user = get().currentUser;
      const userId = user?.id || "";
      const url = `${API_BASE}/search?q=${encodeURIComponent(trimmed)}&userId=${userId}&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.results) {
        set({
          feedItems: data.results,
          searchTiles: data.tiles || [],
          activeSearchQuery: trimmed,
          reelsSponsoredAd: null,
        });
      }
    } catch (e) {
      console.warn("Search failed, falling back to feed filter.", e);
      set({ searchTiles: [], activeSearchQuery: trimmed });
      await get().fetchFeedItems(trimmed, "For You", true);
    } finally {
      set({ loadingFeedItems: false });
    }
  },

  logEngagement: async (feedItemId, type) => {
    const user = get().currentUser;
    const profileId = get().activeProfile?.id;
    if (!user) return null;
    try {
      const res = await fetch(`${API_BASE}/feed/engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: user.id, profileId, postId: feedItemId, type }),
      });
      if (!res.ok) throw new Error("Server returned error status");
      const data = await res.json();
      if (data.success) {
        return { likeCount: data.likeCount, liked: data.liked };
      }
      return null;
    } catch (e) {
      console.warn("logEngagement failed, queuing action offline:", e);
      addPendingAction("logEngagement", {
        userId: user.id,
        profileId,
        postId: feedItemId,
        type,
      });
      return null;
    }
  },

  toggleFeedSave: async (feedItemId) => {
    const user = get().currentUser;
    const profileId = get().activeProfile?.id;
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/feed/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: user.id, profileId, postId: feedItemId }),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("medium");
      }
    } catch (e) {
      console.warn("toggleFeedSave failed", e);
    }
  },

  logFeedShare: async (feedItemId) => {
    const user = get().currentUser;
    const userId = user?.id || "";
    try {
      const res = await fetch(`${API_BASE}/feed/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId, postId: feedItemId }),
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("light");
        return {
          shareUrl: data.shareUrl as string,
          shareCount: typeof data.shareCount === "number" ? data.shareCount : undefined,
        };
      }
    } catch (e) {
      console.warn("logFeedShare failed", e);
    }
    return null;
  },

  logFeedCartAdd: async (feedItemId, productId) => {
    const user = get().currentUser;
    const profileId = get().activeProfile?.id;
    if (!user) return;
    try {
      await fetch(`${API_BASE}/feed/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          profileId,
          productId,
          postId: feedItemId,
        }),
      });
      get().triggerHaptic("success");
    } catch (e) {
      console.warn("logFeedCartAdd failed", e);
    }
  },

  flushPendingActions: async () => {
    const actions = getPendingActions();
    if (actions.length === 0) return;
    
    console.log(`Processing ${actions.length} offline pending actions...`);
    
    for (const action of actions) {
      try {
        if (action.actionType === "logEngagement") {
          const res = await fetch(`${API_BASE}/feed/engagement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.payload),
          });
          if (res.ok) {
            deletePendingAction(action.id);
          } else {
            throw new Error(`Server returned non-ok status: ${res.status}`);
          }
        } else if (action.actionType === "sendMessage") {
          const res = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.payload),
          });
          if (res.ok) {
            deletePendingAction(action.id);
          } else {
            throw new Error(`Server returned non-ok status for chat: ${res.status}`);
          }
        }
      } catch (err) {
        console.warn(`Retry failed for action ${action.id}:`, err);
        break; // Stop flushing if connection is still offline
      }
    }
  },

  syncDeltaPointer: async () => {
    try {
      const pointerKey = "global_delta_pointer";
      const currentPointer = getSyncPointer(pointerKey);
      
      const res = await fetch(`${API_BASE}/sync/deltas?since=${currentPointer}`);
      const data = await res.json();
      
      if (data.success && data.deltas && data.deltas.length > 0) {
        console.log(`[SyncEngine] Received ${data.deltas.length} delta updates from server pointer ${currentPointer}`);
        
        let maxPointer = currentPointer;
        for (const delta of data.deltas) {
          const payload = typeof delta.payload === "string" ? JSON.parse(delta.payload) : delta.payload;
          
          if (delta.type === "POST_CREATED") {
            cacheFeedItems([payload]);
          } else if (delta.type === "LIKE_TOGGLED") {
            // Local state updates for likes
          } else if (delta.type === "MESSAGE_SENT") {
            cacheConversations([payload]);
          }
          
          maxPointer = Math.max(maxPointer, delta.id);
        }
        
        setSyncPointer(pointerKey, maxPointer);
        
        // Refresh local cache representations in Zustand state
        await get().fetchFeedItems("", "For You", true);
        await get().fetchProducts();
      }
    } catch (err) {
      console.warn("[SyncEngine] Pointer catch-up sync connection failed:", err);
    }
  }
}));

registerAuthTokenGetter(() => useStore.getState().authToken);
registerAuthLogoutHandler(() => {
  const state = useStore.getState();
  if (state.authToken) {
    state.authLogOut();
  }
});

registerAuthSuspensionHandler(() => {
  useStore.getState().setAccountSuspended(true);
});
