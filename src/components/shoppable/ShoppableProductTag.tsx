import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { ProductSticker } from "@/lib/postEditState";

type Props = {
  products: ProductSticker[];
  scale?: number;
  onPress?: () => void;
  showEarnsCommission?: boolean;
};

export function ShoppableProductTag({
  products,
  scale = 1,
  onPress,
  showEarnsCommission = false,
}: Props) {
  if (!products.length) return null;

  const primary = products[0];
  const count = products.length;
  const label = count === 1 ? "1 product" : `${count} products`;

  const content = (
    <View style={[styles.wrap, { transform: [{ scale }] }]}>
      <View style={styles.thumbFrame}>
        {primary.image ? (
          <Image source={{ uri: primary.image }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Lucide name="bag-outline" size={22} color="#999" />
          </View>
        )}
        <View style={styles.expandBadge}>
          <Lucide name="expand-outline" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.countPill}>
        <Text style={styles.countText}>{label}</Text>
        <Lucide name="chevron-down" size={14} color="#111" />
      </View>
      {showEarnsCommission ? (
        <Text style={styles.commission}>Earns commission</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrap: {
    width: 108,
    alignItems: "stretch",
  },
  thumbFrame: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thumb: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#eee",
  },
  thumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  expandBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    marginTop: -1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  countText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "800",
  },
  commission: {
    marginTop: 6,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
