import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SHOP } from "@/theme/shopTheme";
import { getSidebarWidth, CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";
import { AURA_DISCOVERY_TILES } from "@/constants/brandCategories";

export function HaveYouTriedSection() {
  const { width: screenW } = useWindowDimensions();
  const sidebarW = getSidebarWidth(screenW);
  const tileSize = Math.floor((screenW - sidebarW - 16 - 24) / 3.5);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Have you tried?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {AURA_DISCOVERY_TILES.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[styles.tile, { width: tileSize, height: tileSize * 0.72 }]}
            activeOpacity={0.85}
          >
            <View style={[styles.logoCircle, { backgroundColor: b.bg }]}>
              <Text style={styles.logoText}>{b.short}</Text>
            </View>
            <Text style={styles.tileLabel} numberOfLines={1}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: SHOP.text,
    marginBottom: 8,
  },
  row: {
    gap: 10,
    paddingRight: 8,
  },
  tile: {
    backgroundColor: SHOP.bg,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: SHOP.text,
  },
});
