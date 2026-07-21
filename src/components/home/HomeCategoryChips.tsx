import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

const CATEGORY_CHIPS = [
  "For You",
  "Following",
  "Fashion",
  "Beauty",
  "Tech",
  "Fitness",
  "Luxury",
  "Trending",
  "Local",
] as const;

type HomeCategoryChipsProps = {
  selectedCategory: string;
  triggerHaptic: (style: any) => void;
  onSelectCategory: (chip: string) => void;
};

export function HomeCategoryChips({ selectedCategory, triggerHaptic, onSelectCategory }: HomeCategoryChipsProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F5F5F7",
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip;
          return (
            <TouchableOpacity
              key={chip}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? "#111111" : "#F5F5F7",
                borderWidth: 1,
                borderColor: isSelected ? "#111111" : "#EAEAEA",
              }}
              onPress={() => {
                triggerHaptic("light");
                onSelectCategory(chip);
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: isSelected ? "700" : "600", color: isSelected ? "#FFFFFF" : "#111111" }}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
