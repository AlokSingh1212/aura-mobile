import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { FilterChipsRow } from "@/components/shop/FilterChipsRow";
import { ShopFilterSheet } from "@/components/shop/ShopFilterSheet";
import { ProductListCard } from "@/components/shop/ProductListCard";
import { AuraBottomNav } from "@/components/shop/AuraBottomNav";
import {
  buildDynamicShopCatalog,
  filterProductsByDynamicCategory,
} from "@/lib/dynamicShopCatalog";
import {
  findSubcategoryById,
} from "@/lib/shopCategoryMap";
import { SHOP } from "@/theme/shopTheme";
import { formatINR, getBankOfferPrice, getDiscountPercent } from "@/lib/shopPricing";
import {
  DEFAULT_SHOP_FILTERS,
  extractFilterOptions,
  productMatchesShopFilters,
  sortProducts,
  activeFilterCount,
  type ShopFilters,
} from "@/lib/shopFilters";
import { useStore } from "@/store/useStore";

const { width } = Dimensions.get("window");

export default function CategoryListingScreen() {
  const { slug, q, subcategory: subcategoryParam } = useLocalSearchParams<{
    slug: string;
    q?: string;
    subcategory?: string;
  }>();
  const {
    products,
    loadingProducts,
    fetchProducts,
    triggerHaptic,
    toggleWishlist,
    wishlist,
    formatPrice,
    currentUser,
    activeProfile,
  } = useStore();

  const userId = currentUser?.id || activeProfile?.userId || "";

  const [searchQuery, setSearchQuery] = useState(q || "");
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_SHOP_FILTERS);
  const [filterSheet, setFilterSheet] = useState<"sort" | "brand" | "color" | "gender" | null>(null);

  const category = useMemo(() => {
    const catalog = buildDynamicShopCatalog(products);
    return catalog.find((c) => c.slug === (slug || "for-you")) || catalog[0];
  }, [products, slug]);
  const categoryName = category?.label || "For You";
  const subcategoryId = typeof subcategoryParam === "string" ? subcategoryParam : undefined;
  const subcategory = subcategoryId
    ? findSubcategoryById(subcategoryId, categoryName)
    : undefined;
  const listTitle = subcategory
    ? `${categoryName} · ${subcategory.label}`
    : categoryName;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (q) setSearchQuery(q);
  }, [q]);

  const categoryProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = filterProductsByDynamicCategory(
      products,
      slug || "for-you",
      subcategory?.id
    );
    if (query) {
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(query) ||
          (p.maison?.name || "").toLowerCase().includes(query)
      );
    }
    return list;
  }, [products, slug, subcategory, searchQuery]);

  const filterOptions = useMemo(
    () => extractFilterOptions(categoryProducts),
    [categoryProducts]
  );

  const filtered = useMemo(() => {
    let list = categoryProducts.filter((p) => productMatchesShopFilters(p, filters));
    return sortProducts(list, filters.sortBy);
  }, [categoryProducts, filters]);

  const filterCount = activeFilterCount(filters);
  const sortActive = filters.sortBy !== "relevance";

  const featured = filtered[0];

  const handleFilter = (key: string) => {
    triggerHaptic("light");
    if (key === "sort" || key === "brand" || key === "color" || key === "gender") {
      setFilterSheet(key);
    }
  };

  const renderHeader = () => {
    if (!featured) return null;
    const discount = getDiscountPercent(featured);
    const bank = getBankOfferPrice(featured);
    return (
      <View style={styles.adBanner}>
        <View style={styles.adTag}>
          <Text style={styles.adTagText}>AD</Text>
        </View>
        <View style={styles.adContent}>
          <Text style={styles.adTitle}>
            Min. {discount}% Off on {listTitle}
          </Text>
          {featured.images?.[0] ? (
            <Image source={{ uri: featured.images[0] }} style={styles.adThumb} />
          ) : null}
        </View>
        <ScrollProductMini product={featured} bankPrice={bank} formatPrice={formatPrice} />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ShopHeader
          showBack
          showSearch
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <FilterChipsRow
          onFilterPress={handleFilter}
          activeFilterCount={filterCount}
          sortActive={sortActive}
        />
        {subcategory ? (
          <View style={styles.subcategoryBar}>
            <Text style={styles.subcategoryLabel}>{listTitle}</Text>
          </View>
        ) : null}

        {loadingProducts && products.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={SHOP.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            ListHeaderComponent={renderHeader}
            renderItem={({ item, index }) => (
              <View style={styles.col}>
                <ProductListCard
                  product={item}
                  isAd={index % 5 === 0}
                  isWishlisted={wishlist.some((w: any) => w.id === item.id)}
                  onWishlist={() => userId && toggleWishlist(userId, item.id)}
                  onPress={() => {
                    triggerHaptic("medium");
                    router.push(`/product/${item.id}` as any);
                  }}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {subcategory
                    ? `No products in ${subcategory.label} yet.`
                    : "No products found."}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
      <AuraBottomNav activeTab="products" />

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

function ScrollProductMini({
  product,
  bankPrice,
  formatPrice,
}: {
  product: any;
  bankPrice: number;
  formatPrice?: (n: number) => string;
}) {
  const discount = getDiscountPercent(product);
  return (
    <View style={styles.miniCard}>
      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.miniImg} />
      ) : null}
      <View style={styles.miniInfo}>
        <Text style={styles.miniRating}>{product.rating?.toFixed(1) || "4.3"} ★</Text>
        <Text style={styles.miniTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={styles.miniDiscount}>{discount}%</Text>
        <Text style={styles.miniWow}>
          WOW! {formatPrice ? formatPrice(bankPrice) : formatINR(bankPrice)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHOP.bg },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 8, paddingBottom: 100 },
  row: { gap: 8, paddingHorizontal: 4 },
  col: { flex: 1, maxWidth: (width - 24) / 2 },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { color: SHOP.textSecondary },
  subcategoryBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: SHOP.bg,
  },
  subcategoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SHOP.text,
  },
  adBanner: {
    margin: 8,
    backgroundColor: SHOP.wowBlueLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  adTag: {
    alignSelf: "flex-start",
    backgroundColor: SHOP.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 8,
  },
  adTagText: { fontSize: 10, fontWeight: "700", color: SHOP.adTag },
  adContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  adTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: SHOP.text },
  adThumb: { width: 80, height: 60, borderRadius: 8 },
  miniCard: {
    flexDirection: "row",
    backgroundColor: SHOP.bg,
    borderRadius: 8,
    marginTop: 12,
    padding: 8,
    gap: 8,
  },
  miniImg: { width: 56, height: 56, borderRadius: 6 },
  miniInfo: { flex: 1 },
  miniRating: { fontSize: 11, color: SHOP.green, fontWeight: "600" },
  miniTitle: { fontSize: 12, color: SHOP.text, fontWeight: "600" },
  miniDiscount: { fontSize: 11, color: SHOP.green, fontWeight: "700" },
  miniWow: { fontSize: 12, color: SHOP.primary, fontWeight: "700" },
});
