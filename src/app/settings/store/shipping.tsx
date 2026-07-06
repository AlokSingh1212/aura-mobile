import React from "react";
import { TextInput, StyleSheet } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { IG } from "@/theme/settingsTheme";

export default function StoreShippingSettings() {
  const { data, patch } = useSettingsSection("store");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Shipping & delivery">
      <IgBodyText>
        These settings apply to your storefront and buyer checkout estimates.
      </IgBodyText>

      <IgSectionTitle>Fulfillment</IgSectionTitle>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(data.processingDays)}
        onChangeText={(v) => patch({ processingDays: Math.max(0, parseInt(v, 10) || 0) })}
        placeholder="Processing days"
        placeholderTextColor={IG.textSecondary}
      />
      <IgToggle
        label="Auto-accept paid orders"
        value={data.autoAcceptOrders}
        onValueChange={(v) => patch({ autoAcceptOrders: v })}
        last
      />

      <IgSectionTitle>Shipping offers</IgSectionTitle>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(data.freeShippingMinOrder)}
        onChangeText={(v) => patch({ freeShippingMinOrder: Math.max(0, parseInt(v, 10) || 0) })}
        placeholder="Free shipping minimum (INR)"
        placeholderTextColor={IG.textSecondary}
      />

      <IgSectionTitle>Inventory alerts</IgSectionTitle>
      <IgToggle
        label="Low stock alerts"
        value={data.lowStockAlert}
        onValueChange={(v) => patch({ lowStockAlert: v })}
      />
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(data.lowStockThreshold)}
        onChangeText={(v) => patch({ lowStockThreshold: Math.max(0, parseInt(v, 10) || 0) })}
        placeholder="Low stock threshold"
        placeholderTextColor={IG.textSecondary}
      />
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: IG.text,
    fontSize: 15,
    backgroundColor: IG.surface,
  },
});
