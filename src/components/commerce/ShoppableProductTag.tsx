import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import type { TaggedProduct } from "@/lib/createDraft";

type Props = {
  products: TaggedProduct[];
  scale?: number;
  onPress?: () => void;
  showCommission?: boolean;
};

export function ShoppableProductTag({
  products,
  scale = 1,
  onPress,
  showCommission = false,
}: Props) {
  if (!products.length) return null;

  const lead = products[0];
  const count = products.length;
  const label = count === 1 ? "1 product" : `${count} products`;
  const w = 92 * scale;
  const thumbH = 112 * scale;

  const body = (
    <View style={[styles.wrap, { width: w }]}>
      <View style={[styles.thumbWrap, { height: thumbH, borderRadius: 10 * scale }]}>
        {lead.image ? (
          <Image source={{ uri: lead.image }} style={styles.thumbImg} contentFit="cover" />
        ) : (
          <View style={[styles.thumbImg, styles.thumbFallback]}>
            <Lucide name="bag-outline" size={22 * scale} color="#666" />
          </View>
        )}
        <View style={[styles.expandBadge, { borderRadius: 6 * scale }]}>
          <Lucide name="expand-outline" size={12 * scale} color="#fff" />
        </View>
      </View>
      <View style={[styles.pill, { borderRadius: 999, paddingVertical: 7 * scale, paddingHorizontal: 10 * scale }]}>
        <Text style={[styles.pillText, { fontSize: 13 * scale }]} numberOfLines={1}>
          {label}
        </Text>
        <Lucide name="chevron-down" size={14 * scale} color="#111" />
      </View>
      {showCommission ? (
        <Text style={[styles.commission, { fontSize: 11 * scale }]}>Earns commission</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  thumbWrap: {
    overflow: "hidden",
    backgroundColor: "#eee",
    borderWidth: 2,
    borderColor: "#fff",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#ddd" },
  expandBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 4,
  },
  pill: {
    marginTop: -2,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  pillText: {
    color: "#111",
    fontWeight: "800",
    maxWidth: 120,
  },
  commission: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    fontWeight: "500",
  },
});
