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
import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

type WalletTx = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

export default function WalletScreen() {
  const { triggerHaptic, currentUser, formatPrice } = useStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.id) {
      setBalance(null);
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/wallet`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setBalance(Number(data.walletBalance ?? 0));
        setTransactions(data.transactions || []);
      }
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderTx = ({ item }: { item: WalletTx }) => {
    const credit = item.amount >= 0;
    return (
      <View style={styles.txRow}>
        <View style={styles.txIcon}>
          <Lucide
            name={item.type === "REFUND" ? "arrow-down-circle" : "wallet-outline"}
            size={22}
            color={credit ? "#2E7D32" : "#E53935"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txTitle} numberOfLines={2}>
            {item.description || item.type}
          </Text>
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Text style={[styles.txAmt, { color: credit ? "#2E7D32" : "#E53935" }]}>
          {credit ? "+" : ""}
          {formatPrice ? formatPrice(item.amount) : `₹${item.amount}`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Lucide name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>AURA Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      {!currentUser ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sign in to view wallet</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/login" as any)}>
            <Text style={styles.btnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#5E35B1" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balance}>
              {formatPrice ? formatPrice(balance ?? 0) : `₹${balance ?? 0}`}
            </Text>
            <Text style={styles.balanceHint}>
              Refunds from returns are credited here instantly. Use at checkout.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => {
                triggerHaptic("light");
                router.push("/shop/all-products" as any);
              }}
            >
              <Text style={styles.shopBtnText}>Shop with wallet</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <FlatList
            data={transactions}
            keyExtractor={(t) => t.id}
            renderItem={renderTx}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyTx}>No transactions yet</Text>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </>
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
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#5E35B1",
  },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  balance: { color: "#FFF", fontSize: 36, fontWeight: "800", marginTop: 4 },
  balanceHint: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 8, lineHeight: 18 },
  shopBtn: {
    marginTop: 16,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  shopBtnText: { color: "#5E35B1", fontWeight: "800" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#212121",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEE",
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { fontSize: 14, fontWeight: "600", color: "#212121" },
  txDate: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: "800" },
  emptyTx: { textAlign: "center", color: "#9E9E9E", padding: 24 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  btn: {
    backgroundColor: "#5E35B1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#FFF", fontWeight: "700" },
});
