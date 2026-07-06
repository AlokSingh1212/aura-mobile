import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { POPULAR_STORES } from "@/constants/shopCategories";
import { SHOP } from "@/theme/shopTheme";
import { getSidebarWidth, CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";

const MAIN_PAD = 8;
const GAP = 6;

export function PopularStoresRow() {
  const { width: screenW } = useWindowDimensions();
  const sidebarW = getSidebarWidth(screenW);
  const contentW = screenW - sidebarW - MAIN_PAD * 2;
  const cardSize = (contentW - GAP * 2) / 3;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Popular Store</Text>
      <View style={[styles.row, { gap: GAP }]}>
        {POPULAR_STORES.slice(0, 3).map((store) => (
          <TouchableOpacity
            key={store.id}
            activeOpacity={0.85}
            style={{ width: cardSize, height: cardSize }}
          >
            <LinearGradient
              colors={[store.colors[0], store.colors[1]]}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.cardTitle, { color: store.accent }]} numberOfLines={2}>
                {store.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={2}>
                {store.subtitle}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: MAIN_PAD,
    paddingTop: 8,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: SHOP.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  card: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  cardSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    fontWeight: "500",
    lineHeight: 12,
  },
});
