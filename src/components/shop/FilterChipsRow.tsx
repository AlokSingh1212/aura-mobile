import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";

type FilterKey = "sort" | "brand" | "color" | "gender";

type Props = {
  onFilterPress?: (key: FilterKey) => void;
  activeFilterCount?: number;
  sortActive?: boolean;
  variant?: "light" | "dark";
};

const FILTERS: { key: FilterKey; label: string; icon?: string }[] = [
  { key: "sort", label: "Sort & Filter", icon: "options-outline" },
  { key: "brand", label: "Brand", icon: "chevron-down" },
  { key: "color", label: "Color", icon: "chevron-down" },
  { key: "gender", label: "Gender", icon: "chevron-down" },
];

export function FilterChipsRow({
  onFilterPress,
  activeFilterCount = 0,
  sortActive = false,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";

  return (
    <View style={[styles.wrap, isDark && styles.wrapDark]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {FILTERS.map((f) => {
          const isSortChip = f.key === "sort";
          const badgeCount = isSortChip
            ? activeFilterCount + (sortActive ? 1 : 0)
            : 0;
          const highlighted = isSortChip && (badgeCount > 0 || sortActive);

          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                isDark && styles.chipDark,
                highlighted && styles.chipActive,
              ]}
              onPress={() => onFilterPress?.(f.key)}
              activeOpacity={0.7}
            >
              {f.icon === "options-outline" && (
                <Lucide
                  name="options-outline"
                  size={15}
                  color={highlighted ? SHOP.primary : isDark ? "#FFF" : SHOP.text}
                  style={{ marginRight: 5 }}
                />
              )}
              <Text
                style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  highlighted && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
              {f.icon === "chevron-down" && (
                <Lucide
                  name="chevron-down"
                  size={14}
                  color={isDark ? "#E0E0E0" : SHOP.textSecondary}
                  style={{ marginLeft: 3 }}
                />
              )}
              {badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: SHOP.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  wrapDark: {
    backgroundColor: "#1A1A1A",
    borderBottomColor: "#333",
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SHOP.surface,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    minHeight: 38,
  },
  chipDark: {
    backgroundColor: "#2A2A2A",
    borderColor: "#555",
  },
  chipActive: {
    borderColor: SHOP.primary,
    backgroundColor: SHOP.wowBlueLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: SHOP.text,
  },
  chipTextDark: {
    color: "#FFFFFF",
  },
  chipTextActive: {
    color: SHOP.primary,
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SHOP.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
