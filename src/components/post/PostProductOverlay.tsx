import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import type { ProductSticker } from "@/lib/postEditState";
import { openProduct } from "@/lib/postNavigation";

export function resolvePostProducts(
  item: any,
  catalogProducts: any[] = []
): ProductSticker[] {
  const fromMeta =
    item?.productStickers ||
    item?.content?.productStickers ||
    item?.metadata?.productStickers;
  if (Array.isArray(fromMeta) && fromMeta.length) {
    return fromMeta.map((p: ProductSticker) => ({
      productId: p.productId,
      title: p.title,
      image: p.image,
      price: p.price,
    }));
  }

  const primary =
    item?.product || item?.artifact || catalogProducts.find((p) => p.id === item?.artifactId);
  if (!primary) return [];

  return [
    {
      productId: primary.id,
      title: primary.title || primary.name || "Product",
      image: primary.images?.[0] || primary.image || primary.thumbnail || "",
      price: primary.price,
    },
  ];
}

interface ProductThumbnailStripProps {
  products: ProductSticker[];
  bottom?: number;
  onPressProduct?: (product: ProductSticker) => void;
  style?: ViewStyle;
}

/** Small square product images — horizontal scroll at bottom of post media. */
export function ProductThumbnailStrip({
  products,
  bottom = 10,
  onPressProduct,
  style,
}: ProductThumbnailStripProps) {
  if (!products.length) return null;

  const open = (p: ProductSticker) => {
    if (onPressProduct) onPressProduct(p);
    else openProduct(p.productId);
  };

  return (
    <View style={[styles.stripWrap, { bottom }, style]} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
        nestedScrollEnabled
      >
        {products.map((p) => (
          <TouchableOpacity key={p.productId} style={styles.thumbBox} onPress={() => open(p)} activeOpacity={0.85}>
            {p.image ? (
              <Image source={{ uri: p.image }} style={styles.thumbImg} contentFit="cover" />
            ) : (
              <View style={[styles.thumbImg, styles.thumbFallback]}>
                <Lucide name="bag-outline" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface ShopNowBarProps {
  products: ProductSticker[];
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "dark" | "light";
}

/** Instagram-style simple shop CTA — no title/price, just "Shop now". */
export function ShopNowBar({ products, onPress, style, variant = "dark" }: ShopNowBarProps) {
  if (!products.length) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (products[0]) openProduct(products[0].productId);
  };

  const isLight = variant === "light";

  return (
    <TouchableOpacity
      style={[
        styles.shopNowBar,
        isLight && styles.shopNowBarLight,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <Text style={[styles.shopNowText, isLight && styles.shopNowTextLight]}>Shop now</Text>
      <Lucide name="chevron-forward" size={18} color={isLight ? "#111111" : "#fff"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stripWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 8,
  },
  stripContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  thumbBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#111",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  shopNowBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  shopNowText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  shopNowBarLight: {
    borderColor: "#EAEAEA",
    backgroundColor: "#F5F5F7",
  },
  shopNowTextLight: {
    color: "#111111",
  },
});
