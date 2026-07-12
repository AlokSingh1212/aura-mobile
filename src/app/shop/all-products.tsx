import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { ShopQuickNav, getShopQuickNavHeight } from "@/components/shop/ShopQuickNav";
import { FilterChipsRow } from "@/components/shop/FilterChipsRow";
import { ShopFilterSheet } from "@/components/shop/ShopFilterSheet";
import { QuickShopProductCard } from "@/components/shop/QuickShopProductCard";
import { useStore } from "@/store/useStore";
import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import {
  buildDynamicShopCatalog,
  filterProductsByDynamicCategory,
  resolveCategoryFromProduct,
} from "@/lib/dynamicShopCatalog";
import {
  buildQuickCommerceChips,
  filterByQuickChip,
  getDeliveryStatus,
  getFreeDeliveryGap,
  getPreviouslyBoughtProducts,
  pickPromoProduct,
  type QuickCommerceChip,
} from "@/lib/quickCommerceUi";
import { buildDefaultShippingAddress, shortAddressLine, type ShippingAddress } from "@/lib/shopAddress";
import { loadPrimaryShippingAddress } from "@/lib/shippingAddressStore";
import { recordAndTranscribeVoiceSearch } from "@/lib/voiceSearch";
import {
  DEFAULT_SHOP_FILTERS,
  extractFilterOptions,
  productMatchesShopFilters,
  sortProducts,
  activeFilterCount,
  type ShopFilters,
} from "@/lib/shopFilters";

