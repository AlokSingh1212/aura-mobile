import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { PdpBuyBar } from "@/components/shop/PdpBuyBar";
import { ProductListCard } from "@/components/shop/ProductListCard";
import {
  VerifiedMaisonBadge,
  isProductFromVerifiedMaison,
} from "@/components/shop/VerifiedMaisonBadge";
import { PdpAddressSheet } from "@/components/shop/PdpAddressSheet";
import { SHOP } from "@/theme/shopTheme";
import {
  formatINR,
  getDiscountPercent,
  getOriginalPrice,
  getProductRating,
  getReviewCount,
} from "@/lib/shopPricing";
import {
  type BankOffer,
  type CategorySectionMeta,
  type DeliveryEstimate,
  type ProductHighlight,
  type ProductReviewItem,
  estimateDelivery,
  getBankOffers,
  getCouponPreview,
  getEffectivePdpPrice,
  getEmiBreakdown,
  getProductColorOptions,
  getProductHighlights,
  getProductReviews,
  getProductSizeOptions,
  getProductStock,
  getRatingLabel,
  getSellerMeta,
  isCodAvailable,
} from "@/lib/shopPdp";
import { shortAddressLine, type ShippingAddress } from "@/lib/shopAddress";
import { getPostalCodeRule, validatePostalCode } from "@/lib/worldLocations";
import { formatPhoneDisplay } from "@/lib/phoneValidation";
import { RatingDistribution } from "@/components/shop/RatingDistribution";
import { CouponPickerSheet } from "@/components/shop/CouponPickerSheet";
import type { ProductReviewSummary } from "@/lib/shopReviews";
import { formatReviewDate } from "@/lib/shopReviews";
import { useStore } from "@/store/useStore";
import {
  shouldShowInventoryOnProduct,
  shouldShowLowStockAlert,
} from "@/lib/settingsRuntime";

const { width } = Dimensions.get("window");

type Props = {
  product: any;
  similarProducts?: any[];
  categoryProducts?: any[];
  categorySection?: CategorySectionMeta;
  onViewAllCategory?: () => void;
  shippingAddress: ShippingAddress;
  onSaveAddress: (address: ShippingAddress) => void;
  appliedBankOffer?: BankOffer | null;
  onApplyBankOffer?: (offer: BankOffer | null) => void;
  appliedCoupon?: any | null;
  couponCode?: string;
  onCouponCodeChange?: (code: string) => void;
  onApplyCoupon?: () => void;
  onClearCoupon?: () => void;
  couponError?: string;
  isCheckingCoupon?: boolean;
  onAddToCart: (opts?: { color?: string; size?: string }) => void;
  onBuyNow: (opts?: { color?: string; size?: string }) => void;
  onBuyWithEmi?: (opts?: { color?: string; size?: string }) => void;
  onToggleWishlist: () => void;
  isWishlisted?: boolean;
  showBankOffers?: boolean;
  reviewSummary?: ProductReviewSummary | null;
  reviewsLoading?: boolean;
  onRateReview?: () => void;
  onOpenCoupons?: () => void;
  couponSheetVisible?: boolean;
  onCloseCoupons?: () => void;
  onApplyCouponCode?: (code: string) => void;
  maisonId?: string | null;
};

