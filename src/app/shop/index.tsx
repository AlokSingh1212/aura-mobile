import React, { useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { CategoriesHubHeader } from "@/components/shop/CategoriesHubHeader";
import { CategorySidebar } from "@/components/shop/CategorySidebar";
import { CategoriesMainPanel } from "@/components/shop/CategoriesMainPanel";
import { AuraBottomNav, getAuraBottomNavHeight } from "@/components/shop/AuraBottomNav";
import { getContentWidth } from "@/constants/categoriesLayout";
import { SHOP } from "@/theme/shopTheme";
import { useStore } from "@/store/useStore";

export default function ShopHubScreen() {
  const { products, loadingProducts, fetchProducts, triggerHaptic } = useStore();
  const insets = useSafeAreaInsets();
  const bottomNavPad = getAuraBottomNavHeight(insets.bottom);
  const [selectedSlug, setSelectedSlug] = React.useState("for-you");
  const mainScrollRef = useRef<ScrollView>(null);
  const { width: screenW } = useWindowDimensions();
  const contentW = getContentWidth(screenW);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCategorySelect = (slug: string) => {
    triggerHaptic("light");
    setSelectedSlug(slug);
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openCategoryListing = (slug: string, subcategoryId?: string) => {
    triggerHaptic("light");
    const query = subcategoryId ? `?subcategory=${encodeURIComponent(subcategoryId)}` : "";
    router.push(`/shop/category/${slug}${query}` as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={[styles.safe, { marginBottom: bottomNavPad }]} edges={["top"]}>
        <CategoriesHubHeader onSearchPress={() => openCategoryListing("for-you")} />

        <View style={styles.split}>
          <CategorySidebar selectedSlug={selectedSlug} onSelect={handleCategorySelect} />

          <ScrollView
            ref={mainScrollRef}
            style={[styles.main, { width: contentW }]}
            contentContainerStyle={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingProducts && products.length === 0 ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={SHOP.primary} />
              </View>
            ) : (
              <CategoriesMainPanel
                products={products}
                selectedSlug={selectedSlug}
                onViewAll={openCategoryListing}
              />
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
      <AuraBottomNav activeTab="products" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safe: {
    flex: 1,
  },
  split: {
    flex: 1,
    flexDirection: "row",
  },
  main: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContent: {
    flexGrow: 1,
  },
  loading: {
    padding: 48,
    alignItems: "center",
  },
});
