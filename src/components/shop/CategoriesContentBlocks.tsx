import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { POPULAR_STORES } from "@/constants/shopCategories";
import {
  CATEGORIES_LAYOUT,
  getContentWidth,
  getTripleCardSize,
} from "@/constants/categoriesLayout";
import { useStore } from "@/store/useStore";
import {
  VerifiedMaisonBadge,
  isProductFromVerifiedMaison,
} from "@/components/shop/VerifiedMaisonBadge";

type Props = {
  cardSize?: number;
};

export function PopularStoresRow({ cardSize: cardSizeProp }: Props) {
  const { width: screenW } = useWindowDimensions();
  const { triggerHaptic } = useStore();
  const innerW =
    getContentWidth(screenW) - CATEGORIES_LAYOUT.contentPadding * 2;
  const cardSize = cardSizeProp ?? getTripleCardSize(innerW);

  const openStore = (id: string) => {
    triggerHaptic("light");
    if (id === "aura-drop") {
      router.push({ pathname: "/", params: { activeTab: "reels", openCamera: "true" } } as any);
    } else if (id === "aura-minutes") {
      router.push("/settings/shop" as any);
    } else if (id === "style-fest") {
      router.push("/shop/category/fashion" as any);
    }
  };

  return (
    <View style={[styles.row, { gap: CATEGORIES_LAYOUT.cardGap }]}>
      {POPULAR_STORES.slice(0, 3).map((store) => (
        <TouchableOpacity
          key={store.id}
          activeOpacity={0.97}
          style={{ width: cardSize, alignItems: "center" }}
          onPress={() => openStore(store.id)}
        >
          <LinearGradient
            colors={[store.colors[0], store.colors[1]]}
            style={[
              styles.card,
              {
                width: cardSize,
                height: cardSize,
                borderRadius: CATEGORIES_LAYOUT.storeCardRadius,
              },
            ]}
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
  );
}

type ProductGridProps = {
  products: any[];
  cardSize?: number;
  onViewAll?: () => void;
};

function ctaForIndex(index: number): string {
  if (index % 3 === 0) return "SHOP NOW";
  if (index % 3 === 1) return "NOTIFY ME";
  return "BUY NOW";
}

export function ProductLaunchGrid({ products, cardSize: cardSizeProp, onViewAll }: ProductGridProps) {
  const { triggerHaptic } = useStore();
  const { width: screenW } = useWindowDimensions();
  const innerW =
    getContentWidth(screenW) - CATEGORIES_LAYOUT.contentPadding * 2;
  const cardSize = cardSizeProp ?? getTripleCardSize(innerW);
  const items = products.slice(0, 8);

  const slots: (
    | { kind: "product"; product: any; index: number }
    | { kind: "viewAll" }
  )[] = items.map((product, index) => ({ kind: "product", product, index }));
  slots.push({ kind: "viewAll" });

  const rows: typeof slots[] = [];
  for (let i = 0; i < slots.length; i += 3) {
    rows.push(slots.slice(i, i + 3));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View
          key={`r-${ri}`}
          style={[styles.row, { gap: CATEGORIES_LAYOUT.cardGap, marginBottom: CATEGORIES_LAYOUT.cardGap }]}
        >
          {row.map((slot) => {
            if (slot.kind === "viewAll") {
              return (
                <TouchableOpacity
                  key="view-all"
                  style={{ width: cardSize, alignItems: "center" }}
                  onPress={onViewAll}
                  activeOpacity={0.97}
                >
                  <View
                    style={[
                      styles.viewAllCircle,
                      {
                        width: CATEGORIES_LAYOUT.viewAllCircle,
                        height: CATEGORIES_LAYOUT.viewAllCircle,
                        borderRadius: CATEGORIES_LAYOUT.viewAllCircle / 2,
                      },
                    ]}
                  >
                    <Lucide name="chevron-down" size={24} color="#2874F0" />
                  </View>
                  <Text style={styles.viewAllLabel}>View All</Text>
                </TouchableOpacity>
              );
            }
            const { product, index } = slot;
            const image = product.images?.[0];
            const cta = ctaForIndex(index);
            const verifiedMaison = isProductFromVerifiedMaison(product);
            return (
              <TouchableOpacity
                key={product.id}
                style={{ width: cardSize, alignItems: "center" }}
                activeOpacity={0.97}
                onPress={() => {
                  triggerHaptic("medium");
                  router.push(`/product/${product.id}` as any);
                }}
              >
                <View
                  style={[
                    styles.productImageWrap,
                    {
                      width: cardSize,
                      height: cardSize,
                      borderRadius: CATEGORIES_LAYOUT.productImageRadius,
                    },
                  ]}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{
                        width: cardSize,
                        height: cardSize,
                        borderRadius: CATEGORIES_LAYOUT.productImageRadius,
                      }}
                    />
                  ) : (
                    <View style={styles.placeholder}>
                      <Lucide name="image-outline" size={28} color="#B0B0B0" />
                    </View>
                  )}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cta}</Text>
                  </View>
                </View>
                <View style={styles.productNameRow}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.title}
                  </Text>
                  {verifiedMaison ? <VerifiedMaisonBadge size={12} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`pad-${i}`} style={{ width: cardSize }} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  card: {
    padding: 16,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: CATEGORIES_LAYOUT.storeCardBg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  cardSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  grid: {},
  productImageWrap: {
    backgroundColor: CATEGORIES_LAYOUT.storeCardBg,
    overflow: "hidden",
    position: "relative",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    height: CATEGORIES_LAYOUT.badgeHeight,
    borderRadius: CATEGORIES_LAYOUT.badgeRadius,
    backgroundColor: CATEGORIES_LAYOUT.badgeColor,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: CATEGORIES_LAYOUT.badgeTextSize,
    fontWeight: "700",
  },
  productNameRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 2,
  },
  productName: {
    flex: 1,
    fontSize: CATEGORIES_LAYOUT.productNameSize,
    fontWeight: "500",
    color: "#212121",
    textAlign: "center",
    lineHeight: 20,
  },
  viewAllCircle: {
    backgroundColor: CATEGORIES_LAYOUT.viewAllBg,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllLabel: {
    marginTop: 8,
    fontSize: CATEGORIES_LAYOUT.productNameSize,
    fontWeight: "500",
    color: "#2874F0",
    textAlign: "center",
  },
});
