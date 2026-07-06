import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";

const STEPS = ["Address", "Order Summary", "Payment"];

type Props = {
  currentStep: number;
};

export function CheckoutStepper({ currentStep }: Props) {
  return (
    <View style={styles.wrap}>
      {STEPS.map((label, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <View key={label} style={styles.stepCol}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                {done ? (
                  <Lucide name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Text style={[styles.num, active && styles.numActive]}>{index + 1}</Text>
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: SHOP.bg,
  },
  stepCol: {
    flex: 1,
    alignItems: "center",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SHOP.surface,
    borderWidth: 2,
    borderColor: SHOP.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  circleDone: {
    backgroundColor: SHOP.primary,
    borderColor: SHOP.primary,
  },
  circleActive: {
    borderColor: SHOP.primary,
    backgroundColor: SHOP.primary,
  },
  num: {
    fontSize: 12,
    fontWeight: "700",
    color: SHOP.textSecondary,
  },
  numActive: {
    color: "#FFF",
  },
  line: {
    position: "absolute",
    left: "55%",
    right: "-45%",
    height: 2,
    backgroundColor: SHOP.border,
    top: 13,
  },
  lineDone: {
    backgroundColor: SHOP.primary,
  },
  label: {
    fontSize: 10,
    color: SHOP.textSecondary,
    marginTop: 6,
    fontWeight: "500",
    textAlign: "center",
  },
  labelActive: {
    color: SHOP.primary,
    fontWeight: "700",
  },
});
