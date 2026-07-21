import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { formatINR, getDiscountPercent, getOriginalPrice } from "@/lib/shopPricing";
import {
  VerifiedMaisonBadge,
  isProductFromVerifiedMaison,
} from "@/components/shop/VerifiedMaisonBadge";

type Props = {
  product: any;
  onPress: () => void;
  onAdd?: () => void;
  onWishlist?: () => void;
  wishlisted?: boolean;
};

export function QuickShopProductCard({
  product,
  onPress,
  onAdd,
  onWishlist,
  wishlisted = false,
}: Props) {
  const { formatPrice, triggerHaptic } = useStore();
  const images = useMemo(
    () => (Array.isArray(product?.images) ? product.images.filter(Boolean) : []),
    [product?.images]
  );
  const [imageIndex, setImageIndex] = useState(0);
  const price = Number(product?.price || 0);
  const mrp = getOriginalPrice(product);
  const discount = getDiscountPercent(product);
  const image = images[imageIndex] || images[0];
  const weight =
    product?.arMetadata?.weight ||
    product?.arMetadata?.netWeight ||
    product?.weight ||
    "";
  const savings = mrp > price ? Math.round(mrp - price) : 0;
  const highlightPrice = discount >= 15 || savings >= 50;
  const verifiedMaison = isProductFromVerifiedMaison(product);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Lucide name="bag-outline" size={28} color="#BDBDBD" />
          </View>
        )}
        <TouchableOpacity
          style={styles.heart}
          onPress={() => {
            triggerHaptic("light");
            onWishlist?.();
          }}
          hitSlop={8}
        >
          <Lucide
            name={wishlisted ? "heart" : "heart-outline"}
            size={15}
            color={wishlisted ? "#E53935" : "#616161"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            triggerHaptic("medium");
            onAdd?.();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.addText}>ADD</Text>
        </TouchableOpacity>
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.slice(0, 4).map((_uri: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setImageIndex(idx)}
                hitSlop={6}
              >
                <View style={[styles.dot, idx === imageIndex && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {weight ? <Text style={styles.weight}>{weight}</Text> : null}

      <View style={styles.priceRow}>
        <Text style={[styles.price, highlightPrice && styles.priceHighlight]}>
          {formatPrice ? formatPrice(price) : formatINR(price)}
        </Text>
        {mrp > price && (
          <Text style={styles.mrp}>{formatPrice ? formatPrice(mrp) : formatINR(mrp)}</Text>
        )}
      </View>

      {savings > 0 && (
        <Text style={styles.off}>
          {discount >= 20 ? `${discount}% OFF` : `₹${savings} OFF`}
        </Text>
      )}

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {product?.title || "Product"}
        </Text>
        {verifiedMaison ? <VerifiedMaisonBadge size={12} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 128, marginRight: 10 },
  imageWrap: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEEEEE",
  },
  image: {
    width: "100%",
    height: 96,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  heart: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  addBtn: {
    position: "absolute",
    right: 12,
    bottom: 28,
    borderWidth: 1.5,
    borderColor: "#2E7D32",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  addText: { color: "#2E7D32", fontSize: 11, fontWeight: "800" },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
  },
  dotActive: { backgroundColor: "#9E9E9E", width: 10 },
  weight: { fontSize: 11, color: "#757575", marginBottom: 4, fontWeight: "500" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  price: { fontSize: 14, fontWeight: "800", color: "#111111" },
  priceHighlight: {
    backgroundColor: "#FFF176",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  mrp: { fontSize: 11, color: "#9E9E9E", textDecorationLine: "line-through" },
  off: { fontSize: 11, color: "#1565C0", fontWeight: "600", marginTop: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 4,
    minHeight: 32,
  },
  title: { flex: 1, fontSize: 12, color: "#424242", lineHeight: 16 },
});
