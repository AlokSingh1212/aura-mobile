import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { SHOP } from "@/theme/shopTheme";
import { AuraBottomNav } from "@/components/shop/AuraBottomNav";

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: SHOP.green,
  SHIPPED: SHOP.primary,
  PROCESSING: "#F9A825",
  PENDING: SHOP.textSecondary,
};

export default function ShopOrdersScreen() {
  const { orders, loadingOrders, fetchOrders, formatPrice, triggerHaptic } = useStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const thumb = item.items?.[0]?.images?.[0];
    const status = String(item.status || "PENDING");
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          triggerHaptic("light");
          router.push(`/account/track/${item.id}` as any);
        }}
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>Order #{String(item.id).slice(0, 8).toUpperCase()}</Text>
          <Text style={[styles.status, { color: STATUS_COLOR[status] || SHOP.textSecondary }]}>
            {status}
          </Text>
        </View>
        <View style={styles.cardBody}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPh]}>
              <Lucide name="bag-outline" size={22} color={SHOP.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.items?.[0]?.title || "Order items"}
              {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ""}
            </Text>
            <Text style={styles.meta}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </Text>
            <Text style={styles.total}>{formatPrice(item.totalPrice || 0)}</Text>
          </View>
          <Lucide name="chevron-forward" size={20} color={SHOP.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Lucide name="arrow-back" size={24} color={SHOP.text} />
          </TouchableOpacity>
          <Text style={styles.title}>My Orders</Text>
          <TouchableOpacity onPress={() => router.push("/settings" as any)}>
            <Lucide name="settings-outline" size={22} color={SHOP.text} />
          </TouchableOpacity>
        </View>

        {loadingOrders && orders.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={SHOP.primary} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.center}>
            <Lucide name="receipt-outline" size={48} color={SHOP.textMuted} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Your purchases will appear here</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push("/shop")}>
              <Text style={styles.shopBtnText}>Browse shop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      <AuraBottomNav activeTab="products" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHOP.surface },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: SHOP.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  back: { padding: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: "800", color: SHOP.text, marginLeft: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: SHOP.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: SHOP.textSecondary, marginTop: 4 },
  shopBtn: {
    marginTop: 20,
    backgroundColor: SHOP.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: { fontWeight: "800", color: SHOP.accentText },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: SHOP.bg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  orderId: { fontSize: 12, fontWeight: "700", color: SHOP.textSecondary },
  status: { fontSize: 12, fontWeight: "800" },
  cardBody: { flexDirection: "row", alignItems: "center", padding: 14, paddingTop: 0, gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: SHOP.surface },
  thumbPh: { alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "600", color: SHOP.text },
  meta: { fontSize: 11, color: SHOP.textSecondary, marginTop: 4 },
  total: { fontSize: 15, fontWeight: "800", color: SHOP.text, marginTop: 6 },
});
