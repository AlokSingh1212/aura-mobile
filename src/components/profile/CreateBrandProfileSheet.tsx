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
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useStore } from "@/store/useStore";
import { uploadMediaFromUri } from "@/lib/uploadMedia";
import {
  BRAND_CATEGORIES,
  normalizeProfileUsername,
  validateProfileUsername,
} from "@/lib/profileUsername";

interface CreateBrandProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export type ProfileTypeOption = "PERSONAL" | "INFLUENCER" | "BUSINESS";

export function CreateBrandProfileSheet({
  visible,
  onClose,
  onCreated,
}: CreateBrandProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, createNewProfile, triggerHaptic } = useStore();

  const [profileType, setProfileType] = useState<ProfileTypeOption>("PERSONAL");
  const [isPrivate, setIsPrivate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState<string>(BRAND_CATEGORIES[0]);
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [gstExempt, setGstExempt] = useState(true);
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setProfileType("PERSONAL");
    setIsPrivate(false);
    setDisplayName("");
    setUsername("");
    setCategory(BRAND_CATEGORIES[0]);
    setWebsite("");
    setBio("");
    setLogoUri(null);
    setGstExempt(true);
    setTaxId("");
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handlePickLogo = async () => {
    triggerHaptic("light");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to set a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Sign in again to create a new profile.");
      return;
    }

    const cleanUsername = normalizeProfileUsername(username);
    const usernameError = validateProfileUsername(cleanUsername);
    if (usernameError) {
      Alert.alert("Invalid username", usernameError);
      return;
    }

    const name = displayName.trim();
    if (!name) {
      Alert.alert("Display name required", "Enter a name for your profile.");
      return;
    }

    if (profileType === "BUSINESS" && !gstExempt && taxId.trim().length > 0 && taxId.trim().length !== 15) {
      Alert.alert("Invalid GSTIN", "Enter a valid 15-character GSTIN or choose Non-GST / Exempt.");
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    try {
      let logoUrl: string | null = null;
      if (logoUri) {
        logoUrl = await uploadMediaFromUri(logoUri, "avatar");
      }

      const res = await createNewProfile({
        userId: currentUser.id,
        type: profileType,
        name,
        username: cleanUsername,
        category: profileType === "PERSONAL" ? null : category,
        isPrivate: profileType === "PERSONAL" ? isPrivate : false,
        website: profileType !== "PERSONAL" ? website.trim() || null : null,
        bio: bio.trim() || null,
        logo: logoUrl,
        isGstExempt: profileType === "BUSINESS" ? gstExempt : true,
        taxId: profileType === "BUSINESS" && !gstExempt ? taxId.trim() || null : null,
      });

      if (res.success) {
        triggerHaptic("success");
        resetForm();
        onClose();
        onCreated?.();
        Alert.alert(
          "Profile Created",
          `@${cleanUsername} is live! You can switch profiles anytime from your profile header.`
        );
      } else {
        triggerHaptic("heavy");
        Alert.alert("Could not create profile", res.error || "Try a different username.");
      }
    } catch (e) {
      triggerHaptic("heavy");
      Alert.alert(
        "Something went wrong",
        e instanceof Error ? e.message : "Could not reach the server. Check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handleClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>
                {profileType === "PERSONAL"
                  ? "New Personal Profile"
                  : profileType === "INFLUENCER"
                  ? "New Creator Profile"
                  : "New Atelier Brand"}
              </Text>
              <TouchableOpacity onPress={handleCreate} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#00f5ff" />
                ) : (
                  <Text style={styles.createText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Profile Type Selector Pills */}
              <View style={styles.typeSelectorRow}>
                {[
                  { type: "PERSONAL", label: "Personal", icon: "person-outline", color: "#00f5ff" },
                  { type: "INFLUENCER", label: "Creator", icon: "sparkles-outline", color: "#a78bfa" },
                  { type: "BUSINESS", label: "Atelier", icon: "storefront-outline", color: "#fb923c" },
                ].map((item) => {
                  const isActive = profileType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.typeSelectorCard,
                        isActive && { borderColor: item.color, backgroundColor: `${item.color}15` },
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setProfileType(item.type as ProfileTypeOption);
                      }}
                      disabled={loading}
                    >
                      <Lucide name={item.icon as any} size={18} color={isActive ? item.color : "rgba(255,255,255,0.4)"} />
                      <Text style={[styles.typeSelectorLabel, isActive && { color: "#fff", fontWeight: "700" }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo} disabled={loading}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Lucide name="camera-outline" size={28} color="rgba(255,255,255,0.5)" />
                  </View>
                )}
                <Text style={styles.logoHint}>Add profile photo</Text>
              </TouchableOpacity>

              <Field label={profileType === "BUSINESS" ? "Brand name" : "Display name"}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    profileType === "BUSINESS"
                      ? "e.g. Obsidian Drape"
                      : profileType === "INFLUENCER"
                      ? "e.g. Alok Creative Studio"
                      : "e.g. Alok Singh"
                  }
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!loading}
                />
              </Field>

              <Field label="Username handle">
                <View style={styles.usernameRow}>
                  <Text style={styles.atPrefix}>@</Text>
                  <TextInput
                    style={[styles.input, styles.usernameInput]}
                    placeholder={profileType === "BUSINESS" ? "obsidian_drape" : "alok_creative"}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={username}
                    onChangeText={(t) => setUsername(normalizeProfileUsername(t))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
                <Text style={styles.fieldHint}>Letters, numbers, periods, underscores, hyphens</Text>
              </Field>

              {/* PERSONAL SPECIFIC: Public / Private toggle */}
              {profileType === "PERSONAL" && (
                <Field label="Account Privacy">
                  <View style={styles.taxRow}>
                    <TouchableOpacity
                      style={[styles.taxOption, !isPrivate && styles.taxOptionActive]}
                      onPress={() => {
                        triggerHaptic("light");
                        setIsPrivate(false);
                      }}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, !isPrivate && styles.taxOptionTextActive]}>
                        ✦ Public
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taxOption, isPrivate && styles.taxOptionActive]}
                      onPress={() => {
                        triggerHaptic("light");
                        setIsPrivate(true);
                      }}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, isPrivate && styles.taxOptionTextActive]}>
                        🔒 Private
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fieldHint}>
                    {isPrivate
                      ? "Only approved followers can view your posts and stories."
                      : "Your posts and reels will be discoverable on the feed."}
                  </Text>
                </Field>
              )}

              {/* CREATOR & BRAND SPECIFIC: Category chips */}
              {profileType !== "PERSONAL" && (
                <Field label="Category / Vertical">
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
                </Field>
              )}

              {/* CREATOR & BRAND SPECIFIC: Website */}
              {profileType !== "PERSONAL" && (
                <Field label="Website (optional)">
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
                </Field>
              )}

              <Field label="Bio (optional)">
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder={
                    profileType === "BUSINESS"
                      ? "Tell people about your brand and products..."
                      : profileType === "INFLUENCER"
                      ? "Tell your audience what content you create..."
                      : "Write something about yourself..."
                  }
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  maxLength={150}
                  editable={!loading}
                />
              </Field>

              {/* ATELIER BRAND SPECIFIC: Tax registration */}
              {profileType === "BUSINESS" && (
                <Field label="Tax registration">
                  <View style={styles.taxRow}>
                    <TouchableOpacity
                      style={[styles.taxOption, gstExempt && styles.taxOptionActive]}
                      onPress={() => setGstExempt(true)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, gstExempt && styles.taxOptionTextActive]}>
                        Non-GST / Exempt
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taxOption, !gstExempt && styles.taxOptionActive]}
                      onPress={() => setGstExempt(false)}
                      disabled={loading}
                    >
                      <Text style={[styles.taxOptionText, !gstExempt && styles.taxOptionTextActive]}>
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
                </Field>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
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
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
  },
  createText: {
    color: "#00f5ff",
    fontSize: 15,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  typeSelectorCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeSelectorLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  logoPicker: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  logoHint: {
    color: "#00f5ff",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 6,
  },
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
  bioInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  atPrefix: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginRight: 4,
    paddingLeft: 4,
  },
  usernameInput: {
    flex: 1,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderColor: "rgba(0,245,255,0.45)",
  },
  chipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#00f5ff",
  },
  taxRow: {
    flexDirection: "row",
    gap: 10,
  },
  taxOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  taxOptionActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  taxOptionText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  taxOptionTextActive: {
    color: "#00f5ff",
  },
});
