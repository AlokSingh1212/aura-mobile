import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
} from "@/components/settings/InstagramSettingsUI";
import {
  loadEcosystemSettings,
  updateShopSettings,
  loadSavedAddresses,
  saveAddressEntry,
  deleteSavedAddress,
} from "@/lib/ecosystemSettings";
import {
  AddressFormFields,
  validateAddressForm,
  normalizeAddressForm,
} from "@/components/shop/AddressFormFields";
import { buildDefaultShippingAddress, shortAddressLine, type ShippingAddress } from "@/lib/shopAddress";
import { countriesAsOptions } from "@/lib/worldLocations";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

export default function DeliverySettingsScreen() {
  const { currentUser, activeProfile, triggerHaptic } = useStore();
  const [countryLabel, setCountryLabel] = useState("India");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<ShippingAddress>(() =>
    buildDefaultShippingAddress(currentUser, activeProfile)
  );

  const refresh = useCallback(async () => {
    const s = await loadEcosystemSettings();
    const match = countriesAsOptions().find((c) => c.id === s.shop.defaultCountryIso);
    setCountryLabel(match?.label || s.shop.defaultCountryIso);
    setAddresses(await loadSavedAddresses());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pickCountry = () => {
    const popular = ["IN", "US", "GB", "AE", "SG", "FR", "JP"];
    const options = popular
      .map((iso) => countriesAsOptions().find((c) => c.id === iso))
      .filter(Boolean) as { id: string; label: string }[];

    Alert.alert("Default delivery country", undefined, [
      ...options.map((c) => ({
        text: c.label,
        onPress: async () => {
          await updateShopSettings({ defaultCountryIso: c.id });
          setCountryLabel(c.label);
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const saveDraft = async () => {
    const err = validateAddressForm(draft);
    if (err) {
      Alert.alert("Invalid address", err);
      return;
    }
    await saveAddressEntry(normalizeAddressForm(draft));
    triggerHaptic("success");
    setEditorVisible(false);
    refresh();
  };

  return (
    <>
      <IgSettingsScreen title="Delivery addresses">
        <IgSectionTitle>Default</IgSectionTitle>
        <IgRow label="Default country" sublabel={countryLabel} onPress={pickCountry} last />

        <IgSectionTitle>Saved</IgSectionTitle>
        {addresses.length === 0 ? (
          <Text style={styles.empty}>No saved addresses</Text>
        ) : (
          addresses.map((addr, idx) => (
            <View key={addr.id} style={[styles.addrRow, idx === addresses.length - 1 && styles.last]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{addr.name}</Text>
                <Text style={styles.line}>{shortAddressLine(addr)}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Remove address?", undefined, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Remove",
                      style: "destructive",
                      onPress: async () => {
                        await deleteSavedAddress(addr.id);
                        refresh();
                      },
                    },
                  ])
                }
              >
                <Lucide name="trash-outline" size={20} color={IG.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
        <IgRow label="Add new address" onPress={() => {
          setDraft(buildDefaultShippingAddress(currentUser, activeProfile));
          setEditorVisible(true);
        }} last />
      </IgSettingsScreen>

      <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <TouchableOpacity onPress={() => setEditorVisible(false)}>
              <Lucide name="close" size={26} color={IG.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New address</Text>
            <TouchableOpacity onPress={saveDraft}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <AddressFormFields value={draft} onChange={setDraft} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  empty: { color: IG.textSecondary, padding: 16, fontSize: 14 },
  addrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
    gap: 12,
  },
  last: { borderBottomWidth: 0 },
  name: { fontWeight: "600", color: IG.text, fontSize: 15 },
  line: { fontSize: 13, color: IG.textSecondary, marginTop: 4 },
  modal: { flex: 1, backgroundColor: IG.bg },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: IG.text },
  save: { color: IG.accent, fontWeight: "700", fontSize: 16 },
});
