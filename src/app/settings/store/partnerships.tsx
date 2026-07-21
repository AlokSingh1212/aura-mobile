import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgBodyText,
  IgRow,
  IgToggle,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

export default function StorePartnershipsSettings() {
  const { activeProfile, activeMaisonId, currentUser } = useStore();
  const { data: store, patch } = useSettingsSection("store");
  const maisonId = activeMaisonId || activeProfile?.maisonId || currentUser?.maisonId;

  if (!store) return null;

  return (
    <IgSettingsScreen title="Brand partnerships">
      <IgBodyText>
        Propose official creator partnerships with escrow-backed budgets. Manage active deals from
        Business Tools → Partnerships or the sponsorship portal.
      </IgBodyText>

      <IgSectionTitle>Invites</IgSectionTitle>
      <IgToggle
        label="Allow partnership offers to creators"
        hint="When off, new offers cannot be sent from this store"
        value={store.allowBrandPartnerships !== false}
        onValueChange={(v) => patch({ allowBrandPartnerships: v })}
        last
      />

      <IgSectionTitle>Manage</IgSectionTitle>
      <IgRow
        label="Partnership portal"
        sublabel="View deals, propose contracts, confirm payouts"
        onPress={() => router.push("/sponsorships" as any)}
      />
      <IgRow
        label="Business Tools · Partnerships"
        sublabel="Quick access from inbox drawer"
        onPress={() => router.push("/(tabs)" as any)}
        last
      />

      {maisonId ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Escrow</Text>
          <Text style={styles.noteText}>
            Budget is locked from your brand wallet when a creator accepts. Payment releases when
            you confirm deliverables are complete.
          </Text>
        </View>
      ) : null}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  noteBox: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: IG.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  noteTitle: { color: IG.text, fontWeight: "600", marginBottom: 6 },
  noteText: { color: IG.textSecondary, fontSize: 13, lineHeight: 18 },
});
