import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import {
  formatINR,
  getBankOfferPrice,
  getDiscountPercent,
  getOriginalPrice,
  getProductRating,
  getReviewCount,
} from "@/lib/shopPricing";
import { useStore } from "@/store/useStore";
import {
  VerifiedMaisonBadge,
  isProductFromVerifiedMaison,
} from "@/components/shop/VerifiedMaisonBadge";

type Props = {
  product: any;
  onPress: () => void;
  onWishlist?: () => void;
  isWishlisted?: boolean;
  isAd?: boolean;
};

export function ProductListCard({
  product,
  onPress,
  onWishlist,
  isWishlisted,
  isAd = false,
}: Props) {
  const { formatPrice } = useStore();
  const image = product.images?.[0];
  const rating = getProductRating(product);
  const reviews = getReviewCount(product);
  const discount = getDiscountPercent(product);
  const original = getOriginalPrice(product);
  const bankPrice = getBankOfferPrice(product);
  const brand = product.maison?.name || product.brand || "AURA";
  const verifiedMaison = isProductFromVerifiedMaison(product);
  const reviewLabel = reviews >= 1000 ? `${Math.floor(reviews / 1000)}K+` : String(reviews);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.imageWrap}>
        {isAd && (
          <View style={styles.adTag}>
            <Text style={styles.adText}>AD</Text>
          </View>
        )}
        {onWishlist && (
          <TouchableOpacity style={styles.heartBtn} onPress={onWishlist}>
            <Lucide
              name={isWishlisted ? "heart" : "heart-outline"}
              size={18}
              color={isWishlisted ? SHOP.red : SHOP.text}
            />
          </TouchableOpacity>
        )}
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} ★ | {reviewLabel}
          </Text>
        </View>
        <View style={styles.assuredBadge}>
          <Lucide name="shield-checkmark" size={10} color="#B8860B" />
          <Text style={styles.assuredText}>Assured</Text>
        </View>
      </View>

      <View style={styles.info}>
        {product.vibe ? (
          <View style={styles.trendTag}>
            <Text style={styles.trendText}>{product.vibe}</Text>
          </View>
        ) : null}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>{brand.toUpperCase()}</Text>
          {verifiedMaison ? <VerifiedMaisonBadge size={13} /> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          {discount > 0 && (
            <>
              <Lucide name="arrow-down" size={12} color={SHOP.green} />
              <Text style={styles.discount}>{discount}%</Text>
              <Text style={styles.original}>
                {formatPrice ? formatPrice(original) : formatINR(original)}
              </Text>
            </>
          )}
        </View>
        <Text style={styles.price}>
          {formatPrice ? formatPrice(product.price) : formatINR(product.price ?? 0)}
        </Text>
        <Text style={styles.bankOffer}>
          WOW! {formatPrice ? formatPrice(bankPrice) : formatINR(bankPrice)}
        </Text>
        <Text style={styles.offerLink}>with Bank offer + more</Text>
        {product.hashtag ? (
          <Text style={styles.hashtag}>#{product.hashtag}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: SHOP.bg,
    marginBottom: 12,
  },
  imageWrap: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: SHOP.surface,
  },
  image: {
    width: "100%",
    aspectRatio: 0.85,
  },
  placeholder: {
    backgroundColor: "#EEE",
  },
  adTag: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  adText: {
    fontSize: 9,
    fontWeight: "700",
    color: SHOP.adTag,
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 4,
  },
  ratingPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "600",
    color: SHOP.star,
  },
  assuredBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assuredText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#B8860B",
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  trendTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#7B1FA2",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    color: SHOP.text,
  },
  title: {
    fontSize: 12,
    color: SHOP.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  discount: {
    fontSize: 12,
    fontWeight: "700",
    color: SHOP.green,
  },
  original: {
    fontSize: 12,
    color: SHOP.textMuted,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: SHOP.text,
    marginTop: 2,
  },
  bankOffer: {
    fontSize: 13,
    fontWeight: "700",
    color: SHOP.primary,
    marginTop: 2,
  },
  offerLink: {
    fontSize: 11,
    color: SHOP.primary,
    marginTop: 2,
  },
  hashtag: {
    fontSize: 11,
    color: SHOP.textMuted,
    marginTop: 4,
  },
});
