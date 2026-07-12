import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { createReturnRequest, RETURN_REASONS } from "@/lib/returnsApi";
import { SHOP } from "@/theme/shopTheme";

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  images?: string[];
};

export default function ReturnRequestScreen() {
  const params = useLocalSearchParams<{
    orderId?: string;
    orderItemId?: string;
  }>();
  const { triggerHaptic, currentUser, orders, fetchOrders } = useStore();
  const [type, setType] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [item, setItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!params.orderId) return;
    const order = orders.find((o) => o.id === params.orderId);
    const line =
      order?.items?.find((i: OrderItem) => i.id === params.orderItemId) ||
      order?.items?.[0];
    if (line) setItem(line as OrderItem);
  }, [params.orderId, params.orderItemId, orders]);

  const submit = async () => {
    if (!currentUser) {
      router.push("/login" as any);
      return;
    }
    if (!params.orderId || !item?.id || !reason) {
      Alert.alert("Missing details", "Please select a reason for your return.");
      return;
    }

    setSubmitting(true);
    triggerHaptic("medium");
    try {
      const res = await createReturnRequest({
        orderId: params.orderId,
        orderItemId: item.id,
        type,
        reason,
      });

      if (res.success && res.request) {
        triggerHaptic("success");
        Alert.alert(
          type === "EXCHANGE" ? "Exchange initiated" : "Return approved",
          type === "EXCHANGE"
            ? "Exchange credit has been added to your AURA Wallet. Place a new order for your preferred item."
            : `₹${Math.round(res.request.refundAmount || 0)} has been credited to your AURA Wallet automatically.`,
          [
            {
              text: "View details",
              onPress: () =>
                router.replace(`/account/returns/${res.request!.id}` as any),
            },
          ]
        );
      } else {
        Alert.alert("Could not submit", res.error || "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!params.orderId) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Order not specified</Text>
        <TouchableOpacity onPress={() => router.push("/shop/orders" as any)}>
          <Text style={styles.link}>View orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Lucide name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Return / exchange</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {item ? (
          <View style={styles.itemCard}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]}>
                <Lucide name="bag-outline" size={22} color="#999" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                ₹{item.price} × {item.quantity}
              </Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator color={SHOP.primary} style={{ marginVertical: 20 }} />
        )}

        <Text style={styles.sectionLabel}>What would you like to do?</Text>
        <View style={styles.typeRow}>
          {(["RETURN", "EXCHANGE"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => {
                triggerHaptic("light");
                setType(t);
              }}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t === "RETURN" ? "Return & refund" : "Exchange"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === "EXCHANGE" && (
          <Text style={styles.hint}>
            Exchanges are processed as instant wallet credit + a new order. Pick your replacement
            item from the shop after submitting.
          </Text>
        )}

        <Text style={styles.sectionLabel}>Reason</Text>
        {RETURN_REASONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.reasonRow, reason === r && styles.reasonActive]}
            onPress={() => {
              triggerHaptic("light");
              setReason(r);
            }}
          >
            <Lucide
              name={reason === r ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={reason === r ? "#5E35B1" : "#BDBDBD"}
            />
            <Text style={styles.reasonText}>{r}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>Automatic refund policy</Text>
          <Text style={styles.policyText}>
            • 7-day return window from delivery{"\n"}
            • Free return pickup label provided{"\n"}
            • Wallet refund is instant on approval{"\n"}
            • UPI/card refunds via Razorpay in 5–7 days
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          disabled={submitting || !reason}
          onPress={submit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>
              {type === "EXCHANGE" ? "Submit exchange request" : "Submit return request"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: "#616161" },
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
  itemCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    marginBottom: 20,
  },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  thumbPh: { backgroundColor: "#EEE", alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "700" },
  itemMeta: { fontSize: 13, color: "#757575", marginTop: 4 },
  sectionLabel: { fontSize: 14, fontWeight: "800", marginBottom: 10, color: "#212121" },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  typeBtnActive: { borderColor: "#5E35B1", backgroundColor: "#EDE7F6" },
  typeBtnText: { fontWeight: "700", color: "#757575" },
  typeBtnTextActive: { color: "#5E35B1" },
  hint: { fontSize: 13, color: "#616161", lineHeight: 19, marginBottom: 16 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEE",
  },
  reasonActive: { backgroundColor: "#FAFAFA" },
  reasonText: { fontSize: 14, color: "#212121", flex: 1 },
  policyBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 20,
  },
  policyTitle: { fontWeight: "800", marginBottom: 8, color: "#212121" },
  policyText: { fontSize: 13, color: "#616161", lineHeight: 22 },
  submit: {
    backgroundColor: "#5E35B1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
});
