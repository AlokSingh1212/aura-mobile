import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import {
  fetchReturns,
  statusLabel,
  refundStatusLabel,
  type ReturnRequestSummary,
} from "@/lib/returnsApi";
import { SHOP } from "@/theme/shopTheme";

export default function ReturnsListScreen() {
  const { triggerHaptic, currentUser } = useStore();
  const [items, setItems] = useState<ReturnRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    const list = await fetchReturns();
    setItems(list);
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ReturnRequestSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        triggerHaptic("light");
        router.push(`/account/returns/${item.id}` as any);
      }}
    >
      <View style={styles.cardTop}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{item.type === "EXCHANGE" ? "Exchange" : "Return"}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      </View>
      <Text style={styles.reason} numberOfLines={2}>
        {item.reason}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.status}>{statusLabel(item.status)}</Text>
        {item.refundAmount != null && (
          <Text style={styles.amount}>₹{Math.round(item.refundAmount).toLocaleString("en-IN")}</Text>
        )}
      </View>
      {item.refundStatus ? (
        <Text style={styles.refundMeta}>{refundStatusLabel(item.refundStatus)}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Lucide name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Returns & exchanges</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>
        Refunds are credited to your AURA Wallet instantly. Original payment method refunds (UPI/card)
        process in 5–7 business days when applicable.
      </Text>

      {loading ? (
        <ActivityIndicator color={SHOP.primary} style={{ marginTop: 40 }} />
      ) : !currentUser ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/login" as any)}>
            <Text style={styles.btnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Lucide name="swap-horizontal-outline" size={48} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No returns yet</Text>
          <Text style={styles.emptySub}>Open an order and tap Return or Exchange to start.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/shop/orders" as any)}>
            <Text style={styles.btnText}>View orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111" },
  subtitle: {
    fontSize: 13,
    color: "#616161",
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEE",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  typePill: {
    backgroundColor: "#EDE7F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: { fontSize: 11, fontWeight: "700", color: "#5E35B1" },
  date: { fontSize: 12, color: "#9E9E9E" },
  reason: { fontSize: 14, color: "#212121", fontWeight: "600", marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  status: { fontSize: 13, fontWeight: "700", color: "#2E7D32" },
  amount: { fontSize: 14, fontWeight: "800", color: "#111" },
  refundMeta: { fontSize: 12, color: "#757575", marginTop: 6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#212121" },
  emptySub: { fontSize: 14, color: "#757575", textAlign: "center" },
  btn: {
    marginTop: 8,
    backgroundColor: "#5E35B1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#FFF", fontWeight: "700" },
});
