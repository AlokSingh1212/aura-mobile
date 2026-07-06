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

type Props = {
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

export function CategorySidebar({ selectedSlug, onSelect }: Props) {
  const { width: screenW } = useWindowDimensions();
  const sidebarW = getSidebarWidth(screenW);

  return (
    <View style={[styles.container, { width: sidebarW }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SHOP_CATEGORIES.map((cat, index) => {
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
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={3}
              >
                {cat.name}
              </Text>
              {index < SHOP_CATEGORIES.length - 1 && <View style={styles.divider} />}
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
  divider: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDDDDD",
  },
});
