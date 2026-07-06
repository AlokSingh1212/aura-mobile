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

export default function StorePoliciesSettings() {
  const { data, patch } = useSettingsSection("store");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Shop policies">
      <IgBodyText>
        Return windows, offers and vacation messaging shown to buyers.
      </IgBodyText>

      <IgSectionTitle>Returns</IgSectionTitle>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(data.returnWindowDays)}
        onChangeText={(v) => patch({ returnWindowDays: Math.max(0, parseInt(v, 10) || 0) })}
        placeholder="Return window (days)"
        placeholderTextColor={IG.textSecondary}
      />

      <IgSectionTitle>Offers</IgSectionTitle>
      <IgToggle
        label="Allow offers from buyers"
        value={data.allowOffers}
        onValueChange={(v) => patch({ allowOffers: v })}
      />
      <IgToggle
        label="Show shop tab on profile"
        value={data.showShopTab}
        onValueChange={(v) => patch({ showShopTab: v })}
        last
      />

      <IgSectionTitle>Vacation message</IgSectionTitle>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={data.vacationMessage}
        onChangeText={(v) => patch({ vacationMessage: v })}
        placeholder="Message when vacation mode is on"
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
  multiline: { minHeight: 88, textAlignVertical: "top" },
});
