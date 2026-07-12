import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { CATEGORIES_LAYOUT, getSidebarWidth } from "@/constants/categoriesLayout";
import { SHOP_CATEGORIES } from "@/constants/brandCategories";
import { SHOP } from "@/theme/shopTheme";
import type { DynamicCategory } from "@/lib/dynamicShopCatalog";

type Props = {
  selectedSlug: string;
  onSelect: (slug: string) => void;
  /** When set, sidebar is built from live product catalog. */
  dynamicCategories?: DynamicCategory[];
  variant?: "light" | "dark";
};

export function CategorySidebar({ selectedSlug, onSelect, dynamicCategories, variant = "light" }: Props) {
  const isDark = variant === "dark";
  const { width: screenW } = useWindowDimensions();
  const sidebarW = getSidebarWidth(screenW);

  const categories =
    dynamicCategories?.map((c) => ({
      slug: c.slug,
      name: c.label,
      icon: c.icon,
      tint: c.tint,
    })) ||
    SHOP_CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      tint: c.tint,
    }));

  return (
    <View style={[styles.container, { width: sidebarW }, isDark && styles.containerDark]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat, index) => {
          const active = selectedSlug === cat.slug;
          const imgSize = active
            ? CATEGORIES_LAYOUT.categoryImageActive
            : CATEGORIES_LAYOUT.categoryImageSize;
          const iconColor =
            active && cat.slug === "for-you"
              ? "#6C3FC5"
              : active
                ? SHOP.primary
                : "#616161";

          return (
            <TouchableOpacity
              key={cat.slug}
              style={[
                styles.item,
                active && styles.itemActive,
                isDark && styles.itemDark,
                active && isDark && styles.itemActiveDark,
              ]}
              onPress={() => onSelect(cat.slug)}
              activeOpacity={0.85}
            >
              {active && <View style={styles.activeBar} />}
              <View
                style={[
                  styles.imageWrap,
                  {
                    width: imgSize,
                    height: imgSize,
                    borderRadius: CATEGORIES_LAYOUT.categoryImageRadius,
                    backgroundColor: active ? "#FFFFFF" : cat.tint || "#FFFFFF",
                  },
                ]}
              >
                <Lucide name={cat.icon as any} size={imgSize * 0.48} color={iconColor} />
              </View>
              <Text
                style={[styles.label, active && styles.labelActive, isDark && styles.labelDark, active && isDark && styles.labelActiveDark]}
                numberOfLines={3}
              >
                {cat.name}
              </Text>
              {index < categories.length - 1 && <View style={styles.divider} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: CATEGORIES_LAYOUT.sidebarBg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: CATEGORIES_LAYOUT.sidebarDivider,
    flexShrink: 0,
  },
  containerDark: {
    backgroundColor: "#1E1E1E",
    borderRightColor: "#333",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingVertical: CATEGORIES_LAYOUT.sidebarPadding,
    paddingBottom: 100,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: CATEGORIES_LAYOUT.categoryItemHeight,
    position: "relative",
    backgroundColor: CATEGORIES_LAYOUT.sidebarBg,
  },
  itemActive: {
    backgroundColor: CATEGORIES_LAYOUT.activeBg,
  },
  itemDark: {
    backgroundColor: "#1E1E1E",
  },
  itemActiveDark: {
    backgroundColor: "#2A2A2A",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: CATEGORIES_LAYOUT.activeIndicatorWidth,
    backgroundColor: SHOP.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: CATEGORIES_LAYOUT.categoryGap,
  },
  label: {
    fontSize: CATEGORIES_LAYOUT.categoryLabelSize,
    fontWeight: "500",
    color: "#616161",
    textAlign: "center",
    lineHeight: 13,
  },
  labelActive: {
    color: SHOP.primary,
    fontWeight: "700",
  },
  labelDark: {
    color: "#9E9E9E",
  },
  labelActiveDark: {
    color: "#C6FF00",
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDDDDD",
  },
});
