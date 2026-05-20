import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const API_BASE = "http://localhost:3000/api/mobile";

interface StoreState {
  products: any[];
  stories: any[];
  cart: any[];
  loadingProducts: boolean;
  loadingFeed: boolean;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchFeed: () => Promise<void>;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  triggerHaptic: (type?: "light" | "medium" | "heavy" | "success") => void;
}

export const useStore = create<StoreState>((set, get) => ({
  products: [],
  stories: [],
  cart: [],
  loadingProducts: false,
  loadingFeed: false,

  fetchProducts: async () => {
    set({ loadingProducts: true });
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      if (data.success) {
        set({ products: data.products });
      }
    } catch (e) {
      console.warn("Could not query products from local host. Using simulated models fallback.", e);
    } finally {
      set({ loadingProducts: false });
    }
  },

  fetchFeed: async () => {
    set({ loadingFeed: true });
    try {
      const res = await fetch(`${API_BASE}/feed`);
      const data = await res.json();
      if (data.success) {
        set({ stories: data.stories });
      }
    } catch (e) {
      console.warn("Could not query visual feed from local host. Using simulated stories fallback.", e);
    } finally {
      set({ loadingFeed: false });
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
  }
}));
