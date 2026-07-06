import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SHOP } from "@/theme/shopTheme";
import type { CheckoutTotals } from "@/lib/shopCheckout";

type Props = {
  totals: CheckoutTotals;
  itemCount: number;
  formatPrice: (n: number) => string;
};

export function CheckoutPriceDetails({ totals, itemCount, formatPrice }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price Details</Text>
      <Row label={`Price (${itemCount} item${itemCount > 1 ? "s" : ""})`} value={formatPrice(totals.mrp || totals.sellingPrice)} />
      {totals.productDiscount > 0 && (
        <Row label="Discount" value={`-${formatPrice(totals.productDiscount)}`} green />
      )}
      {totals.couponDiscount > 0 && (
        <Row label="Coupon discount" value={`-${formatPrice(totals.couponDiscount)}`} green />
      )}
      {totals.bankDiscount > 0 && (
        <Row label="Bank offer" value={`-${formatPrice(totals.bankDiscount)}`} green />
      )}
      <Row
        label="Delivery Charges"
        value={totals.deliveryFee === 0 ? "FREE" : formatPrice(totals.deliveryFee)}
        green={totals.deliveryFee === 0}
      />
      {totals.handlingFee > 0 && (
        <Row label="Payment handling fee" value={formatPrice(totals.handlingFee)} />
      )}
      <View style={styles.divider} />
      <Row label="Total Amount" value={formatPrice(totals.total)} bold />
      {totals.savings > 0 && (
        <View style={styles.savingsBar}>
          <Text style={styles.savingsText}>
            You will save {formatPrice(totals.savings)} on this order
          </Text>
        </View>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  green,
  bold,
}: {
  label: string;
  value: string;
  green?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, green && styles.green, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SHOP.bg,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
  },
  title: { fontSize: 15, fontWeight: "700", color: SHOP.text, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  label: { fontSize: 13, color: SHOP.textSecondary },
  value: { fontSize: 13, color: SHOP.text, fontWeight: "600" },
  green: { color: SHOP.green },
  bold: { fontWeight: "800", color: SHOP.text, fontSize: 15 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SHOP.border,
    marginVertical: 8,
  },
  savingsBar: {
    marginTop: 10,
    backgroundColor: SHOP.greenLight,
    padding: 10,
    borderRadius: 6,
  },
  savingsText: { color: SHOP.green, fontWeight: "700", fontSize: 13 },
});
