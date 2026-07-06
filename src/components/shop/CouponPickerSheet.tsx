import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import type { ShopCoupon } from "@/lib/shopCoupons";
import { fetchAvailableCoupons } from "@/lib/shopCoupons";
import { useStore } from "@/store/useStore";

type Props = {
  visible: boolean;
  maisonId?: string | null;
  appliedCode?: string | null;
  onClose: () => void;
  onApply: (code: string) => void;
  isApplying?: boolean;
  error?: string;
};

export function CouponPickerSheet({
  visible,
  maisonId,
  appliedCode,
  onClose,
  onApply,
  isApplying,
  error,
}: Props) {
  const { triggerHaptic } = useStore();
  const [coupons, setCoupons] = useState<ShopCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchAvailableCoupons(maisonId)
      .then(setCoupons)
      .finally(() => setLoading(false));
  }, [visible, maisonId]);

  const submitManual = () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    triggerHaptic("light");
    onApply(code);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Coupons for you</Text>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color={SHOP.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter coupon code"
              placeholderTextColor={SHOP.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, !manualCode.trim() && styles.applyDisabled]}
              onPress={submitManual}
              disabled={!manualCode.trim() || isApplying}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.applyText}>APPLY</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ScrollView style={styles.list}>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={SHOP.primary} />
            ) : (
              coupons.map((c) => {
                const active = appliedCode === c.code;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.card, active && styles.cardActive]}
                    onPress={() => {
                      triggerHaptic("light");
                      onApply(c.code);
                    }}
                    disabled={isApplying}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{c.group}</Text>
                      </View>
                      {active ? (
                        <Lucide name="checkmark-circle" size={20} color={SHOP.green} />
                      ) : (
                        <Text style={styles.applyLink}>Apply</Text>
                      )}
                    </View>
                    <Text style={styles.code}>{c.code}</Text>
                    <Text style={styles.desc}>{c.description}</Text>
                    {c.expiresAt ? (
                      <Text style={styles.expiry}>
                        Expires {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: SHOP.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: SHOP.text },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: SHOP.text,
  },
  applyBtn: {
    backgroundColor: SHOP.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  applyDisabled: { opacity: 0.5 },
  applyText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  error: { color: SHOP.red, fontSize: 12, paddingHorizontal: 16, marginBottom: 4 },
  list: { paddingHorizontal: 16 },
  card: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: SHOP.surface,
  },
  cardActive: { borderColor: SHOP.green, backgroundColor: SHOP.greenLight },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: {
    backgroundColor: SHOP.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: { fontSize: 10, fontWeight: "700", color: SHOP.chipText },
  applyLink: { color: SHOP.primary, fontWeight: "700", fontSize: 13 },
  code: { fontSize: 16, fontWeight: "800", color: SHOP.text, marginTop: 8 },
  desc: { fontSize: 13, color: SHOP.textSecondary, marginTop: 4 },
  expiry: { fontSize: 11, color: SHOP.textMuted, marginTop: 6 },
});
