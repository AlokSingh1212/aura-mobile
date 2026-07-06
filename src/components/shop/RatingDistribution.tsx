import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SHOP } from "@/theme/shopTheme";

type Props = {
  distribution: Record<number, number>;
  total: number;
};

export function RatingDistribution({ distribution, total }: Props) {
  const max = Math.max(...Object.values(distribution), 1);

  return (
    <View style={styles.wrap}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const barPct = total > 0 ? (count / max) * 100 : 0;
        return (
          <View key={star} style={styles.row}>
            <Text style={styles.starLabel}>{star} ★</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${barPct}%` }]} />
            </View>
            <Text style={styles.count}>{count > 0 ? Math.round(pct) : 0}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, marginLeft: 16, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  starLabel: { width: 28, fontSize: 11, color: SHOP.textSecondary, fontWeight: "600" },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: SHOP.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: SHOP.green, borderRadius: 3 },
  count: { width: 28, fontSize: 10, color: SHOP.textMuted, textAlign: "right" },
});
