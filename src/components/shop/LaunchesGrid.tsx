import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import { useStore } from "@/store/useStore";
import { getSidebarWidth, getContentWidth, getTripleCardSize, CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";

const MAIN_PAD = 8;
const GAP = 6;
const COLS = 3;

type Props = {
  products: any[];
  onViewAll?: () => void;
};

function ctaForProduct(_product: any, index: number): string {
  if (index % 3 === 0) return "SHOP NOW";
  if (index % 3 === 1) return "NOTIFY ME";
  return "BUY NOW";
}

export function LaunchesGrid({ products, onViewAll }: Props) {
  const { triggerHaptic } = useStore();
  const { width: screenW } = useWindowDimensions();
  const sidebarW = getSidebarWidth(screenW);
  const contentW = screenW - sidebarW;
  const cardW = Math.floor((contentW - MAIN_PAD * 2 - GAP * (COLS - 1)) / COLS);

  // Pad to fill grid like Flipkart (min 8 product slots + view all)
  const items = products.slice(0, 8);

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>New & Upcoming Launches</Text>
        <Text style={styles.empty}>No launches in this category yet.</Text>
      </View>
    );
  }

  const slots: ({ type: "product"; product: any; index: number } | { type: "viewAll" })[] =
    items.map((product, index) => ({ type: "product", product, index }));
  slots.push({ type: "viewAll" });

  const rows: typeof slots[] = [];
  for (let i = 0; i < slots.length; i += COLS) {
    rows.push(slots.slice(i, i + COLS));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>New & Upcoming Launches</Text>
      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={[styles.row, { gap: GAP, marginBottom: GAP + 4 }]}>
          {row.map((slot, colIdx) => {
            if (slot.type === "viewAll") {
              return (
                <TouchableOpacity
                  key="view-all"
                  style={[styles.viewAll, { width: cardW }]}
                  onPress={onViewAll}
                  activeOpacity={0.7}
                >
                  <View style={styles.viewAllCircle}>
                    <Lucide name="chevron-down" size={20} color={SHOP.primary} />
                  </View>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              );
            }
            const { product, index } = slot;
            const image = product.images?.[0];
            const cta = ctaForProduct(product, index);
            return (
              <TouchableOpacity
                key={product.id}
                style={{ width: cardW }}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic("medium");
                  router.push(`/product/${product.id}` as any);
                }}
              >
                <View style={styles.imageWrap}>
                  {image ? (
                    <Image source={{ uri: image }} style={[styles.image, { width: cardW, height: cardW }]} />
                  ) : (
                    <View style={[styles.image, styles.placeholder, { width: cardW, height: cardW }]}>
                      <Lucide name="image-outline" size={20} color={SHOP.textMuted} />
                    </View>
                  )}
                  <View style={styles.ctaPill}>
                    <Text style={styles.ctaText}>{cta}</Text>
                  </View>
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {product.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Pad incomplete last row */}
          {row.length < COLS &&
            Array.from({ length: COLS - row.length }).map((_, i) => (
              <View key={`pad-${i}`} style={{ width: cardW }} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: MAIN_PAD,
    paddingTop: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: SHOP.text,
    marginBottom: 8,
  },
  empty: {
    fontSize: 13,
    color: SHOP.textSecondary,
  },
  row: {
    flexDirection: "row",
  },
  imageWrap: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    marginBottom: 4,
  },
  image: {
    backgroundColor: "#F5F5F5",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPill: {
    position: "absolute",
    bottom: 6,
    left: 4,
    right: 4,
    backgroundColor: "#1B7D5A",
    borderRadius: 3,
    paddingVertical: 4,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 10,
    fontWeight: "500",
    color: SHOP.text,
    lineHeight: 13,
    textAlign: "center",
  },
  viewAll: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  viewAllCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: SHOP.primary,
    backgroundColor: SHOP.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 10,
    fontWeight: "600",
    color: SHOP.primary,
  },
});
