import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";

const { width } = Dimensions.get("window");

export interface CheckoutSuccessProps {
  visible: boolean;
  onClose: () => void;
  onTrackOrder: () => void;
  orderNumber?: string;
  amount?: number;
  itemCount?: number;
}

export const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
  visible,
  onClose,
  onTrackOrder,
  orderNumber = "ORD-2026-0001",
  amount = 0,
  itemCount = 1,
}) => {
  const { formatPrice } = useStore();
  const [checkScale] = useState(new Animated.Value(0));
  const [fadeIn] = useState(new Animated.Value(0));
  const [slideUp] = useState(new Animated.Value(60));
  const [ringScale] = useState(new Animated.Value(0));
  const [ringOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // Reset animations
      checkScale.setValue(0);
      fadeIn.setValue(0);
      slideUp.setValue(60);
      ringScale.setValue(0);
      ringOpacity.setValue(1);

      // Staggered entrance animation sequence
      Animated.sequence([
        // 1. Ring pulse + checkmark bounce-in
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            tension: 60,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 2.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // 2. Content fade & slide
        Animated.parallel([
          Animated.timing(fadeIn, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(slideUp, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const estimatedDays = 3 + Math.floor(Math.random() * 4); // 3-6 days

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(8, 4, 21, 0.97)", "rgba(12, 7, 33, 0.98)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.content}>
          {/* Animated Checkmark */}
          <View style={styles.checkContainer}>
            {/* Expanding ring pulse */}
            <Animated.View
              style={[
                styles.ringPulse,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                },
              ]}
            />

            {/* Checkmark circle */}
            <Animated.View
              style={[
                styles.checkCircle,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <LinearGradient
                colors={["#00f5ff", "#00d4aa"]}
                style={styles.checkGradient}
              >
                <Lucide name="checkmark" size={44} color="#080415" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Success Message */}
          <Animated.View
            style={[
              styles.textSection,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <Text style={styles.successTitle}>Payment Confirmed</Text>
            <Text style={styles.successSub}>
              Your order has been secured and authenticated
            </Text>

            {/* Order Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Reference</Text>
                <Text style={styles.detailVal}>{orderNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items Secured</Text>
                <Text style={styles.detailVal}>{itemCount} {itemCount === 1 ? "Artifact" : "Artifacts"}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Charged</Text>
                <Text style={[styles.detailVal, { color: "#00f5ff" }]}>
                  {formatPrice(amount)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Delivery</Text>
                <Text style={styles.detailVal}>{estimatedDays} Business Days</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Payment Verified · Customs Cleared</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.trackBtn} onPress={onTrackOrder} activeOpacity={0.9}>
                <Lucide name="location" size={18} color="#080415" />
                <Text style={styles.trackBtnText}>Track Order</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueBtn} onPress={onClose} activeOpacity={0.9}>
                <Text style={styles.continueBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: width - 48,
    alignItems: "center",
    gap: 32,
  },
  checkContainer: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPulse: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#00f5ff",
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  checkGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textSection: {
    alignItems: "center",
    width: "100%",
    gap: 16,
  },
  successTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  successSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13.5,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "rgba(11, 7, 30, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailVal: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00f5ff",
  },
  statusText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  trackBtnText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  continueBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  continueBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
