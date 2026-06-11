import { create } from "zustand";
import * as Haptics from "expo-haptics";
import { API_BASE } from "@/constants/api";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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

async function syncDevicePushToken(userId: string) {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await fetch(`${API_BASE}/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token })
      });
    }
  } catch (error) {
    console.warn("Could not sync push token to backend registry:", error);
  }
}


interface StoreState {
  products: any[];
  stories: any[];
  cart: any[];
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
  createProduct: (data: any) => Promise<boolean>;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  initiateCheckout: (payload: { userId: string; cartItems: any[]; shippingAddress?: string; couponCode?: string }) => Promise<any>;
  verifyPayment: (payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature?: string }) => Promise<any>;
  applyCoupon: (payload: { code: string; maisonId?: string }) => Promise<any>;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "success") => void;

  // New Programmatic Campaigns Actions
  fetchAdBids: (maisonId: string, model?: string) => Promise<void>;
  createAdBid: (payload: any) => Promise<boolean>;
  fundAdWallet: (maisonId: string, amount: number) => Promise<boolean>;
  generateAiCreative: (artifactId: string, maisonId: string) => Promise<boolean>;
  fetchBrandDeals: (filters?: { creatorId?: string; maisonId?: string }) => Promise<void>;
  fetchInfluencers: () => Promise<void>;
  proposeBrandDeal: (payload: { creatorId: string; maisonId: string; budget: number; type: string; terms: string }) => Promise<boolean>;
  respondToBrandDeal: (dealId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") => Promise<boolean>;

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
  authSignUp: (payload: any) => Promise<{ success: boolean; error?: string }>;
  authLogIn: (payload: any) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (payload: any) => Promise<{ success: boolean; error?: string }>;
  authOnboard: (payload: any) => Promise<{ success: boolean; error?: string; user?: any; profile?: any }>;
  authLogOut: () => void;

  activeProfile: any | null;
  userProfiles: any[];
  fetchProfiles: (userId: string) => Promise<void>;
  createNewProfile: (payload: any) => Promise<{ success: boolean; error?: string }>;
  switchActiveProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  instaStories: any[];
  addInstaStorySlide: (slide: any) => void;

  notifications: any[];
  loadingNotifications: boolean;
  fetchNotifications: (profileId: string) => Promise<void>;
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
}

const MOCK_PRODUCTS = [
  {
    id: "p1",
    title: "Obsidian Gold Vestment",
    price: 185000,
    vibe: "Quiet Luxury",
    images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Fashion"
  },
  {
    id: "p2",
    title: "Atelier Silk Trench Jacket",
    price: 245000,
    vibe: "Avant-Garde",
    images: ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.8,
    rating: 4.8,
    type: "Fashion"
  },
  {
    id: "p3",
    title: "Cyber Penthouse Cuff",
    price: 95000,
    vibe: "Brutalist",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.7,
    rating: 4.7,
    type: "Jewelry"
  },
  {
    id: "p4",
    title: "Heritage Calfskin Carryall",
    price: 320000,
    vibe: "Quiet Luxury",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"],
    maison: { name: "Rare Raven", id: "rare_raven" },
    auraScore: 9.9,
    rating: 4.9,
    type: "Bags"
  }
];

export const useStore = create<StoreState>((set, get) => ({
  products: MOCK_PRODUCTS,
  stories: [],
  cart: [],
  warehouses: [],
  orders: [],
  wishlist: [],
  
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
  
  activeMaisonId: "aloksingh",
  setActiveMaisonId: (id) => set({ activeMaisonId: id }),

  instaStories: [
    { 
      id: "ys", 
      username: "Your story", 
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150", 
      isYourStory: true,
      slides: [
        { id: "ys_1", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400", caption: "Securing next-gen luxury blueprints..." }
      ]
    },
    { 
      id: "g1", 
      username: "garimahuja05", 
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150", 
      active: true,
      slides: [
        { id: "g1_1", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400", caption: "Atelier Paris Spring Showcase" },
        { id: "g1_2", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400", caption: "Bespoke fabrics, pure sovereign details" }
      ]
    },
    { 
      id: "m1", 
      username: "mahima.unfilter...", 
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150", 
      active: true,
      slides: [
        { id: "m1_1", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400", caption: "Milan high-fidelity runways." }
      ]
    },
    { 
      id: "i1", 
      username: "_._issue", 
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150", 
      active: true,
      slides: [
        { id: "i1_1", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400", caption: "Atelier Street coordinates" }
      ]
    }
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
    if (get().products.length === MOCK_PRODUCTS.length) {
      set({ loadingProducts: true });
    }
    try {
      const user = get().currentUser;
      const url = user ? `${API_BASE}/products?userId=${user.id}` : `${API_BASE}/products`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (JSON.stringify(data.products) !== JSON.stringify(get().products)) {
          set({ products: data.products });
        }
      }
    } catch (e) {
      console.warn("Could not query products from local host. Using simulated models fallback.", e);
      // Fallback to mock products on fetch failure
      if (get().products.length === 0) {
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
        
        set((state) => {
          const merged = reset ? loadedStories : [...state.stories, ...loadedStories];
          // deduplicate just in case
          const unique = merged.filter((item: any, idx: number, self: any[]) => 
            self.findIndex((t) => t.id === item.id) === idx
          );
          return {
            stories: unique,
            feedCursor: nextCursor || null,
            hasMoreFeed: !!nextCursor
          };
        });
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
      const res = await fetch(url);
      const data = await res.json();
      if (JSON.stringify(data) !== JSON.stringify(get().orders)) {
        set({ orders: data });
      }
    } catch (e) {
      console.warn("Could not query orders ledger from local host. Using simulated logs.", e);
    } finally {
      set({ loadingOrders: false });
    }
  },

  createProduct: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/products/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchProducts();
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not create dynamic catalog product on local host.", e);
      return false;
    }
  },

  addToCart: (product) => {
    get().triggerHaptic("medium");
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    });
  },

  removeFromCart: (productId) => {
    get().triggerHaptic("light");
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId)
    }));
  },

  clearCart: () => {
    set({ cart: [] });
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
      const res = await fetch(`${API_BASE}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        get().fetchAdBids(payload.maisonId);
        return true;
      }
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
      const query = new URLSearchParams();
      if (filters.creatorId) query.append("creatorId", filters.creatorId);
      if (filters.maisonId) query.append("maisonId", filters.maisonId);
      
      const res = await fetch(`${API_BASE}/brand-deals?${query.toString()}`);
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
      const res = await fetch(`${API_BASE}/profile?type=INFLUENCER`);
      const data = await res.json();
      if (data.success && data.profiles) {
        set({ influencers: data.profiles });
      } else {
        // Fallback influencers list
        set({ influencers: [
          { id: "c1", userId: "user_influencer_1", name: "studywithjasmeet", username: "studywithjasmeet", category: "Creator / Stylist" },
          { id: "c2", userId: "user_influencer_2", name: "fitwithyashika_", username: "fitwithyashika_", category: "Influencer / Fitness" }
        ]});
      }
    } catch (e) {
      console.warn("Could not fetch influencers list.", e);
      // Fallback
      set({ influencers: [
        { id: "c1", userId: "user_influencer_1", name: "studywithjasmeet", username: "studywithjasmeet", category: "Creator / Stylist" },
        { id: "c2", userId: "user_influencer_2", name: "fitwithyashika_", username: "fitwithyashika_", category: "Influencer / Fitness" }
      ]});
    }
  },

  proposeBrandDeal: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/brand-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
      const res = await fetch(`${API_BASE}/brand-deals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, status })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        const userId = get().currentUser?.id;
        const maisonId = get().activeMaisonId;
        get().fetchBrandDeals({ creatorId: userId, maisonId });
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
      const res = await fetch(url);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
  userProfiles: [],
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
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
        set({ currentUser: data.user, activeMaisonId: data.user.maisonId });
        await get().fetchProfiles(data.user.id);
        return { success: true };
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
      if (data.success) {
        get().triggerHaptic("success");
        set({ currentUser: data.user, activeMaisonId: data.user.maisonId });
        await get().fetchProfiles(data.user.id);
        return { success: true };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Login fetch failed:", e);
      return { success: false, error: e.message || "Failed to connect to AURA database node." };
    }
  },

  updateProfile: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${API_BASE}/auth/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({ currentUser: data.user, activeMaisonId: data.user.maisonId });
        return { success: true, user: data.user, profile: data.profile };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Onboarding fetch failed:", e);
      return { success: false, error: e.message || "Failed to reach onboarding database gateway." };
    }
  },

  fetchProfiles: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/profile/list?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        set({ userProfiles: data.profiles, activeProfile: data.activeProfile });
        // Sync push token automatically
        syncDevicePushToken(userId);
      }
    } catch (e) {
      console.warn("Could not fetch sovereign profiles:", e);
    }
  },

  createNewProfile: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/profile/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        const newMaisonId = data.activeProfile.maisonId || data.activeProfile.username;
        set(state => ({
          userProfiles: data.profiles,
          activeProfile: data.activeProfile,
          activeMaisonId: newMaisonId || state.activeMaisonId,
          currentUser: state.currentUser ? {
            ...state.currentUser,
            activeProfileId: data.activeProfile.id,
            maisonId: data.activeProfile.type === "BUSINESS" ? newMaisonId : state.currentUser.maisonId,
            isBusinessAccount: data.activeProfile.type === "BUSINESS"
          } : null
        }));
        // Force refresh feed & catalog matching the new profile's vertical
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, profileId })
      });
      const data = await res.json();
      if (data.success) {
        get().triggerHaptic("success");
        set({ 
          userProfiles: data.profiles, 
          activeProfile: data.activeProfile,
          currentUser: data.user,
          activeMaisonId: data.user.maisonId || "aloksingh"
        });
        
        // Force dynamic algorithmic feed and product reload matching the switched profile category
        get().fetchProducts();
        get().fetchFeed();
        
        return { success: true };
      }
      return { success: false, error: data.message || data.error };
    } catch (e: any) {
      console.warn("Profile switch request failed:", e);
      return { success: false, error: e.message || "Failed to contact database gateway." };
    }
  },

  addInstaStorySlide: (slide) => {
    set(state => {
      const updated = state.instaStories.map(story => {
        if (story.isYourStory) {
          return {
            ...story,
            slides: [slide, ...(story.slides || [])]
          };
        }
        return story;
      });
      return { instaStories: updated };
    });
  },

  fetchNotifications: async (profileId) => {
    set({ loadingNotifications: true });
    try {
      const res = await fetch(`${API_BASE}/notifications?profileId=${profileId}`);
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
    set({ currentUser: null, activeProfile: null, userProfiles: [], activeMaisonId: "aloksingh", notifications: [], viewingProfile: null, viewingProducts: [], viewingHighlights: [] });
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
      const res = await fetch(`${API_BASE}/checkout/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
      const res = await fetch(`${API_BASE}/checkout/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data.country_code && CURRENCY_MAP[data.country_code]) {
        set({
          countryCode: data.country_code,
          currency: CURRENCY_MAP[data.country_code]
        });
        console.log(`[Store] Geo-Detected Country: ${data.country_code}, Currency: ${CURRENCY_MAP[data.country_code].code}`);
      }
    } catch (error) {
      console.warn("[Store] Geo-Detection Sync Failure. Defaulting to India Node (INR).");
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
  }
}));
