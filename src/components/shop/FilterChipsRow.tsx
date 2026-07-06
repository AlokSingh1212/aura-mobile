import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";

type FilterKey = "sort" | "brand" | "color" | "gender";

type Props = {
  onFilterPress?: (key: FilterKey) => void;
};

const FILTERS: { key: FilterKey; label: string; icon?: string }[] = [
  { key: "sort", label: "Sort & Filter", icon: "options-outline" },
  { key: "brand", label: "Brand", icon: "chevron-down" },
  { key: "color", label: "Color", icon: "chevron-down" },
  { key: "gender", label: "Gender", icon: "chevron-down" },
];

export function FilterChipsRow({ onFilterPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={styles.chip}
          onPress={() => onFilterPress?.(f.key)}
          activeOpacity={0.7}
        >
          {f.icon === "options-outline" && (
            <Lucide name="options-outline" size={14} color={SHOP.text} style={{ marginRight: 4 }} />
          )}
          <Text style={styles.chipText}>{f.label}</Text>
          {f.icon === "chevron-down" && (
            <Lucide name="chevron-down" size={14} color={SHOP.textSecondary} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SHOP.bg,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: SHOP.text,
  },
});
