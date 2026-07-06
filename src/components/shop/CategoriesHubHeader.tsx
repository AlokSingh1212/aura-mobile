import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useStore } from "@/store/useStore";
import { CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";

type Props = {
  onSearchPress?: () => void;
};

export function CategoriesHubHeader({ onSearchPress }: Props) {
  const { cart, triggerHaptic } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>All Categories</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerHaptic("light");
            if (onSearchPress) onSearchPress();
            else router.push("/shop/category/for-you" as any);
          }}
        >
          <Lucide name="search-outline" size={CATEGORIES_LAYOUT.iconSize} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/shop/orders" as any);
          }}
        >
          <Lucide name="receipt-outline" size={CATEGORIES_LAYOUT.iconSize} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/cart");
          }}
        >
          <Lucide name="cart-outline" size={CATEGORIES_LAYOUT.iconSize} color="#000" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: CATEGORIES_LAYOUT.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CATEGORIES_LAYOUT.headerPaddingH,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: CATEGORIES_LAYOUT.titleSize,
    fontWeight: "700",
    color: "#000000",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: CATEGORIES_LAYOUT.iconGap,
  },
  iconBtn: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#FF6161",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
