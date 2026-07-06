import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SHOP } from "@/theme/shopTheme";
import { useStore } from "@/store/useStore";

type Props = {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  placeholder?: string;
};

export function ShopHeader({
  title,
  showBack = false,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search for products",
}: Props) {
  const { cart, triggerHaptic } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <View style={styles.wrap}>
      {title && !showSearch ? (
        <View style={styles.titleRow}>
          {showBack && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic("light");
                router.back();
              }}
              style={styles.backBtn}
            >
              <Lucide name="arrow-back" size={22} color={SHOP.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => {
              triggerHaptic("light");
              router.push("/cart");
            }}
          >
            <Lucide name="cart-outline" size={24} color={SHOP.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.searchRow}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic("light");
                router.back();
              }}
              style={styles.backBtn}
            >
              <Lucide name="arrow-back" size={22} color={SHOP.text} />
            </TouchableOpacity>
          ) : null}
          {showSearch ? (
            <View style={styles.searchBox}>
              <Lucide name="search" size={18} color={SHOP.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={SHOP.textMuted}
                value={searchValue}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearchSubmit}
                returnKeyType="search"
              />
            </View>
          ) : (
            <Text style={[styles.title, { flex: 1 }]}>{title}</Text>
          )}
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => {
              triggerHaptic("light");
              router.push("/cart");
            }}
          >
            <Lucide name="cart-outline" size={24} color={SHOP.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SHOP.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: SHOP.text,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SHOP.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: SHOP.text,
    paddingVertical: 0,
  },
  cartBtn: {
    padding: 4,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: SHOP.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
