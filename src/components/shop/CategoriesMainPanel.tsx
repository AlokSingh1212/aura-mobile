import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";
import { SHOP_CATEGORIES, AURA_DISCOVERY_TILES } from "@/constants/brandCategories";
import {
  getSubcategoriesForShopCategory,
  productsForSubcategory,
  type ShopSubcategory,
} from "@/lib/shopCategoryMap";
import { ShopSection } from "@/components/shop/ShopSection";
import { PopularStoresRow, ProductLaunchGrid } from "@/components/shop/CategoriesContentBlocks";
import { useStore } from "@/store/useStore";

type Props = {
  products: any[];
  selectedSlug: string;
  onViewAll: (slug: string, subcategoryId?: string) => void;
};

const FOR_YOU_MAX_SECTIONS = 8;

/** Right pane: subcategory sections with live products for the selected category. */
export function CategoriesMainPanel({ products, selectedSlug, onViewAll }: Props) {
  const cat = SHOP_CATEGORIES.find((c) => c.slug === selectedSlug) || SHOP_CATEGORIES[0];
  const subcategories = getSubcategoriesForShopCategory(cat.name);

  const sections = useMemo(() => {
    const mapped = subcategories.map((sub) => ({
      sub,
      items: productsForSubcategory(products, sub, cat.name),
    }));

    if (cat.name === "For You") {
      return mapped.filter((row) => row.items.length > 0).slice(0, FOR_YOU_MAX_SECTIONS);
    }

    return mapped;
  }, [subcategories, products, cat.name]);

  return (
    <View style={styles.panel}>
      <ShopSection title="Popular Store">
        <PopularStoresRow />
      </ShopSection>

      {sections.map(({ sub, items }) => (
        <SubcategorySection
          key={`${sub.productCategoryId}-${sub.id}`}
          sub={sub}
          products={items}
          onViewAll={() => onViewAll(cat.slug, sub.id)}
        />
      ))}

      {sections.every((s) => s.items.length === 0) && cat.name !== "For You" && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptySub}>
            Products listed under {cat.name} will appear in each subcategory here.
          </Text>
        </View>
      )}

      <ShopSection title="Have you tried?">
        <HaveYouTriedRow />
      </ShopSection>
    </View>
  );
}

function SubcategorySection({
  sub,
  products,
  onViewAll,
}: {
  sub: ShopSubcategory;
  products: any[];
  onViewAll: () => void;
}) {
  return (
    <ShopSection title={sub.label}>
      {products.length > 0 ? (
        <ProductLaunchGrid products={products} onViewAll={onViewAll} />
      ) : (
        <TouchableEmptySubcategory label={sub.label} onViewAll={onViewAll} />
      )}
    </ShopSection>
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
