import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { router, usePathname } from "expo-router";
import { useStore } from "@/store/useStore";
import Lucide from "@expo/vector-icons/Ionicons";

export default function MainHeader() {
  const { cart, triggerHaptic } = useStore();
  const pathname = usePathname();

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleNav = (route: string) => {
    triggerHaptic("light");
    router.push(route as any);
  };

  const isHome = pathname === "/";
  const isExplore = pathname === "/explore";
  const isCart = pathname === "/cart";
  const isVault = pathname === "/dashboard";
  const isAccount = pathname === "/account";

  return (
    <View style={styles.headerContainer}>
      {/* Brand logo link */}
      <TouchableOpacity 
        style={styles.logoBtn} 
        onPress={() => handleNav("/")}
        activeOpacity={0.7}
      >
        <Text style={styles.logoText}>AURAGRAM</Text>
      </TouchableOpacity>

      {/* Right side actions exact copy of web nav actions */}
      <View style={styles.actionsRow}>
        {/* Stories/Loops link */}
        <TouchableOpacity 
          style={[styles.actionBtn, isExplore && styles.actionBtnActive]} 
          onPress={() => handleNav("/explore")}
          activeOpacity={0.7}
        >
          <Lucide 
            name="trending-up" 
            size={21} 
            color={isExplore ? "#00f5ff" : "rgba(255,255,255,0.6)"} 
          />
        </TouchableOpacity>

        {/* Cart Link with Badge counter */}
        <TouchableOpacity 
          style={[styles.actionBtn, isCart && styles.actionBtnActive]} 
          onPress={() => handleNav("/cart")}
          activeOpacity={0.7}
        >
          <View style={styles.cartBtnWrapper}>
            <Lucide 
              name="bag-handle" 
              size={21} 
              color={isCart ? "#00f5ff" : "rgba(255,255,255,0.6)"} 
            />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Vault Dashboard Link */}
        <TouchableOpacity 
          style={[styles.actionBtn, isVault && styles.actionBtnActive]} 
          onPress={() => handleNav("/dashboard")}
          activeOpacity={0.7}
        >
          <Lucide 
            name="cube" 
            size={21} 
            color={isVault ? "#00f5ff" : "rgba(255,255,255,0.6)"} 
          />
        </TouchableOpacity>

        {/* Identity Account Link */}
        <TouchableOpacity 
          style={[styles.actionBtn, isAccount && styles.actionBtnActive]} 
          onPress={() => handleNav("/account")}
          activeOpacity={0.7}
        >
          <Lucide 
            name="person" 
            size={21} 
            color={isAccount ? "#00f5ff" : "rgba(255,255,255,0.6)"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#080415",
  },
  logoBtn: {
    paddingVertical: 4,
  },
  logoText: {
    color: "#00f5ff",
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: -1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnActive: {
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(0,245,255,0.03)",
  },
  cartBtnWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#00f5ff",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#000",
    fontSize: 10.5,
    fontWeight: "bold",
  },
});
