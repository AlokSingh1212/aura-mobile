import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { IgSettingsScreen, IgBodyText } from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

export default function StoreOrdersSettings() {
  const { orders, loadingOrders, fetchOrders, formatPrice, activeMaisonId, activeProfile, triggerHaptic } =
    useStore();
  const maisonId = activeMaisonId || activeProfile?.maisonId;

  useEffect(() => {
    fetchOrders(maisonId || undefined);
  }, [maisonId]);

  return (
    <IgSettingsScreen title="Store orders">
      <IgBodyText>
        Orders containing your catalog items. Tap to track fulfillment and update buyers.
      </IgBodyText>

      {loadingOrders && orders.length === 0 ? (
        <ActivityIndicator color={IG.text} style={{ marginTop: 24 }} />
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>No store orders yet.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                triggerHaptic("light");
                router.push(`/account/track/${item.id}` as any);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.id}>#{String(item.orderNumber || item.id).slice(0, 12)}</Text>
                <Text style={styles.meta}>
                  {item.items?.[0]?.title || "Items"} · {formatPrice(item.totalPrice || 0)}
                </Text>
              </View>
              <Text style={styles.status}>{String(item.status || "PENDING")}</Text>
              <Lucide name="chevron-forward" size={18} color={IG.chevron} />
            </TouchableOpacity>
          )}
        />
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  empty: { color: IG.textSecondary, padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
    gap: 8,
  },
  id: { color: IG.text, fontWeight: "600", fontSize: 15 },
  meta: { color: IG.textSecondary, fontSize: 13, marginTop: 2 },
  status: { color: IG.accent, fontSize: 12, fontWeight: "600" },
});
