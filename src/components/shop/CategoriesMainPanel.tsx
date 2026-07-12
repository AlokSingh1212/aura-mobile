import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";
import { AURA_DISCOVERY_TILES } from "@/constants/brandCategories";
import {
  buildDynamicShopCatalog,
  filterProductsByDynamicCategory,
  type DynamicCategory,
} from "@/lib/dynamicShopCatalog";
import { ShopSection } from "@/components/shop/ShopSection";
import { PopularStoresRow, ProductLaunchGrid } from "@/components/shop/CategoriesContentBlocks";
import { useStore } from "@/store/useStore";

type Props = {
  products: any[];
  selectedSlug: string;
  onViewAll: (slug: string, subcategoryId?: string) => void;
};

/** Right pane: dynamic subcategory sections from live product catalog. */
export function CategoriesMainPanel({ products, selectedSlug, onViewAll }: Props) {
  const catalog = useMemo(() => buildDynamicShopCatalog(products), [products]);
  const cat: DynamicCategory =
    catalog.find((c) => c.slug === selectedSlug) || catalog[0];

  const sections = useMemo(() => {
    if (cat.slug === "for-you") {
      return catalog
        .filter((c) => c.slug !== "for-you" && c.count > 0)
        .slice(0, 8)
        .flatMap((root) => {
          const topSubs = root.subcategories.slice(0, 2);
          return topSubs.map((sub) => ({
            key: `${root.slug}-${sub.id}`,
            title: `${root.label} · ${sub.label}`,
            slug: root.slug,
            subId: sub.id,
            items: filterProductsByDynamicCategory(
              products,
              root.slug,
              sub.id === "all" ? undefined : sub.id
            ).slice(0, 6),
          }));
        })
        .filter((row) => row.items.length > 0);
    }

    return cat.subcategories.map((sub) => ({
      key: `${cat.slug}-${sub.id}`,
      title: sub.label,
      slug: cat.slug,
      subId: sub.id,
      items: filterProductsByDynamicCategory(
        products,
        cat.slug,
        sub.id === "all" ? undefined : sub.id
      ),
    }));
  }, [cat, catalog, products]);

  return (
    <View style={styles.panel}>
      <ShopSection title="Popular Store">
        <PopularStoresRow />
      </ShopSection>

      <TouchableOpacity
        style={styles.allProductsBanner}
        onPress={() => router.push("/shop/all-products" as any)}
        activeOpacity={0.9}
      >
        <Text style={styles.allProductsTitle}>Browse all products</Text>
        <Text style={styles.allProductsSub}>Quick shop · {products.length} items</Text>
      </TouchableOpacity>

      {sections.map(({ key, title, slug, subId, items }) => (
        <ShopSection key={key} title={title}>
          {items.length > 0 ? (
            <ProductLaunchGrid
              products={items}
              onViewAll={() => onViewAll(slug, subId === "all" ? undefined : subId)}
            />
          ) : (
            <TouchableEmptySubcategory label={title} onViewAll={() => onViewAll(slug, subId)} />
          )}
        </ShopSection>
      ))}

      {sections.every((s) => s.items.length === 0) && cat.slug !== "for-you" && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptySub}>
            Products listed under {cat.label} will appear in each subcategory here.
          </Text>
        </View>
      )}

      <ShopSection title="Have you tried?">
        <HaveYouTriedRow />
      </ShopSection>
    </View>
  );
}

function TouchableEmptySubcategory({
  label,
  onViewAll,
}: {
  label: string;
  onViewAll: () => void;
}) {
  const { triggerHaptic } = useStore();
  return (
    <TouchableOpacity
      style={styles.subEmpty}
      onPress={() => {
        triggerHaptic("light");
        onViewAll();
      }}
      activeOpacity={0.85}
    >
      <Text style={styles.subEmptyText}>Browse {label}</Text>
      <Text style={styles.subEmptyLink}>View All →</Text>
    </TouchableOpacity>
  );
}

function HaveYouTriedRow() {
  const { triggerHaptic } = useStore();

  const openTile = (id: string) => {
    triggerHaptic("light");
    if (id === "live") {
      router.push({ pathname: "/", params: { activeTab: "reels", openCamera: "true" } } as any);
    } else if (id === "maison") {
      router.push("/maison/business-suite" as any);
    } else if (id === "reels") {
      router.push({ pathname: "/", params: { activeTab: "reels" } } as any);
    }
  };

  return (
    <View style={styles.brandsRow}>
      {AURA_DISCOVERY_TILES.map((b) => (
        <TouchableOpacity
          key={b.id}
          style={styles.brandTile}
          activeOpacity={0.85}
          onPress={() => openTile(b.id)}
        >
          <View style={[styles.brandLogo, { backgroundColor: b.bg }]}>
            <Text style={styles.brandInitial}>{b.short}</Text>
          </View>
          <Text style={styles.brandName} numberOfLines={1}>
            {b.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    padding: CATEGORIES_LAYOUT.contentPadding,
    paddingBottom: 100,
    backgroundColor: "#FFFFFF",
  },
  allProductsBanner: {
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  allProductsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  allProductsSub: {
    color: "#C6FF00",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  brandsRow: {
    flexDirection: "row",
    gap: CATEGORIES_LAYOUT.cardGap,
  },
  brandTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: CATEGORIES_LAYOUT.storeCardBg,
    borderRadius: CATEGORIES_LAYOUT.storeCardRadius,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brandInitial: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  brandName: {
    fontSize: CATEGORIES_LAYOUT.productNameSize,
    fontWeight: "500",
    color: "#212121",
    textAlign: "center",
  },
  empty: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
    lineHeight: 18,
  },
  subEmpty: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: CATEGORIES_LAYOUT.storeCardBg,
    borderRadius: CATEGORIES_LAYOUT.storeCardRadius,
  },
  subEmptyText: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  subEmptyLink: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#2874F0",
  },
});
