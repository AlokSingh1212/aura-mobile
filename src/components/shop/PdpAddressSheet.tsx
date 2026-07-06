import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import type { ShippingAddress } from "@/lib/shopAddress";
import {
  AddressFormFields,
  normalizeAddressForm,
  validateAddressForm,
} from "@/components/shop/AddressFormFields";
import { useStore } from "@/store/useStore";

type Props = {
  visible: boolean;
  address: ShippingAddress;
  onClose: () => void;
  onSave: (address: ShippingAddress) => void;
};

export function PdpAddressSheet({ visible, address, onClose, onSave }: Props) {
  const { triggerHaptic } = useStore();
  const [draft, setDraft] = useState<ShippingAddress>(address);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setDraft(address);
      setError("");
    }
  }, [visible, address]);

  const handleSave = () => {
    const validationError = validateAddressForm(draft);
    if (validationError) {
      setError(validationError);
      triggerHaptic("medium");
      return;
    }
    triggerHaptic("success");
    onSave(normalizeAddressForm(draft));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Delivery address</Text>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color={SHOP.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Choose from 250+ countries with real dial codes, states, and cities.
            </Text>
            <AddressFormFields
              value={draft}
              onChange={setDraft}
              error={error}
              onErrorChange={setError}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHOP.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "92%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: SHOP.text },
  subtitle: {
    fontSize: 12,
    color: SHOP.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  form: { paddingHorizontal: 16, paddingTop: 8 },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: SHOP.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
