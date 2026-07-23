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
  
  // 5-Step Wizard State (0: Value Props, 1: Category, 2: Account Type, 3: Contact & Tax Info, 4: Confirmation)
  const [step, setStep] = useState<number>(0);
  const [targetType, setTargetType] = useState<TargetProfileType>(
    currentType === "PERSONAL" ? "INFLUENCER" : "PERSONAL"
  );
  const [category, setCategory] = useState<string>(activeProfile?.category || BRAND_CATEGORIES[0]);
  const [showCategoryOnProfile, setShowCategoryOnProfile] = useState<boolean>(true);
  const [email, setEmail] = useState<string>(currentUser?.email || "");
  const [phone, setPhone] = useState<string>(currentUser?.phone || "");
  const [website, setWebsite] = useState<string>(activeProfile?.website || "");
  const [showContactOnProfile, setShowContactOnProfile] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [gstExempt, setGstExempt] = useState<boolean>(true);
  const [taxId, setTaxId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const resetWizard = () => {
    setStep(0);
    setTargetType(currentType === "PERSONAL" ? "INFLUENCER" : "PERSONAL");
    setCategory(activeProfile?.category || BRAND_CATEGORIES[0]);
    setShowCategoryOnProfile(true);
    setEmail(currentUser?.email || "");
    setPhone(currentUser?.phone || "");
    setWebsite(activeProfile?.website || "");
    setShowContactOnProfile(true);
    setIsPrivate(false);
    setGstExempt(true);
    setTaxId("");
  };

  const handleClose = () => {
    if (loading) return;
    resetWizard();
    onClose();
  };

  const handleNext = () => {
    triggerHaptic("light");
    if (step === 3 && targetType === "BUSINESS" && !gstExempt && taxId.trim().length > 0 && taxId.trim().length !== 15) {
      Alert.alert("Invalid GSTIN", "Enter a valid 15-character GSTIN or select Non-GST / Exempt.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    triggerHaptic("light");
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinalConversion = async () => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Error", "No active profile selected.");
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
        resetWizard();
        onClose();
        onConverted?.();
        Alert.alert(
          "Welcome to your Professional Account!",
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />

            {/* Step Progress Bar */}
            <View style={styles.stepProgressBar}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.stepProgressSegment,
                    step >= i && styles.stepProgressSegmentActive,
                  ]}
                />
              ))}
            </View>

            {/* Header Controls */}
            <View style={styles.headerRow}>
              {step > 0 && step < 4 ? (
                <TouchableOpacity onPress={handleBack} disabled={loading} style={styles.headerBtn}>
                  <Lucide name="chevron-back" size={22} color="#fff" />
                  <Text style={styles.headerBtnText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.headerBtn}>
                  <Text style={styles.headerBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.stepIndicator}>Step {step + 1} of 5</Text>

              {step < 4 ? (
                <TouchableOpacity onPress={handleNext} disabled={loading} style={styles.headerBtn}>
                  <Text style={styles.nextText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleFinalConversion} disabled={loading} style={styles.headerBtn}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#00f5ff" />
                  ) : (
                    <Text style={styles.nextText}>Done</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* STEP 1: VALUE PROPS CAROUSEL / HIGHLIGHTS */}
              {step === 0 && (
                <View style={styles.stepContainer}>
                  <View style={styles.heroBadge}>
                    <Lucide name="sparkles" size={32} color="#00f5ff" />
                  </View>
                  <Text style={styles.heroTitle}>Get Professional Tools</Text>
                  <Text style={styles.heroSub}>
                    Switch your account to unlock creator insights, brand deals, product catalog publishing, and specialized profile controls.
                  </Text>

                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: "rgba(0,245,255,0.1)" }]}>
                        <Lucide name="bar-chart-outline" size={20} color="#00f5ff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>Deep Audience Insights</Text>
                        <Text style={styles.featureDesc}>Track post reach, reel engagement, and follower demographics in real-time.</Text>
                      </View>
                    </View>

                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: "rgba(167,139,250,0.1)" }]}>
                        <Lucide name="briefcase-outline" size={20} color="#a78bfa" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>Brand Deals & Partnerships</Text>
                        <Text style={styles.featureDesc}>Receive official sponsor offers, collab proposals, and direct bank payouts.</Text>
                      </View>
                    </View>

                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: "rgba(251,146,60,0.1)" }]}>
                        <Lucide name="storefront-outline" size={20} color="#fb923c" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>Storefront & Ad Suite</Text>
                        <Text style={styles.featureDesc}>Publish marketplace products, run ad campaigns, and set tax structures.</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: CHOOSE CATEGORY / VERTICAL */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>What best describes you?</Text>
                  <Text style={styles.stepSub}>
                    Categories help people discover your profile across AURA search and discovery nodes.
                  </Text>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>Display category label on profile</Text>
                      <Text style={styles.toggleSub}>Show badge under your username (e.g. ✦ Clothing Brand)</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.switchTrack, showCategoryOnProfile && styles.switchTrackActive]}
                      onPress={() => {
                        triggerHaptic("light");
                        setShowCategoryOnProfile(!showCategoryOnProfile);
                      }}
                    >
                      <View style={[styles.switchThumb, showCategoryOnProfile && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.categoryGrid}>
                    {BRAND_CATEGORIES.map((cat) => {
                      const active = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryChip, active && styles.categoryChipActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setCategory(cat);
                          }}
                        >
                          <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                    <Text style={styles.primaryBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: ACCOUNT TYPE SELECTION (CREATOR VS BUSINESS) */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Are you a Creator or Business?</Text>
                  <Text style={styles.stepSub}>
                    Select the professional account mode that matches your primary goals.
                  </Text>

                  <View style={styles.cardContainer}>
                    {/* CREATOR CARD */}
                    <TouchableOpacity
                      style={[
                        styles.accountCard,
                        targetType === "INFLUENCER" && styles.accountCardActiveCreator,
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setTargetType("INFLUENCER");
                      }}
                    >
                      <View style={styles.accountCardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: "rgba(167,139,250,0.12)" }]}>
                          <Lucide name="sparkles" size={24} color="#a78bfa" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>Creator</Text>
                          <Text style={styles.cardSub}>Best for public figures, content producers, artists, and influencers.</Text>
                        </View>
                        {targetType === "INFLUENCER" && (
                          <Lucide name="checkmark-circle" size={24} color="#a78bfa" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* BUSINESS ATELIER CARD */}
                    <TouchableOpacity
                      style={[
                        styles.accountCard,
                        targetType === "BUSINESS" && styles.accountCardActiveBusiness,
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setTargetType("BUSINESS");
                      }}
                    >
                      <View style={styles.accountCardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: "rgba(251,146,60,0.12)" }]}>
                          <Lucide name="storefront" size={24} color="#fb923c" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>Business / Atelier</Text>
                          <Text style={styles.cardSub}>Best for retailers, local businesses, luxury brands, and product sellers.</Text>
                        </View>
                        {targetType === "BUSINESS" && (
                          <Lucide name="checkmark-circle" size={24} color="#fb923c" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* PERSONAL REVERT CARD */}
                    <TouchableOpacity
                      style={[
                        styles.accountCard,
                        targetType === "PERSONAL" && styles.accountCardActivePersonal,
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setTargetType("PERSONAL");
                      }}
                    >
                      <View style={styles.accountCardHeader}>
                        <View style={[styles.cardIconBox, { backgroundColor: "rgba(0,245,255,0.12)" }]}>
                          <Lucide name="person" size={24} color="#00f5ff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>Personal Profile</Text>
                          <Text style={styles.cardSub}>Revert to a standard personal profile with optional private account mode.</Text>
                        </View>
                        {targetType === "PERSONAL" && (
                          <Lucide name="checkmark-circle" size={24} color="#00f5ff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                    <Text style={styles.primaryBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 4: CONTACT & TAX DETAILS */}
              {step === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Review your contact info</Text>
                  <Text style={styles.stepSub}>
                    Public contact info can be displayed on your profile so clients and buyers can reach you.
                  </Text>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>Display contact info on profile</Text>
                      <Text style={styles.toggleSub}>Show email and call buttons on your profile header</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.switchTrack, showContactOnProfile && styles.switchTrackActive]}
                      onPress={() => {
                        triggerHaptic("light");
                        setShowContactOnProfile(!showContactOnProfile);
                      }}
                    >
                      <View style={[styles.switchThumb, showContactOnProfile && styles.switchThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Public Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="contact@yourbrand.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Public Phone / WhatsApp</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Website Link</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="yourbrand.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={website}
                      onChangeText={setWebsite}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* ATELIER BUSINESS TAX DETAILS */}
                  {targetType === "BUSINESS" && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Tax Structure & Registry</Text>
                      <View style={styles.taxToggleRow}>
                        <TouchableOpacity
                          style={[styles.taxOption, gstExempt && styles.taxOptionActive]}
                          onPress={() => setGstExempt(true)}
                        >
                          <Text style={[styles.taxOptionText, gstExempt && { color: "#34d399" }]}>
                            Non-GST / Exempt
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.taxOption, !gstExempt && styles.taxOptionActive]}
                          onPress={() => setGstExempt(false)}
                        >
                          <Text style={[styles.taxOptionText, !gstExempt && { color: "#fb923c" }]}>
                            GST Registered
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {!gstExempt && (
                        <TextInput
                          style={[styles.input, { marginTop: 10 }]}
                          placeholder="15-character GSTIN (e.g. 29AAAAA1111A1Z1)"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          value={taxId}
                          onChangeText={setTaxId}
                          autoCapitalize="characters"
                          maxLength={15}
                        />
                      )}
                    </View>
                  )}

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
                    <Text style={styles.primaryBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 5: CONFIRMATION & WELCOME SCREEN */}
              {step === 4 && (
                <View style={styles.stepContainer}>
                  <View style={styles.successIconBox}>
                    <Lucide name="checkmark-circle" size={56} color="#00f5ff" />
                  </View>
                  <Text style={styles.heroTitle}>Welcome to your Professional Account!</Text>
                  <Text style={styles.heroSub}>
                    <Text style={{ color: "#00f5ff", fontWeight: "700" }}>@{activeProfile?.username}</Text> is ready with professional creator and business tools.
                  </Text>

                  <View style={styles.actionCardsGroup}>
                    <View style={styles.actionCard}>
                      <Lucide name="create-outline" size={22} color="#00f5ff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionCardTitle}>Complete your profile</Text>
                        <Text style={styles.actionCardSub}>Add a bio, profile photo, and website link.</Text>
                      </View>
                    </View>

                    <View style={styles.actionCard}>
                      <Lucide name="analytics-outline" size={22} color="#a78bfa" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actionCardTitle}>View Audience Insights</Text>
                        <Text style={styles.actionCardSub}>Track real-time reach, views, and follower engagement.</Text>
                      </View>
                    </View>

                    {targetType === "BUSINESS" && (
                      <View style={styles.actionCard}>
                        <Lucide name="briefcase-outline" size={22} color="#fb923c" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.actionCardTitle}>AURA Business Suite</Text>
                          <Text style={styles.actionCardSub}>Publish marketplace products and manage ad campaigns.</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleFinalConversion} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#080415" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Done</Text>
                    )}
                  </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
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
    marginBottom: 6,
  },
  stepProgressBar: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  stepProgressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  stepProgressSegmentActive: {
    backgroundColor: "#00f5ff",
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
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 50,
  },
  headerBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  stepIndicator: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600" },
  nextText: { color: "#00f5ff", fontSize: 15, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  stepContainer: { alignItems: "center" },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,245,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 18, textAlign: "center", marginBottom: 24 },
  featureList: { width: "100%", gap: 16, marginBottom: 24 },
  featureItem: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  featureDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2, lineHeight: 16 },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#080415", fontSize: 15, fontWeight: "800" },
  stepTitle: { color: "#fff", fontSize: 20, fontWeight: "800", alignSelf: "flex-start", marginBottom: 6 },
  stepSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, alignSelf: "flex-start", lineHeight: 18, marginBottom: 20 },
  toggleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  toggleTitle: { color: "#fff", fontSize: 13, fontWeight: "600" },
  toggleSub: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
  switchTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", padding: 2 },
  switchTrackActive: { backgroundColor: "#00f5ff" },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  switchThumbActive: { transform: [{ translateX: 20 }] },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  categoryChipActive: { backgroundColor: "rgba(0,245,255,0.12)", borderColor: "rgba(0,245,255,0.45)" },
  categoryChipText: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  categoryChipTextActive: { color: "#00f5ff", fontWeight: "700" },
  cardContainer: { width: "100%", gap: 12, marginBottom: 24 },
  accountCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  accountCardActiveCreator: { borderColor: "rgba(167,139,250,0.6)", backgroundColor: "rgba(167,139,250,0.08)" },
  accountCardActiveBusiness: { borderColor: "rgba(251,146,60,0.6)", backgroundColor: "rgba(251,146,60,0.08)" },
  accountCardActivePersonal: { borderColor: "rgba(0,245,255,0.6)", backgroundColor: "rgba(0,245,255,0.08)" },
  accountCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2, lineHeight: 16 },
  inputGroup: { width: "100%", marginBottom: 16 },
  inputLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 6 },
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
  taxToggleRow: { flexDirection: "row", gap: 10 },
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
  successIconBox: { marginBottom: 16 },
  actionCardsGroup: { width: "100%", gap: 12, marginBottom: 24 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionCardTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  actionCardSub: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
});
