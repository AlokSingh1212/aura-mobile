import { create } from "zustand";
import * as Haptics from "expo-haptics";

const API_BASE = "https://duhpj-106-219-122-49.run.pinggy-free.link/api/mobile";

interface StoreState {
  products: any[];
  stories: any[];
  cart: any[];
  warehouses: any[];
  orders: any[];
  
  // New State variables for parity expansion
  adBids: any[];
  adMetrics: any;
  repricerOffers: any[];
  pickTasks: any[];
  loyaltyPoints: number;
  loyaltyElite: boolean;
  loyaltyEliteUntil: string | null;
  rewardLogs: any[];
  
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
  fetchFeed: () => Promise<void>;
  fetchWarehouses: (maisonId?: string) => Promise<void>;
  fetchOrders: (maisonId?: string) => Promise<void>;
  createWarehouse: (data: any) => Promise<boolean>;
  createProduct: (data: any) => Promise<boolean>;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "success") => void;

  // New Programmatic Campaigns Actions
  fetchAdBids: (maisonId: string, model?: string) => Promise<void>;
  createAdBid: (payload: any) => Promise<boolean>;
  fundAdWallet: (maisonId: string, amount: number) => Promise<boolean>;

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
  
  // Advanced States
  adBids: [],
  adMetrics: null,
  repricerOffers: [],
  pickTasks: [],
  loyaltyPoints: 1240, // Simulated default points matching telemetry
  loyaltyElite: false,
  loyaltyEliteUntil: null,
  rewardLogs: [],
  
  activeMaisonId: "aloksingh",
  setActiveMaisonId: (id) => set({ activeMaisonId: id }),

  loadingProducts: false,
  loadingFeed: false,
  loadingWarehouses: false,
  loadingOrders: false,
  loadingAds: false,
  loadingRepricer: false,
  loadingWMS: false,
  loadingLoyalty: false,

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

  fetchFeed: async () => {
    if (get().stories.length === 0) {
      set({ loadingFeed: true });
    }
    try {
      const user = get().currentUser;
      const url = user ? `${API_BASE}/feed?userId=${user.id}` : `${API_BASE}/feed`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (JSON.stringify(data.stories) !== JSON.stringify(get().stories)) {
          set({ stories: data.stories });
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
        set({ userProfiles: data.profiles, activeProfile: data.activeProfile });
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

  authLogOut: () => {
    get().triggerHaptic("medium");
    set({ currentUser: null, activeProfile: null, userProfiles: [], activeMaisonId: "aloksingh" });
  }
}));
