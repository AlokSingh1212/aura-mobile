import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { IgSettingsScreen, IgBodyText, IgSectionTitle } from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { API_BASE } from "@/constants/api";
import { IG } from "@/theme/settingsTheme";

export default function StorePromotionsSettings() {
  const { activeMaisonId, activeProfile, triggerHaptic } = useStore();
  const maisonId = activeMaisonId || activeProfile?.maisonId;
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");

  const load = async () => {
    if (!maisonId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/promotions?maisonId=${encodeURIComponent(maisonId)}`);
      const data = await res.json();
      setPromos(data.promos || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [maisonId]);

  const createPromo = async () => {
    if (!maisonId || !code.trim()) return;
    triggerHaptic("medium");
    try {
      const res = await fetch(`${API_BASE}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maisonId,
          code: code.trim().toUpperCase(),
          discount: parseFloat(discount) || 10,
          type: "PERCENTAGE",
          group: "COUPON",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCode("");
        await load();
      } else {
        Alert.alert("Could not create", data.error || "Try again.");
      }
    } catch {
      Alert.alert("Network error");
    }
  };

  return (
    <IgSettingsScreen title="Promotions">
      <IgBodyText>Create coupon codes for your storefront and checkout.</IgBodyText>

      <IgSectionTitle>New coupon</IgSectionTitle>
      <TextInput
        style={styles.input}
        placeholder="CODE"
        placeholderTextColor={IG.textSecondary}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Discount %"
        placeholderTextColor={IG.textSecondary}
        keyboardType="number-pad"
        value={discount}
        onChangeText={setDiscount}
      />
      <TouchableOpacity style={styles.btn} onPress={createPromo}>
        <Text style={styles.btnText}>Create promotion</Text>
      </TouchableOpacity>

      <IgSectionTitle>Active codes</IgSectionTitle>
      {loading ? (
        <ActivityIndicator color={IG.text} />
      ) : promos.length === 0 ? (
        <Text style={styles.empty}>No promotions yet.</Text>
      ) : (
        promos.map((p) => (
          <View key={p.id || p.code} style={styles.row}>
            <Text style={styles.code}>{p.code}</Text>
            <Text style={styles.meta}>
              {p.type === "PERCENTAGE" ? `${p.discount}% off` : `₹${p.discount} off`} · {p.status}
            </Text>
          </View>
        ))
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: IG.text,
    backgroundColor: IG.surface,
  },
  btn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: IG.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  empty: { color: IG.textSecondary, paddingHorizontal: 16 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  code: { color: IG.text, fontWeight: "700", fontSize: 15 },
  meta: { color: IG.textSecondary, fontSize: 13, marginTop: 2 },
});
