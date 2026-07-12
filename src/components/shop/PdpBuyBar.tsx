import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import { formatINR, getEmiPerMonth } from "@/lib/shopPricing";
import { useStore } from "@/store/useStore";

type Props = {
  price: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onEmi?: () => void;
  disabled?: boolean;
};

export function PdpBuyBar({ price, onAddToCart, onBuyNow, onEmi, disabled }: Props) {
  const insets = useSafeAreaInsets();
  const { formatPrice } = useStore();
  const emi = getEmiPerMonth(price);
  const display = formatPrice ? formatPrice(price) : formatINR(price);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TouchableOpacity
        style={[styles.cartBtn, disabled && styles.btnDisabled]}
        onPress={onAddToCart}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Lucide name="cart-outline" size={22} color={SHOP.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.emiBtn, (disabled || !onEmi) && styles.btnDisabled]}
        onPress={onEmi}
        activeOpacity={0.8}
        disabled={disabled || !onEmi}
      >
        <Text style={styles.emiTitle}>EMI</Text>
        <Text style={styles.emiSub} numberOfLines={1}>
          from {formatPrice ? formatPrice(emi) : formatINR(emi)}/mo
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.buyBtn, disabled && styles.buyBtnDisabled]}
        onPress={onBuyNow}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text style={styles.buyText} numberOfLines={1}>
          {disabled ? "Out of stock" : `Buy · ${display}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SHOP.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SHOP.bottomBarBorder,
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 8,
    zIndex: 50,
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SHOP.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emiBtn: {
    flex: 0.85,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: SHOP.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  emiTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: SHOP.text,
  },
  emiSub: {
    fontSize: 10,
    color: SHOP.textSecondary,
    marginTop: 1,
  },
  buyBtn: {
    flex: 1.35,
    height: 48,
    borderRadius: 8,
    backgroundColor: SHOP.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  buyText: {
    fontSize: 13,
    fontWeight: "800",
    color: SHOP.accentText,
  },
  btnDisabled: { opacity: 0.45 },
  buyBtnDisabled: { backgroundColor: "#BDBDBD" },
});
