import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { IgSettingsScreen, IgBodyText } from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";
import { SHOP } from "@/theme/shopTheme";

export default function StoreCatalogSettings() {
  const { products, loadingProducts, fetchProducts, activeMaisonId, activeProfile, formatPrice, triggerHaptic } =
    useStore();
  const maisonId = activeMaisonId || activeProfile?.maisonId;

  useEffect(() => {
    fetchProducts();
  }, []);

  const catalog = maisonId
    ? products.filter((p) => p.maisonId === maisonId || p.creatorId === maisonId)
    : products;

  return (
    <IgSettingsScreen title="Catalog">
      <IgBodyText>
        Manage products shown on your profile shop tab and in AURA search. Changes sync to your Maison catalog.
      </IgBodyText>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          triggerHaptic("medium");
          router.push("/create" as any);
        }}
      >
        <Lucide name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addBtnText}>Add product</Text>
      </TouchableOpacity>

      {loadingProducts && catalog.length === 0 ? (
        <ActivityIndicator color={IG.text} style={{ marginTop: 24 }} />
      ) : catalog.length === 0 ? (
        <Text style={styles.empty}>No products yet. Add your first listing.</Text>
      ) : (
        <FlatList
          data={catalog}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/shop/${item.id}` as any)}
            >
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPh]}>
                  <Lucide name="image-outline" size={20} color={IG.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>{formatPrice(item.price || 0)}</Text>
              </View>
              <Lucide name="chevron-forward" size={18} color={IG.chevron} />
            </TouchableOpacity>
          )}
        />
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: IG.accent,
    borderRadius: 10,
    paddingVertical: 14,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  empty: { color: IG.textSecondary, padding: 16, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
    gap: 12,
  },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: IG.surface },
  thumbPh: { alignItems: "center", justifyContent: "center" },
  title: { color: IG.text, fontSize: 15, fontWeight: "500" },
  price: { color: SHOP.primary, fontSize: 14, marginTop: 4 },
});