export default function AllProductsScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    productId?: string;
    mode?: string;
  }>();
  const {
    products,
    loadingProducts,
    fetchProducts,
    fetchOrders,
    orders,
    triggerHaptic,
    addToCart,
    cart,
    currentUser,
    activeProfile,
    toggleWishlist,
    wishlist,
    fetchWishlist,
  } = useStore();
  const insets = useSafeAreaInsets();
  const bottomPad = getShopQuickNavHeight(insets.bottom);
  const searchRef = useRef<TextInput>(null);
  const bootstrapped = useRef(false);
  const chipFromProductApplied = useRef(false);

  const [search, setSearch] = useState("");
  const [selectedChip, setSelectedChip] = useState("all");
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [deliveryDismissed, setDeliveryDismissed] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(() =>
    buildDefaultShippingAddress(currentUser, activeProfile)
  );
  const [deliveryEta, setDeliveryEta] = useState(() => getDeliveryStatus());
  const [voiceSearching, setVoiceSearching] = useState(false);
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_SHOP_FILTERS);
  const [filterSheet, setFilterSheet] = useState<"sort" | "brand" | "color" | "gender" | null>(null);

  const isOrderAgainMode = params.mode === "order-again" || selectedChip === "order-again";
  const userId = currentUser?.id || activeProfile?.userId;

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const addr = await loadPrimaryShippingAddress(currentUser, activeProfile);
      if (!cancelled) setShippingAddress(addr);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, activeProfile?.userId]);

  useEffect(() => {
    if (!userId) return;
    fetchWishlist(userId);
  }, [userId, fetchWishlist]);

  useEffect(() => {
    if (!userId) {
      setWalletBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/wallet`, { headers: authHeaders() });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.success && !cancelled) {
          setWalletBalance(Number(data.walletBalance ?? 0));
        }
      } catch {
        if (!cancelled) setWalletBalance(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const pin = shippingAddress.postalCode?.trim();
    if (!pin || pin.length !== 6 || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/logistics/serviceability?pincode=${pin}&userId=${userId}`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        if (cancelled || !data.success) return;
        if (!data.serviceable) {
          setDeliveryEta({
            subtitle: "Delivery unavailable",
            title: data.city || "Your area",
            emoji: "⛔",
            unavailable: true,
          });
        } else {
          setDeliveryEta({
            subtitle: "Delivery to",
            title: data.estimatedDelivery || "12 mins",
            emoji: data.isHyperlocal ? "⚡" : "📦",
          });
        }
      } catch {
        /* keep default ETA */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shippingAddress.postalCode, userId]);

  const catalog = useMemo(() => buildDynamicShopCatalog(products), [products]);
  const chips = useMemo(() => buildQuickCommerceChips(catalog), [catalog]);

  useEffect(() => {
    if (params.category) setSelectedChip(params.category);
    else if (params.mode === "order-again") setSelectedChip("order-again");
  }, [params.category, params.mode]);

  useEffect(() => {
    if (chipFromProductApplied.current || !params.productId || products.length === 0) return;
    const product = products.find((p) => p.id === params.productId);
    if (!product) return;
    const resolved = resolveCategoryFromProduct(product, catalog);
    setSelectedChip(resolved.categorySlug);
    chipFromProductApplied.current = true;
  }, [params.productId, products, catalog]);

  const activeChip: QuickCommerceChip =
    chips.find((c) => c.id === selectedChip || c.slug === selectedChip) ||
    (isOrderAgainMode
      ? { id: "order-again", slug: "order-again", label: "Order Again", icon: "bag-handle-outline" }
      : chips[0]);

  const previouslyBought = useMemo(
    () => getPreviouslyBoughtProducts(products, orders),
    [products, orders]
  );

  const filteredProducts = useMemo(() => {
    let list = isOrderAgainMode
      ? previouslyBought
      : filterByQuickChip(products, activeChip);

    if (!isOrderAgainMode && activeChip.slug !== "for-you") {
      list = filterProductsByDynamicCategory(list, activeChip.slug);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          String(p.title || "").toLowerCase().includes(q) ||
          String(p.maison?.name || "").toLowerCase().includes(q)
      );
    }

    list = list.filter((p) => productMatchesShopFilters(p, filters));
    return sortProducts(list, filters.sortBy);
  }, [products, activeChip, search, previouslyBought, isOrderAgainMode, filters]);

  const filterOptions = useMemo(() => extractFilterOptions(products), [products]);
  const filterCount = activeFilterCount(filters);
  const sortActive = filters.sortBy !== "relevance";

  const handleFilterPress = (key: "sort" | "brand" | "color" | "gender") => {
    triggerHaptic("light");
    setFilterSheet(key);
  };

  const promoProduct = useMemo(() => pickPromoProduct(products), [products]);
  const cartTotal = cart.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const deliveryGap = getFreeDeliveryGap(cartTotal);
  const locationLine = shortAddressLine(shippingAddress);

  const sectionRows = useMemo(() => {
    const hasActiveFilters = filterCount > 0 || sortActive;

    if (isOrderAgainMode) {
      return [{ title: "Order again", items: previouslyBought }];
    }
    if (search.trim() || hasActiveFilters) {
      return [{ title: search.trim() ? "Search results" : "Filtered products", items: filteredProducts }];
    }
    if (activeChip.slug !== "for-you") {
      return [{ title: activeChip.label, items: filteredProducts }];
    }
    return catalog
      .filter((c) => c.slug !== "for-you" && c.count > 0)
      .slice(0, 8)
      .map((cat) => ({
        title: cat.label,
        items: filterProductsByDynamicCategory(products, cat.slug).slice(0, 10),
      }))
      .filter((s) => s.items.length > 0);
  }, [
    isOrderAgainMode,
    search,
    activeChip,
    filteredProducts,
    previouslyBought,
    catalog,
    products,
    filterCount,
    sortActive,
  ]);

  const openProduct = useCallback(
    (id: string) => {
      triggerHaptic("medium");
      router.push(`/product/${id}` as any);
    },
    [triggerHaptic]
  );

  const onWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        router.push("/login" as any);
        return;
      }
      await toggleWishlist(userId, productId);
    },
    [userId, toggleWishlist]
  );

  const isWishlisted = useCallback(
    (productId: string) =>
      wishlist.some((w) => w.id === productId || w.artifactId === productId),
    [wishlist]
  );

  const profileInitial = (activeProfile?.username || currentUser?.username || "U")
    .charAt(0)
    .toUpperCase();

  const onMicPress = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to use voice search.");
      router.push("/login" as any);
      return;
    }
    if (voiceSearching) return;
    setVoiceSearching(true);
    triggerHaptic("medium");
    try {
      const text = await recordAndTranscribeVoiceSearch();
      if (text) {
        setSearch(text);
        triggerHaptic("success");
      } else {
        Alert.alert("Voice search", "Could not understand audio. Try again or type your search.");
        searchRef.current?.focus();
      }
    } catch (e) {
      Alert.alert(
        "Voice search",
        e instanceof Error ? e.message : "Microphone unavailable. Use text search."
      );
      searchRef.current?.focus();
    } finally {
      setVoiceSearching(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerSub}>{deliveryEta.subtitle}</Text>
            <Text style={styles.headerTitle}>
              {deliveryEta.title} {deliveryEta.emoji || ""}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.walletPill}
              onPress={() => {
                if (!userId) router.push("/login" as any);
                else router.push("/account/wallet" as any);
              }}
            >
              <Lucide name="wallet-outline" size={16} color="#FFF" />
              <Text style={styles.walletText}>
                ₹{walletBalance === null ? "—" : walletBalance}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push("/account" as any)}
            >
              <Text style={styles.avatarText}>{profileInitial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationRow}
          activeOpacity={0.8}
          onPress={() => router.push("/settings/delivery" as any)}
        >
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLine}
          </Text>
          <Lucide name="chevron-down" size={16} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <Lucide name="search" size={18} color="#9E9E9E" />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search products, brands…"
            placeholderTextColor="#757575"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={onMicPress} hitSlop={8} disabled={voiceSearching}>
            {voiceSearching ? (
              <ActivityIndicator size="small" color="#9E9E9E" />
            ) : (
              <Lucide name="mic-outline" size={20} color="#9E9E9E" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {chips.map((chip) => {
            const active =
              selectedChip === chip.id ||
              selectedChip === chip.slug ||
              (chip.id === "all" && selectedChip === "for-you");
            return (
              <TouchableOpacity
                key={chip.id}
                style={styles.chipItem}
                onPress={() => {
                  triggerHaptic("light");
                  setSelectedChip(chip.id);
                }}
              >
                <View style={[styles.chipIconWrap, active && styles.chipIconWrapActive]}>
                  <Lucide
                    name={chip.icon as any}
                    size={20}
                    color={active ? "#FFFFFF" : "#9E9E9E"}
                  />
                </View>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {chip.label}
                </Text>
                {active && <View style={styles.chipUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: bottomPad + 72 }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.filterBar}>
          <FilterChipsRow
            onFilterPress={handleFilterPress}
            activeFilterCount={filterCount}
            sortActive={sortActive}
          />
        </View>

        {loadingProducts && products.length === 0 ? (
          <ActivityIndicator size="large" color="#5E35B1" style={{ marginTop: 40 }} />
        ) : (
          <>
            {promoProduct && !promoDismissed && (
              <TouchableOpacity
                style={styles.promoBanner}
                activeOpacity={0.95}
                onPress={() => openProduct(promoProduct.id)}
              >
                {promoProduct.images?.[0] ? (
                  <Image source={{ uri: promoProduct.images[0] }} style={styles.promoImage} />
                ) : (
                  <View style={[styles.promoImage, styles.promoPlaceholder]}>
                    <Text style={styles.promoPlaceholderText}>FEATURED</Text>
                  </View>
                )}
                <View style={styles.promoOverlay}>
                  <Text style={styles.promoTitle} numberOfLines={2}>
                    {promoProduct.title}
                  </Text>
                  <View style={styles.shopNowBtn}>
                    <Text style={styles.shopNowText}>Shop now</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.promoClose}
                  onPress={() => setPromoDismissed(true)}
                  hitSlop={12}
                >
                  <Lucide name="close" size={18} color="#FFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {previouslyBought.length > 0 && !isOrderAgainMode && activeChip.slug === "for-you" && !search && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Previously bought</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {previouslyBought.map((p) => (
                    <QuickShopProductCard
                      key={`prev-${p.id}`}
                      product={p}
                      wishlisted={isWishlisted(p.id)}
                      onPress={() => openProduct(p.id)}
                      onAdd={() => addToCart(p)}
                      onWishlist={() => onWishlist(p.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {isOrderAgainMode && previouslyBought.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No past orders yet</Text>
                <Text style={styles.emptySub}>Items you buy will show up here for quick reorder.</Text>
              </View>
            )}

            {sectionRows.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {section.items.map((p) => (
                      <QuickShopProductCard
                        key={p.id}
                        product={p}
                        wishlisted={isWishlisted(p.id)}
                        onPress={() => openProduct(p.id)}
                        onAdd={() => addToCart(p)}
                        onWishlist={() => onWishlist(p.id)}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptySub}>No products in this category yet.</Text>
                )}
              </View>
            ))}

            {filteredProducts.length === 0 && !loadingProducts && !isOrderAgainMode && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptySub}>Try another category or search term.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!deliveryDismissed && deliveryGap > 0 && (
        <View style={[styles.deliveryPill, { bottom: bottomPad + 4 }]}>
          <Lucide name="bicycle" size={18} color="#1565C0" />
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push("/cart" as any)}>
            <Text style={styles.deliveryText}>
              Free delivery on orders over ₹149 · Add ₹{deliveryGap} more ›
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeliveryDismissed(true)} hitSlop={8}>
            <Lucide name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <ShopQuickNav
        activeTab={isOrderAgainMode ? "order-again" : "home"}
        onExplorePress={() => router.push("/shop" as any)}
      />

      {filterSheet ? (
        <ShopFilterSheet
          visible={!!filterSheet}
          tab={filterSheet}
          filters={filters}
          brands={filterOptions.brands}
          colors={filterOptions.colors}
          genders={filterOptions.genders}
          onClose={() => setFilterSheet(null)}
          onApply={setFilters}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  headerSafe: { backgroundColor: "#000000", paddingHorizontal: 16, paddingBottom: 10 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerSub: { color: "#BDBDBD", fontSize: 12, fontWeight: "500" },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  walletText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#37474F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  locationText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: "#FFF", fontSize: 14, padding: 0 },
  searchDivider: { width: 1, height: 22, backgroundColor: "#555" },
  chipsRow: { paddingTop: 8, paddingBottom: 6, gap: 16, paddingRight: 16 },
  chipItem: { alignItems: "center", minWidth: 64, paddingBottom: 10 },
  chipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#3D3D3D",
  },
  chipIconWrapActive: {
    backgroundColor: "#5E35B1",
    borderColor: "#7E57C2",
  },
  chipLabel: { color: "#9E9E9E", fontSize: 11, fontWeight: "600", marginTop: 6 },
  chipLabelActive: { color: "#FFFFFF", fontWeight: "800" },
  chipUnderline: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  body: { flex: 1, backgroundColor: "#FFFFFF" },
  bodyContent: { paddingTop: 0 },
  filterBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  promoBanner: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 168,
    backgroundColor: "#1A1A2E",
  },
  promoImage: { width: "100%", height: "100%", resizeMode: "cover" },
  promoPlaceholder: { alignItems: "center", justifyContent: "center" },
  promoPlaceholderText: { color: "#FFF", fontWeight: "800", fontSize: 18 },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },
  promoTitle: { color: "#FFF", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  shopNowBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shopNowText: { color: "#111", fontWeight: "800", fontSize: 13 },
  promoClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginBottom: 18, paddingLeft: 12 },
  sectionTitle: { color: "#212121", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: { color: "#212121", fontSize: 16, fontWeight: "700" },
  emptySub: { color: "#757575", textAlign: "center", marginTop: 8, lineHeight: 20 },
  deliveryPill: {
    position: "absolute",
    left: 12,
    right: 88,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    elevation: 8,
  },
  deliveryText: { color: "#212121", fontSize: 12, fontWeight: "600" },
});