export function ShopProductDetail({
  product,
  similarProducts = [],
  categoryProducts = [],
  categorySection,
  onViewAllCategory,
  shippingAddress,
  onSaveAddress,
  appliedBankOffer,
  onApplyBankOffer,
  appliedCoupon,
  couponCode = "",
  onCouponCodeChange,
  onApplyCoupon,
  onClearCoupon,
  couponError,
  isCheckingCoupon,
  onAddToCart,
  onBuyNow,
  onBuyWithEmi,
  onToggleWishlist,
  isWishlisted,
  showBankOffers = true,
  reviewSummary,
  reviewsLoading,
  onRateReview,
  onOpenCoupons,
  couponSheetVisible,
  onCloseCoupons,
  onApplyCouponCode,
  maisonId,
}: Props) {
  const { formatPrice, triggerHaptic } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [offersExpanded, setOffersExpanded] = useState(true);
  const [highlightsExpanded, setHighlightsExpanded] = useState(true);
  const [reviewsExpanded, setReviewsExpanded] = useState(true);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [pinInput, setPinInput] = useState(shippingAddress.postalCode || "");
  const [pinChecked, setPinChecked] = useState(Boolean(shippingAddress.postalCode));

  const colorOptions = useMemo(() => getProductColorOptions(product), [product]);
  const sizeOptions = useMemo(() => getProductSizeOptions(product), [product]);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || "Default");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "One Size");

  useEffect(() => {
    if (colorOptions.length) setSelectedColor(colorOptions[0]);
    if (sizeOptions.length) setSelectedSize(sizeOptions[0]);
  }, [product.id, colorOptions.join(","), sizeOptions.join(",")]);

  useEffect(() => {
    if (shippingAddress.postalCode) {
      setPinInput(shippingAddress.postalCode);
      setPinChecked(true);
    }
  }, [shippingAddress.postalCode]);

  const images = product.images?.length ? product.images : [];
  const rating =
    reviewSummary && reviewSummary.reviewCount > 0
      ? reviewSummary.averageRating
      : getProductRating(product);
  const reviewsCount =
    reviewSummary && reviewSummary.reviewCount > 0
      ? reviewSummary.reviewCount
      : getReviewCount(product);
  const discount = getDiscountPercent(product);
  const original = getOriginalPrice(product);
  const bankOffers = useMemo(() => getBankOffers(product), [product]);
  const effectivePrice = getEffectivePdpPrice(product, appliedBankOffer, appliedCoupon);
  const emi = getEmiBreakdown(effectivePrice);
  const couponPreview = getCouponPreview(product);
  const highlights: ProductHighlight[] = useMemo(() => getProductHighlights(product), [product]);
  const reviewItems: ProductReviewItem[] = useMemo(() => {
    if (reviewSummary?.reviews?.length) {
      return reviewSummary.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        author: r.author,
        createdAt: formatReviewDate(r.createdAt),
      }));
    }
    return getProductReviews(product);
  }, [reviewSummary, product]);
  const seller = getSellerMeta(product);
  const stock = getProductStock(product);
  const inStock = stock > 0;

  const delivery: DeliveryEstimate = useMemo(
    () =>
      estimateDelivery(pinChecked ? pinInput : shippingAddress.postalCode, {
        inStock,
      }),
    [pinInput, pinChecked, shippingAddress.postalCode, inStock]
  );

  const effectiveDisplay = formatPrice ? formatPrice(effectivePrice) : formatINR(effectivePrice);
  const brand = product.maison?.name || product.brand || "AURA";
  const verifiedMaison = isProductFromVerifiedMaison(product);

  const variantLabel =
    selectedColor !== "Default" || selectedSize !== "One Size"
      ? ` (${selectedColor}${selectedSize !== "One Size" ? `, ${selectedSize}` : ""})`
      : "";

  const postalRule = getPostalCodeRule(shippingAddress.countryIso);

  const handleCheckPin = () => {
    triggerHaptic("light");
    const clean =
      postalRule.keyboard === "number-pad"
        ? pinInput.replace(/\D/g, "").slice(0, postalRule.maxLength)
        : pinInput.trim().toUpperCase().slice(0, postalRule.maxLength);
    setPinInput(clean);
    const valid = validatePostalCode(clean, shippingAddress.countryIso);
    setPinChecked(valid);
    if (valid) {
      onSaveAddress({ ...shippingAddress, postalCode: clean });
    }
  };

  const handleApplyBank = (offer: BankOffer) => {
    triggerHaptic("light");
    if (appliedBankOffer?.id === offer.id) {
      onApplyBankOffer?.(null);
    } else {
      onApplyBankOffer?.(offer);
    }
  };

  const variantOpts = { color: selectedColor, size: selectedSize };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ShopHeader showBack showSearch />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.gallery}>
            {images[activeImg] ? (
              <Image source={{ uri: images[activeImg] }} style={styles.heroImg} />
            ) : (
              <View style={[styles.heroImg, styles.heroPlaceholder]} />
            )}
            <TouchableOpacity style={styles.wishBtn} onPress={onToggleWishlist}>
              <Lucide
                name={isWishlisted ? "heart" : "heart-outline"}
                size={22}
                color={SHOP.text}
              />
            </TouchableOpacity>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ★ |{" "}
                {reviewsCount >= 1000 ? `${Math.floor(reviewsCount / 1000)}K+` : reviewsCount}
              </Text>
            </View>
            <View style={styles.sellerBadge}>
              <Lucide name="shield-checkmark" size={12} color="#B8860B" />
              <Text style={styles.sellerText}>BRAND AUTHORISED SELLER</Text>
            </View>
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {images.map((uri: string, i: number) => (
                  <TouchableOpacity key={`${uri}-${i}`} onPress={() => setActiveImg(i)}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, activeImg === i && styles.thumbActive]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {colorOptions.length > 0 && (
            <>
              <Text style={styles.colorLabel}>Selected Color: {selectedColor}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {colorOptions.map((c, i) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorThumb, selectedColor === c && styles.colorThumbActive]}
                    onPress={() => {
                      triggerHaptic("light");
                      setSelectedColor(c);
                      if (images[i]) setActiveImg(i);
                    }}
                  >
                    {images[i] ? (
                      <Image source={{ uri: images[i] }} style={styles.colorImg} />
                    ) : (
                      <View style={[styles.colorImg, styles.colorSwatch]}>
                        <Text style={styles.colorSwatchText}>{c.slice(0, 2)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {sizeOptions.length > 0 && (
            <>
              <View style={styles.sizeHeader}>
                <Text style={styles.sizeTitle}>Select Size</Text>
                <Text style={styles.sizeChart}>Size Chart</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeRow}>
                {sizeOptions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeBtn, selectedSize === s && styles.sizeBtnActive]}
                    onPress={() => {
                      triggerHaptic("light");
                      setSelectedSize(s);
                    }}
                  >
                    <Text style={[styles.sizeText, selectedSize === s && styles.sizeTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.brandRow}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brand}>{brand.toUpperCase()}</Text>
              {verifiedMaison ? <VerifiedMaisonBadge size={16} /> : null}
            </View>
            <View style={styles.brandActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic("light");
                  router.push({
                    pathname: "/shop/all-products",
                    params: { productId: product.id },
                  } as any);
                }}
              >
                <Text style={styles.allProductsLink}>All Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic("light");
                  if (seller.maisonId) router.push(`/profile/${seller.maisonId}` as any);
                }}
              >
                <Text style={styles.visitStore}>Visit store</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.productTitle}>
            {product.title}
            {variantLabel}
          </Text>
          <View style={styles.priceBlock}>
            {discount > 0 && (
              <Text style={styles.discountRow}>
                ↓ {discount}%{"  "}
                <Text style={styles.strike}>
                  {formatPrice ? formatPrice(original) : formatINR(original)}
                </Text>
              </Text>
            )}
            <Text style={styles.price}>{effectiveDisplay}</Text>
            {(appliedBankOffer || appliedCoupon) && effectivePrice < (product.price ?? 0) ? (
              <Text style={styles.priceNote}>
                Inclusive of applied offers · MRP{" "}
                {formatPrice ? formatPrice(product.price ?? 0) : formatINR(product.price ?? 0)}
              </Text>
            ) : null}
            {!inStock && <Text style={styles.outOfStock}>Currently unavailable</Text>}
            {inStock && shouldShowLowStockAlert(stock) && (
              <Text style={styles.lowStock}>Only {stock} left in stock</Text>
            )}
            {shouldShowInventoryOnProduct() && inStock && stock > 0 && !shouldShowLowStockAlert(stock) && (
              <Text style={styles.stockCount}>{stock} in stock</Text>
            )}
          </View>

          {showBankOffers && effectivePrice >= 500 ? (
          <View style={styles.wowCard}>
            <TouchableOpacity
              style={styles.wowHeader}
              onPress={() => setOffersExpanded(!offersExpanded)}
              activeOpacity={0.85}
            >
              <View style={styles.wowHeaderLeft}>
                <Text style={styles.wowTitle}>Offers & savings</Text>
                <Text style={styles.wowSub}>Coupons, bank cashback & EMI options</Text>
              </View>
              <Lucide
                name={offersExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            {offersExpanded && (
              <View style={styles.wowBody}>
                <View style={styles.payModeStack}>
                  <View style={[styles.payModeCard, styles.payModePrimary]}>
                    <Text style={styles.payModeLabel}>Pay full amount</Text>
                    <Text style={styles.wowPrice}>{effectiveDisplay}</Text>
                    <Text style={styles.wowPriceSub}>
                      {appliedBankOffer || appliedCoupon
                        ? "After applied offers"
                        : "Best direct price"}
                    </Text>
                  </View>
                  {effectivePrice >= 3000 ? (
                    <View style={styles.payModeCard}>
                      <Text style={styles.payModeLabel}>No Cost EMI</Text>
                      <Text style={styles.emiLine}>
                        {formatPrice ? formatPrice(emi.monthly) : formatINR(emi.monthly)}/mo
                      </Text>
                      <Text style={styles.wowPriceSub}>
                        {emi.months} months · total{" "}
                        {formatPrice ? formatPrice(emi.total) : formatINR(emi.total)}
                      </Text>
                      {onBuyWithEmi ? (
                        <TouchableOpacity
                          style={styles.emiLinkBtn}
                          onPress={() => onBuyWithEmi(variantOpts)}
                        >
                          <Text style={styles.emiLinkText}>View EMI plans →</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.couponRow}>
                  <Text style={styles.couponLabel}>Coupons</Text>
                  <TouchableOpacity onPress={onOpenCoupons}>
                    <Text style={styles.couponApply}>
                      {appliedCoupon ? appliedCoupon.code : "View all"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.couponCard}>
                  <Lucide name="ticket-outline" size={18} color={SHOP.primary} />
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor={SHOP.textMuted}
                    value={couponCode}
                    onChangeText={onCouponCodeChange}
                    autoCapitalize="characters"
                  />
                  {isCheckingCoupon ? (
                    <ActivityIndicator size="small" color={SHOP.primary} />
                  ) : (
                    <TouchableOpacity onPress={onApplyCoupon} hitSlop={8}>
                      <Text style={styles.couponApplyBtn}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {appliedCoupon ? (
                  <TouchableOpacity onPress={onClearCoupon}>
                    <Text style={styles.couponClear}>Remove coupon {appliedCoupon.code}</Text>
                  </TouchableOpacity>
                ) : null}
                {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
                {!appliedCoupon && (
                  <Text style={styles.couponHint}>
                    Try AURA10 for up to ₹{couponPreview.amount.toLocaleString("en-IN")} off
                  </Text>
                )}
              </View>
            )}
          </View>
          ) : null}

          {showBankOffers && bankOffers.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank offers</Text>
            <Text style={styles.sectionHint}>Tap to apply · one offer at checkout</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bankOffers.map((offer) => {
                const active = appliedBankOffer?.id === offer.id;
                return (
                  <TouchableOpacity
                    key={offer.id}
                    style={[styles.bankCard, active && styles.bankCardActive]}
                    onPress={() => handleApplyBank(offer)}
                    activeOpacity={0.85}
                  >
                    {offer.isBest && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestText}>Best value</Text>
                      </View>
                    )}
                    <Text style={styles.bankName}>{offer.bankName}</Text>
                    <Text style={styles.bankOff}>
                      ₹{offer.discountAmount.toLocaleString("en-IN")} off
                    </Text>
                    <Text style={styles.bankPct}>{offer.discountPercent}% instant discount</Text>
                    <Text style={[styles.bankApply, active && styles.bankApplyActive]}>
                      {active ? "Applied ✓" : "Tap to apply"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery details</Text>
            <TouchableOpacity
              style={styles.deliveryCard}
              onPress={() => {
                triggerHaptic("light");
                setAddressSheetVisible(true);
              }}
            >
              <Lucide name="home-outline" size={20} color={SHOP.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.deliveryTag}>HOME</Text>
                <Text style={styles.deliveryAddr} numberOfLines={2}>
                  {shortAddressLine(shippingAddress)}
                </Text>
                {shippingAddress.phone ? (
                  <Text style={styles.deliveryPhone}>
                    {formatPhoneDisplay(
                      shippingAddress.phone,
                      shippingAddress.countryCode
                    )}
                  </Text>
                ) : null}
              </View>
              <Lucide name="chevron-forward" size={18} color={SHOP.textSecondary} />
            </TouchableOpacity>

            <View style={styles.pinRow}>
              <TextInput
                style={styles.pinInput}
                placeholder={postalRule.placeholder}
                placeholderTextColor={SHOP.textMuted}
                keyboardType={postalRule.keyboard}
                maxLength={postalRule.maxLength}
                value={pinInput}
                onChangeText={setPinInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.pinBtn} onPress={handleCheckPin}>
                <Text style={styles.pinBtnText}>Check</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliveryCard}>
              <Lucide
                name={delivery.serviceable ? "car-outline" : "alert-circle-outline"}
                size={20}
                color={delivery.serviceable ? SHOP.primary : SHOP.red}
              />
              <Text
                style={[
                  styles.deliveryDate,
                  !delivery.serviceable && { color: SHOP.red },
                ]}
              >
                {delivery.label}
              </Text>
            </View>

            <View style={styles.deliveryCard}>
              <Lucide name="storefront-outline" size={20} color={SHOP.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sellerLine}>Fulfilled by {seller.name}</Text>
                <Text style={styles.sellerMeta}>
                  {seller.rating.toFixed(1)} ★ · {seller.tenureLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.policyRow}>
            {[
              { icon: "return-down-back-outline", label: "10-Day Return", show: true },
              { icon: "cash-outline", label: "Cash on Delivery", show: isCodAvailable(product) },
              { icon: "shield-checkmark-outline", label: "AURA Assured", show: true },
            ]
              .filter((p) => p.show)
              .map((p) => (
                <View key={p.label} style={styles.policyItem}>
                  <Lucide name={p.icon as any} size={22} color={SHOP.textSecondary} />
                  <Text style={styles.policyLabel}>{p.label}</Text>
                </View>
              ))}
          </View>

          {similarProducts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Similar products</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarProducts.slice(0, 6).map((p) => (
                  <View key={p.id} style={styles.similarWrap}>
                    <ProductListCard
                      product={p}
                      onPress={() => router.push(`/product/${p.id}` as any)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setHighlightsExpanded(!highlightsExpanded)}
          >
            <Text style={styles.sectionTitle}>Product highlights</Text>
            <Lucide
              name={highlightsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={SHOP.textSecondary}
            />
          </TouchableOpacity>
          {highlightsExpanded && (
            <View style={styles.highlightsGrid}>
              {highlights.map((row) => (
                <View key={row.label} style={styles.highlightCell}>
                  <Text style={styles.highlightKey}>{row.label}</Text>
                  <Text style={styles.highlightVal}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setReviewsExpanded(!reviewsExpanded)}
          >
            <Text style={styles.sectionTitle}>Ratings and reviews</Text>
            <Lucide
              name={reviewsExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={SHOP.textSecondary}
            />
          </TouchableOpacity>
          {onRateReview ? (
            <TouchableOpacity style={styles.rateBtn} onPress={onRateReview}>
              <Lucide name="create-outline" size={16} color={SHOP.primary} />
              <Text style={styles.rateBtnText}>Rate & write a review</Text>
            </TouchableOpacity>
          ) : null}
          {reviewsExpanded && (
            <View style={styles.reviewsBlock}>
              <View style={styles.reviewsTopRow}>
                <View style={styles.reviewsSummaryCol}>
                  <View style={styles.reviewsSummary}>
                    <Text style={styles.reviewsScore}>{rating.toFixed(1)}</Text>
                    <Lucide name="star" size={20} color={SHOP.green} />
                    <View style={styles.veryGood}>
                      <Text style={styles.veryGoodText}>{getRatingLabel(rating)}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewsMeta}>
                    {reviewsCount.toLocaleString()} ratings
                    {reviewItems.length > 0
                      ? ` and ${reviewItems.length} reviews`
                      : ""}
                  </Text>
                </View>
                {reviewSummary && reviewSummary.reviewCount > 0 ? (
                  <RatingDistribution
                    distribution={reviewSummary.distribution}
                    total={reviewSummary.reviewCount}
                  />
                ) : null}
              </View>
              {reviewsLoading ? (
                <ActivityIndicator style={{ marginTop: 16 }} color={SHOP.primary} />
              ) : null}
              {reviewItems.length > 0 ? (
                reviewItems.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <View style={styles.reviewStars}>
                        <Text style={styles.reviewStarText}>{review.rating} ★</Text>
                      </View>
                      {review.createdAt ? (
                        <Text style={styles.reviewTime}>{review.createdAt}</Text>
                      ) : null}
                    </View>
                    {review.title ? (
                      <Text style={styles.reviewHeadline}>{review.title}</Text>
                    ) : null}
                    <Text style={styles.reviewBody}>{review.body}</Text>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewBody}>
                    No written reviews yet. Be the first verified buyer to review this product.
                  </Text>
                </View>
              )}
            </View>
          )}

          {categoryProducts.length > 0 && (
            <View style={styles.categorySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {categorySection?.title || "More in this category"}
                </Text>
                {onViewAllCategory ? (
                  <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAllCategory}>
                    <Text style={styles.viewAllText}>View all</Text>
                    <Lucide name="chevron-forward" size={16} color={SHOP.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.categoryGrid}>
                {categoryProducts.map((p) => (
                  <View key={p.id} style={styles.categoryCol}>
                    <ProductListCard
                      product={p}
                      onPress={() => router.push(`/product/${p.id}` as any)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <PdpBuyBar
        price={effectivePrice}
        onAddToCart={() => onAddToCart(variantOpts)}
        onBuyNow={() => onBuyNow(variantOpts)}
        onEmi={onBuyWithEmi ? () => onBuyWithEmi(variantOpts) : undefined}
        disabled={!inStock}
      />

      <PdpAddressSheet
        visible={addressSheetVisible}
        address={shippingAddress}
        onClose={() => setAddressSheetVisible(false)}
        onSave={onSaveAddress}
      />

      {onCloseCoupons && onApplyCouponCode ? (
        <CouponPickerSheet
          visible={Boolean(couponSheetVisible)}
          maisonId={maisonId}
          appliedCode={appliedCoupon?.code}
          onClose={onCloseCoupons}
          onApply={onApplyCouponCode}
          isApplying={isCheckingCoupon}
          error={couponError}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHOP.bg },
  safe: { flex: 1 },
  scroll: { paddingBottom: 20 },
  gallery: { position: "relative", backgroundColor: "#FAFAFA" },
  heroImg: { width, height: width * 0.9 },
  heroPlaceholder: { backgroundColor: "#EEE" },
  wishBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
  },
  ratingBadge: {
    position: "absolute",
    bottom: 52,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: { fontSize: 12, fontWeight: "600", color: SHOP.green },
  sellerBadge: {
    position: "absolute",
    bottom: 52,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sellerText: { fontSize: 8, fontWeight: "700", color: "#B8860B" },
  thumbRow: { paddingHorizontal: 12, paddingBottom: 10 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: SHOP.text },
  colorLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 13,
    color: SHOP.textSecondary,
  },
  colorRow: { paddingHorizontal: 16, paddingVertical: 8 },
  colorThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  colorThumbActive: { borderColor: SHOP.text },
  colorImg: { width: "100%", height: "100%", backgroundColor: "#EEE" },
  colorSwatch: { alignItems: "center", justifyContent: "center" },
  colorSwatchText: { fontSize: 12, fontWeight: "700", color: SHOP.textSecondary },
  sizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sizeTitle: { fontSize: 15, fontWeight: "700", color: SHOP.text },
  sizeChart: { fontSize: 13, color: SHOP.primary, fontWeight: "600" },
  sizeRow: { paddingHorizontal: 16, paddingVertical: 8 },
  sizeBtn: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SHOP.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    paddingHorizontal: 10,
  },
  sizeBtnActive: { borderColor: SHOP.text, backgroundColor: SHOP.surface },
  sizeText: { fontSize: 13, color: SHOP.textSecondary },
  sizeTextActive: { fontWeight: "700", color: SHOP.text },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  brand: { fontSize: 16, fontWeight: "800", color: SHOP.text },
  brandActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  allProductsLink: { fontSize: 13, color: "#121212", fontWeight: "700" },
  visitStore: { fontSize: 13, color: SHOP.primary, fontWeight: "600" },
  productTitle: {
    paddingHorizontal: 16,
    marginTop: 4,
    fontSize: 14,
    color: SHOP.textSecondary,
    lineHeight: 20,
  },
  priceBlock: { paddingHorizontal: 16, marginTop: 8 },
  discountRow: { fontSize: 14, color: SHOP.green, fontWeight: "700" },
  strike: { color: SHOP.textMuted, textDecorationLine: "line-through", fontWeight: "400" },
  price: { fontSize: 22, fontWeight: "800", color: SHOP.text, marginTop: 4 },
  priceNote: { fontSize: 12, color: SHOP.green, fontWeight: "600", marginTop: 4 },
  outOfStock: { marginTop: 4, color: SHOP.red, fontWeight: "600", fontSize: 13 },
  lowStock: { marginTop: 4, color: "#E65100", fontWeight: "600", fontSize: 12 },
  stockCount: { marginTop: 4, color: SHOP.textSecondary, fontSize: 12 },
  wowCard: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: SHOP.wowBlue,
  },
  wowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 12,
  },
  wowHeaderLeft: { flex: 1 },
  wowTitle: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  wowSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 },
  wowBody: { backgroundColor: SHOP.bg, padding: 12 },
  payModeStack: { gap: 10 },
  payModeCard: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: SHOP.surface,
  },
  payModePrimary: {
    borderColor: SHOP.primary,
    backgroundColor: SHOP.wowBlueLight,
  },
  payModeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: SHOP.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  wowPrice: { fontSize: 20, fontWeight: "800", color: SHOP.primary, marginTop: 4 },
  wowPriceSub: { fontSize: 12, color: SHOP.textSecondary, marginTop: 4 },
  emiLine: { fontSize: 18, fontWeight: "800", color: SHOP.text, marginTop: 4 },
  emiLinkBtn: { marginTop: 8, alignSelf: "flex-start" },
  emiLinkText: { fontSize: 13, fontWeight: "700", color: SHOP.primary },
  couponRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  couponLabel: { fontWeight: "700", color: SHOP.text },
  couponApply: { color: SHOP.primary, fontWeight: "700" },
  couponApplied: { color: SHOP.green, fontWeight: "700", fontSize: 12 },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  couponInput: { flex: 1, fontSize: 14, color: SHOP.text, paddingVertical: 0 },
  couponApplyBtn: { color: SHOP.primary, fontWeight: "800", fontSize: 14 },
  couponClear: { color: SHOP.red, fontSize: 12, fontWeight: "600", marginTop: 6 },
  couponError: { color: SHOP.red, fontSize: 12, marginTop: 6 },
  couponHint: { fontSize: 11, color: SHOP.textSecondary, marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHint: { fontSize: 12, color: SHOP.textSecondary, marginBottom: 10, marginTop: -4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: SHOP.text },
  bankCard: {
    width: 152,
    borderWidth: 1.5,
    borderColor: SHOP.border,
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    position: "relative",
    backgroundColor: SHOP.surface,
  },
  bankCardActive: { borderColor: SHOP.primary, backgroundColor: SHOP.wowBlueLight },
  bestBadge: {
    position: "absolute",
    top: -8,
    left: 8,
    backgroundColor: SHOP.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestText: { fontSize: 9, fontWeight: "700" },
  bankName: { fontSize: 13, fontWeight: "800", marginTop: 6, color: SHOP.text },
  bankOff: { fontSize: 15, fontWeight: "800", color: SHOP.green, marginTop: 4 },
  bankPct: { fontSize: 11, color: SHOP.textSecondary, marginTop: 2 },
  bankApply: { fontSize: 12, color: SHOP.primary, fontWeight: "700", marginTop: 8 },
  bankApplyActive: { color: SHOP.green },
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SHOP.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  deliveryTag: { fontSize: 11, fontWeight: "700", color: SHOP.textSecondary },
  deliveryAddr: { fontSize: 13, color: SHOP.text, marginTop: 2 },
  deliveryPhone: { fontSize: 12, color: SHOP.textSecondary, marginTop: 2 },
  pinRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  pinInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: SHOP.text,
    backgroundColor: SHOP.surface,
  },
  pinBtn: {
    backgroundColor: SHOP.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  pinBtnText: { color: "#FFF", fontWeight: "700" },
  deliveryDate: { marginLeft: 10, fontSize: 14, fontWeight: "700", color: SHOP.text, flex: 1 },
  sellerLine: { fontSize: 13, fontWeight: "600", color: SHOP.text },
  sellerMeta: { fontSize: 11, color: SHOP.textSecondary, marginTop: 2 },
  policyRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
    marginTop: 8,
  },
  policyItem: { alignItems: "center", gap: 4 },
  policyLabel: { fontSize: 10, color: SHOP.textSecondary, textAlign: "center" },
  similarWrap: { width: 160, marginRight: 8 },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
    marginTop: 4,
  },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: "700", color: SHOP.primary },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCol: {
    width: (width - 40) / 2,
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  highlightCell: {
    width: "50%",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
  },
  highlightKey: { fontSize: 12, color: SHOP.textSecondary },
  highlightVal: { fontSize: 13, fontWeight: "600", color: SHOP.text, marginTop: 2 },
  reviewsBlock: { paddingHorizontal: 16, paddingBottom: 16 },
  reviewsTopRow: { flexDirection: "row", alignItems: "flex-start" },
  reviewsSummaryCol: { flex: 1 },
  reviewsSummary: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewsScore: { fontSize: 28, fontWeight: "800", color: SHOP.text },
  veryGood: {
    backgroundColor: SHOP.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  veryGoodText: { fontSize: 12, fontWeight: "600", color: SHOP.green },
  reviewsMeta: { fontSize: 12, color: SHOP.textSecondary, marginTop: 6 },
  reviewCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 12,
  },
  reviewTop: { flexDirection: "row", justifyContent: "space-between" },
  reviewStars: {
    backgroundColor: SHOP.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewStarText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  reviewTime: { fontSize: 11, color: SHOP.textMuted },
  reviewHeadline: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  reviewBody: { fontSize: 13, color: SHOP.textSecondary, marginTop: 4 },
  reviewAuthor: { fontSize: 11, color: SHOP.textMuted, marginTop: 8 },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: SHOP.primary,
    borderRadius: 20,
  },
  rateBtnText: { fontSize: 13, fontWeight: "700", color: SHOP.primary },
});
