import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { BRAND_CATEGORIES } from "@/lib/profileUsername";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { IG } from "@/theme/settingsTheme";

export type TargetProfileType = "PERSONAL" | "INFLUENCER" | "BUSINESS";

interface ConvertAccountTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onConverted?: () => void;
}

export function ConvertAccountTypeSheet({
  visible,
  onClose,
  onConverted,
}: ConvertAccountTypeSheetProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, activeProfile, triggerHaptic } = useStore();

  const currentType: TargetProfileType = (activeProfile?.type as TargetProfileType) || "PERSONAL";
  const [targetType, setTargetType] = useState<TargetProfileType>(
    currentType === "PERSONAL" ? "INFLUENCER" : "PERSONAL"
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState<string>(activeProfile?.category || BRAND_CATEGORIES[0]);
  const [website, setWebsite] = useState(activeProfile?.website || "");
  const [gstExempt, setGstExempt] = useState(true);
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Error", "No active profile selected.");
      return;
    }

    if (targetType === "BUSINESS" && !gstExempt && taxId.trim().length > 0 && taxId.trim().length !== 15) {
      Alert.alert("Invalid GSTIN", "Enter a valid 15-character GSTIN or choose Non-GST / Exempt.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/type-convert`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          userId: currentUser.id,
          profileId: activeProfile.id,
          targetType,
          category: targetType === "PERSONAL" ? null : category,
          isPrivate: targetType === "PERSONAL" ? isPrivate : false,
          website: targetType !== "PERSONAL" ? website.trim() || null : null,
          isGstExempt: targetType === "BUSINESS" ? gstExempt : true,
          taxId: targetType === "BUSINESS" && !gstExempt ? taxId.trim() || null : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        triggerHaptic("success");
        if (data.profiles && data.activeProfile) {
          useStore.setState({
            userProfiles: data.profiles,
            activeProfile: data.activeProfile,
          });
        }
        onClose();
        onConverted?.();
        Alert.alert(
          "Account Converted",
          `@${activeProfile.username} has been converted to ${
            targetType === "PERSONAL"
              ? "Personal Profile"
              : targetType === "INFLUENCER"
              ? "Creator Account"
              : "Atelier Storefront"
          }.`
        );
      } else {
        triggerHaptic("heavy");
        Alert.alert("Conversion failed", data.error || data.message || "Try again.");
      }
    } catch (e: any) {
      triggerHaptic("heavy");
      Alert.alert("Error", e.message || "Failed to contact database gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Switch Account Type</Text>
              <TouchableOpacity onPress={handleConvert} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#00f5ff" />
                ) : (
                  <Text style={styles.createText}>Switch</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.subtitle}>
                Currently active: <Text style={{ color: "#00f5ff", fontWeight: "700" }}>@{activeProfile?.username}</Text> ({currentType})
              </Text>

              {/* Target Type Selector Cards */}
              <View style={styles.typeSelectorRow}>
                {[
                  { type: "PERSONAL", label: "Personal", sub: "Public/Private profile", icon: "person-outline", color: "#00f5ff" },
                  { type: "INFLUENCER", label: "Creator", sub: "Deals & analytics", icon: "sparkles-outline", color: "#a78bfa" },
                  { type: "BUSINESS", label: "Atelier", sub: "Store & products", icon: "storefront-outline", color: "#fb923c" },
                ]
                  .filter((item) => item.type !== currentType)
                  .map((item) => {
                    const isActive = targetType === item.type;
                    return (
                      <TouchableOpacity
                        key={item.type}
                        style={[
                          styles.typeCard,
                          isActive && { borderColor: item.color, backgroundColor: `${item.color}15` },
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          setTargetType(item.type as TargetProfileType);
                        }}
                        disabled={loading}
                      >
                        <Lucide name={item.icon as any} size={20} color={isActive ? item.color : "rgba(255,255,255,0.4)"} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.typeCardTitle, isActive && { color: "#fff" }]}>{item.label}</Text>
                          <Text style={styles.typeCardSub}>{item.sub}</Text>
                        </View>
                        {isActive && <Lucide name="checkmark-circle" size={18} color={item.color} />}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* PERSONAL: Public / Private toggle */}
              {targetType === "PERSONAL" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Privacy</Text>
                  <View style={styles.taxRow}>
                    <TouchableOpacity
                      style={[styles.taxOption, !isPrivate && styles.taxOptionActive]}
                      onPress={() => setIsPrivate(false)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, !isPrivate && { color: "#00f5ff" }]}>✦ Public</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taxOption, isPrivate && styles.taxOptionActive]}
                      onPress={() => setIsPrivate(true)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, isPrivate && { color: "#00f5ff" }]}>🔒 Private</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldHint}>
                    {isPrivate
                      ? "Only approved followers can see your posts and stories."
                      : "Your posts and reels will be discoverable on the feed."}
                  </Text>
                </View>
              )}

              {/* CREATOR & BRAND: Category selection */}
              {targetType !== "PERSONAL" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category / Vertical</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {BRAND_CATEGORIES.map((cat) => {
                      const active = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setCategory(cat);
                          }}
                          disabled={loading}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* CREATOR & BRAND: Website */}
              {targetType !== "PERSONAL" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Website (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="yourwebsite.com"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={website}
                    onChangeText={setWebsite}
                    autoCapitalize="none"
                    keyboardType="url"
                    editable={!loading}
                  />
                </View>
              )}

              {/* ATELIER BRAND: GST / Tax Registration */}
              {targetType === "BUSINESS" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tax Structure</Text>
                  <View style={styles.taxRow}>
                    <TouchableOpacity
                      style={[styles.taxOption, gstExempt && styles.taxOptionActive]}
                      onPress={() => setGstExempt(true)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, gstExempt && { color: "#34d399" }]}>
                        Non-GST / Exempt
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taxOption, !gstExempt && styles.taxOptionActive]}
                      onPress={() => setGstExempt(false)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, !gstExempt && { color: "#fb923c" }]}>
                        GST Registered
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {!gstExempt && (
                    <TextInput
                      style={[styles.input, { marginTop: 10 }]}
                      placeholder="15-character GSTIN"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={taxId}
                      onChangeText={setTaxId}
                      autoCapitalize="characters"
                      maxLength={15}
                      editable={!loading}
                    />
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelText: { color: "rgba(255,255,255,0.6)", fontSize: 15 },
  createText: { color: "#00f5ff", fontSize: 15, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 },
  typeSelectorRow: { gap: 10, marginBottom: 20 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  typeCardTitle: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },
  typeCardSub: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
  field: { marginBottom: 16 },
  fieldLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldHint: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: { backgroundColor: "rgba(0,245,255,0.12)", borderColor: "rgba(0,245,255,0.45)" },
  chipText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#00f5ff" },
  taxRow: { flexDirection: "row", gap: 10 },
  taxOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  taxOptionActive: { borderColor: "rgba(0,245,255,0.45)", backgroundColor: "rgba(0,245,255,0.08)" },
  taxOptionText: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
});
