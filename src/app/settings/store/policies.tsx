import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { IG } from "@/theme/settingsTheme";

const STORE_RETURN_WINDOW_DAYS = 7;

export default function StorePoliciesSettings() {
  const { data, patch } = useSettingsSection("store");
  if (!data) return null;

  return (
    <IgSettingsScreen title="Shop policies">
      <IgBodyText>
        Return windows, offers and vacation messaging shown to buyers.
      </IgBodyText>

      <IgSectionTitle>Returns & exchanges</IgSectionTitle>
      <View style={styles.fixedPolicyBox}>
        <Text style={styles.fixedPolicyTitle}>Store return window</Text>
        <Text style={styles.fixedPolicyValue}>{STORE_RETURN_WINDOW_DAYS} days after delivery</Text>
        <Text style={styles.fixedPolicyHint}>
          Fixed for every store. When listing a product, choose whether that SKU offers a 7-day
          return refund or a 7-day exchange.
        </Text>
      </View>

      <IgSectionTitle>Offers</IgSectionTitle>
      <IgToggle
        label="Allow offers from buyers"
        value={data.allowOffers}
        onValueChange={(v) => patch({ allowOffers: v, returnWindowDays: STORE_RETURN_WINDOW_DAYS })}
      />
      <IgToggle
        label="Show shop tab on profile"
        value={data.showShopTab}
        onValueChange={(v) => patch({ showShopTab: v, returnWindowDays: STORE_RETURN_WINDOW_DAYS })}
        last
      />

      <IgSectionTitle>Vacation message</IgSectionTitle>
      <TextInput
        style={styles.input}
        multiline
        value={data.vacationMessage}
        onChangeText={(v) => patch({ vacationMessage: v, returnWindowDays: STORE_RETURN_WINDOW_DAYS })}
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
    minHeight: 88,
    textAlignVertical: "top",
  },
  fixedPolicyBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    backgroundColor: IG.surface,
  },
  fixedPolicyTitle: {
    color: IG.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  fixedPolicyValue: {
    color: IG.text,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  fixedPolicyHint: {
    color: IG.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
