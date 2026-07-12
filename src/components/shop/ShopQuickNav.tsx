import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

export type ShopQuickTabKey = "home" | "order-again" | "categories" | "cart";

type TabDef = {
  key: ShopQuickTabKey;
  label: string;
  icon: string;
  activeIcon?: string;
  route?: string;
};

type Props = {
  activeTab?: ShopQuickTabKey;
  onExplorePress?: () => void;
};

const DOCK_HEIGHT = 58;

export function getShopQuickNavHeight(insetsBottom: number) {
  return DOCK_HEIGHT + insetsBottom + 12;
}

export function ShopQuickNav({ activeTab = "home", onExplorePress }: Props) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { triggerHaptic, cart } = useStore();
  const cartCount = cart.reduce((n, i) => n + (i.quantity || 1), 0);

  const tabs: TabDef[] = [
    {
      key: "home",
      label: "Home",
      icon: "home-outline",
      activeIcon: "home",
      route: "/shop/all-products",
    },
    {
      key: "order-again",
      label: "Order Again",
      icon: "bag-handle-outline",
      activeIcon: "bag-handle",
    },
    {
      key: "categories",
      label: "Categories",
      icon: "grid-outline",
      activeIcon: "grid",
      route: "/shop",
    },
    {
      key: "cart",
      label: "Cart",
      icon: "cart-outline",
      activeIcon: "cart",
      route: "/cart",
    },
  ];

  const go = (tab: TabDef) => {
    triggerHaptic("light");
    if (tab.key === "order-again") {
      router.replace({
        pathname: "/shop/all-products",
        params: { mode: "order-again" },
      } as any);
      return;
    }
    if (tab.key === "home") {
      router.replace({ pathname: "/shop/all-products", params: {} } as any);
      return;
    }
    if (tab.route && !pathname.startsWith(tab.route)) {
      router.push(tab.route as any);
    }
  };

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 8 }]} pointerEvents="box-none">
      <View style={styles.dock}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => go(tab)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>
                <Lucide
                  name={(active ? tab.activeIcon || tab.icon : tab.icon) as any}
                  size={22}
                  color={active ? "#F9A825" : "#424242"}
                />
                {tab.key === "cart" && cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.exploreFab}
        onPress={() => {
          triggerHaptic("medium");
          onExplorePress?.();
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.exploreText}>AURA</Text>
        <Lucide name="compass-outline" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    zIndex: 9999,
    ...Platform.select({ android: { elevation: 24 } }),
  },
  dock: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  iconPill: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPillActive: { backgroundColor: "#F5F5F5" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  label: { fontSize: 10, fontWeight: "600", color: "#757575" },
  labelActive: { color: "#212121", fontWeight: "700" },
  exploreFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#5E35B1",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    elevation: 10,
  },
  exploreText: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
});
