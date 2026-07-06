import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CATEGORIES_LAYOUT } from "@/constants/categoriesLayout";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function ShopSectionHeading({ title }: Props) {
  return (
    <Text style={styles.heading}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: CATEGORIES_LAYOUT.sectionTitleSize,
    fontWeight: "700",
    color: "#000",
    marginBottom: CATEGORIES_LAYOUT.sectionTitleMarginBottom,
  },
});

export function ShopSection({ title, children }: Props) {
  return (
    <View style={sectionStyles.wrap}>
      <ShopSectionHeading title={title} />
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    marginBottom: CATEGORIES_LAYOUT.sectionGap,
  },
});
