import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import {
  fetchReturnDetail,
  statusLabel,
  refundStatusLabel,
  type ReturnRequestDetail,
} from "@/lib/returnsApi";
import { SHOP } from "@/theme/shopTheme";

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { triggerHaptic } = useStore();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ReturnRequestDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setDetail(await fetchReturnDetail(id));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SHOP.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Return request not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const img = detail.item?.images?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Lucide name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Return details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Lucide
            name={detail.refundStatus === "COMPLETED" ? "checkmark-circle" : "time-outline"}
            size={32}
            color={detail.refundStatus === "COMPLETED" ? "#2E7D32" : "#F9A825"}
          />
          <Text style={styles.statusTitle}>{statusLabel(detail.status)}</Text>
          <Text style={styles.statusSub}>{refundStatusLabel(detail.refundStatus)}</Text>
          {detail.refundAmount != null && (
            <Text style={styles.refundAmt}>
              ₹{Math.round(detail.refundAmount).toLocaleString("en-IN")}{" "}
              {detail.refundMethod === "HYBRID"
                ? "(Wallet + original payment)"
                : detail.refundMethod === "WALLET"
                  ? "→ AURA Wallet"
                  : ""}
            </Text>
          )}
        </View>

        {detail.item && (
          <View style={styles.itemCard}>
            {img ? (
              <Image source={{ uri: img }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]}>
                <Lucide name="bag-outline" size={22} color="#999" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{detail.item.title}</Text>
              <Text style={styles.itemMeta}>
                Qty {detail.item.quantity} · ₹{detail.item.price}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{detail.type === "EXCHANGE" ? "Exchange" : "Return"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reason</Text>
          <Text style={styles.value}>{detail.reason}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Order</Text>
          <Text style={styles.value}>{detail.order.orderNumber || detail.order.id.slice(0, 8)}</Text>
        </View>

        {detail.pickupLabelUrl && (
          <TouchableOpacity
            style={styles.labelBtn}
            onPress={() => {
              triggerHaptic("light");
              Linking.openURL(detail.pickupLabelUrl!).catch(() =>
                Alert.alert("Pickup label", "Your free return pickup is scheduled. Our courier will contact you.")
              );
            }}
          >
            <Lucide name="download-outline" size={18} color="#5E35B1" />
            <Text style={styles.labelBtnText}>Download return pickup label</Text>
          </TouchableOpacity>
        )}

        {detail.type === "EXCHANGE" && detail.refundStatus === "COMPLETED" && (
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/shop/all-products" as any)}
          >
            <Text style={styles.shopBtnText}>Shop again with wallet credit</Text>
          </TouchableOpacity>
        )}

        {detail.refundStatus === "COMPLETED" && (
          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => router.push("/account/wallet" as any)}
          >
            <Lucide name="wallet-outline" size={18} color="#FFF" />
            <Text style={styles.walletBtnText}>View AURA Wallet</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How automatic refunds work</Text>
          <Text style={styles.infoText}>
            1. Your return is approved instantly{"\n"}
            2. Refund is credited to your AURA Wallet immediately{"\n"}
            3. If you paid by UPI/card, Razorpay refund runs in parallel (5–7 days){"\n"}
            4. Use wallet balance on your next order
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { fontSize: 16, color: "#616161" },
  link: { color: "#5E35B1", marginTop: 12, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111" },
  content: { padding: 16, paddingBottom: 40 },
  statusCard: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusTitle: { fontSize: 18, fontWeight: "800", marginTop: 10, color: "#111" },
  statusSub: { fontSize: 14, color: "#616161", marginTop: 4, textAlign: "center" },
  refundAmt: { fontSize: 16, fontWeight: "800", color: "#2E7D32", marginTop: 8 },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEE",
    marginBottom: 16,
  },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPh: { backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#212121" },
  itemMeta: { fontSize: 12, color: "#757575", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  label: { fontSize: 14, color: "#757575" },
  value: { fontSize: 14, fontWeight: "600", color: "#212121", flex: 1, textAlign: "right", marginLeft: 12 },
  labelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#5E35B1",
    marginTop: 8,
  },
  labelBtnText: { color: "#5E35B1", fontWeight: "700" },
  shopBtn: {
    backgroundColor: "#EDE7F6",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  shopBtnText: { color: "#5E35B1", fontWeight: "700" },
  walletBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5E35B1",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  walletBtnText: { color: "#FFF", fontWeight: "700" },
  infoBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8, color: "#212121" },
  infoText: { fontSize: 13, color: "#616161", lineHeight: 22 },
});
