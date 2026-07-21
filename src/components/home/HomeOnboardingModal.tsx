import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeOnboardStyles as styles } from "@/components/home/homeOnboardStyles";

type OnboardStep = "select" | "personal" | "influencer" | "business";

type HomeOnboardingModalProps = {
  visible: boolean;
  step: OnboardStep;
  onboardPrivate: boolean;
  onboardLoading: boolean;
  onboardInfluencerCategory: string;
  onboardBrandName: string;
  onboardWebsite: string;
  onboardGstExempt: boolean;
  onboardTaxId: string;
  influencerCategories: string[];
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onSkipToSettings: () => void;
  setStep: (step: OnboardStep) => void;
  setOnboardPrivate: (v: boolean) => void;
  setOnboardInfluencerCategory: (v: string) => void;
  setOnboardBrandName: (v: string) => void;
  setOnboardWebsite: (v: string) => void;
  setOnboardGstExempt: (v: boolean) => void;
  setOnboardTaxId: (v: string) => void;
  onSubmit: (type: "PERSONAL" | "INFLUENCER" | "BUSINESS") => void;
};

export function HomeOnboardingModal({
  visible,
  step,
  onboardPrivate,
  onboardLoading,
  onboardInfluencerCategory,
  onboardBrandName,
  onboardWebsite,
  onboardGstExempt,
  onboardTaxId,
  influencerCategories,
  triggerHaptic,
  onClose,
  onSkipToSettings,
  setStep,
  setOnboardPrivate,
  setOnboardInfluencerCategory,
  setOnboardBrandName,
  setOnboardWebsite,
  setOnboardGstExempt,
  setOnboardTaxId,
  onSubmit,
}: HomeOnboardingModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

              {/* Header */}
              <View style={styles.headerBlock}>
                <Text style={styles.logoText}>A U R A</Text>
                <Text style={styles.headerTitle}>Sovereign Identity Setup</Text>
                <Text style={styles.headerSub}>
                  Configure your publishing governance and data visibility from day one.
                </Text>
              </View>

              {/* ─── STEP: SELECT ACCOUNT TYPE ─── */}
              {step === "select" && (
                <View style={styles.pathsContainer}>

                  {/* Personal */}
                  <TouchableOpacity
                    style={styles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setStep("personal"); }}
                  >
                    <View style={[styles.pathIconCircle, { backgroundColor: "rgba(0,245,255,0.12)" }]}>
                      <Lucide name="person-outline" size={28} color="#00f5ff" />
                    </View>
                    <View style={styles.pathTextBlock}>
                      <Text style={styles.pathTitle}>Personal Node</Text>
                      <Text style={styles.pathDesc}>Public or Private sovereign profile with feed-level privacy control.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                  {/* Influencer */}
                  <TouchableOpacity
                    style={styles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setStep("influencer"); }}
                  >
                    <View style={[styles.pathIconCircle, { backgroundColor: "rgba(167,139,250,0.12)" }]}>
                      <Lucide name="sparkles-outline" size={28} color="#a78bfa" />
                    </View>
                    <View style={styles.pathTextBlock}>
                      <Text style={styles.pathTitle}>Influencer / Creator</Text>
                      <Text style={styles.pathDesc}>Select your content vertical and unlock creator tools and brand deals.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                  {/* Business */}
                  <TouchableOpacity
                    style={styles.pathCard}
                    activeOpacity={0.8}
                    onPress={() => { triggerHaptic("medium"); setStep("business"); }}
                  >
                    <View style={[styles.pathIconCircle, { backgroundColor: "rgba(251,146,60,0.12)" }]}>
                      <Lucide name="storefront-outline" size={28} color="#fb923c" />
                    </View>
                    <View style={styles.pathTextBlock}>
                      <Text style={styles.pathTitle}>Business Maison</Text>
                      <Text style={styles.pathDesc}>Commercial brand with KYB verification, tax registry, and seller dashboard.</Text>
                    </View>
                    <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => {
                      triggerHaptic("light");
                      onClose();
                      onSkipToSettings();
                    }}
                  >
                    <Text style={styles.skipBtnText}>Set up later in Settings</Text>
                  </TouchableOpacity>

                </View>
              )}

              {/* ─── STEP: PERSONAL ─── */}
              {step === "personal" && (
                <View style={styles.formContainer}>
                  <TouchableOpacity onPress={() => setStep("select")} style={styles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[styles.pathIconCircle, { backgroundColor: "rgba(0,245,255,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="person-outline" size={32} color="#00f5ff" />
                  </View>
                  <Text style={styles.formTitle}>Personal Node</Text>
                  <Text style={styles.formSub}>Choose your account visibility governance.</Text>

                  {/* Privacy Toggle */}
                  <View style={styles.toggleRow}>
                    <View>
                      <Text style={styles.toggleLabel}>Private Account</Text>
                      <Text style={styles.toggleDesc}>
                        {onboardPrivate
                          ? "Only approved followers can see your posts."
                          : "Your profile and posts are visible to everyone."}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { triggerHaptic("light"); setOnboardPrivate(!onboardPrivate); }}
                      style={[styles.toggleTrack, onboardPrivate && styles.toggleTrackActive]}
                    >
                      <View style={[styles.toggleThumb, onboardPrivate && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  {/* Visibility Badge */}
                  <View style={[styles.visibilityBadge, { backgroundColor: onboardPrivate ? "rgba(239,68,68,0.1)" : "rgba(52,211,153,0.1)" }]}>
                    <Lucide name={onboardPrivate ? "lock-closed" : "globe-outline"} size={16} color={onboardPrivate ? "#ef4444" : "#34d399"} />
                    <Text style={[styles.visibilityText, { color: onboardPrivate ? "#ef4444" : "#34d399" }]}>
                      {onboardPrivate ? "Private — Restricted Mesh Visibility" : "Public — Open Sovereign Profile"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, onboardLoading && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading}
                    onPress={() => onSubmit("PERSONAL")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.submitBtnText}>Activate Sovereign Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP: INFLUENCER ─── */}
              {step === "influencer" && (
                <View style={styles.formContainer}>
                  <TouchableOpacity onPress={() => setStep("select")} style={styles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[styles.pathIconCircle, { backgroundColor: "rgba(167,139,250,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="sparkles-outline" size={32} color="#a78bfa" />
                  </View>
                  <Text style={styles.formTitle}>Creator Profile</Text>
                  <Text style={styles.formSub}>Select your primary content vertical.</Text>

                  {/* Category Tags Grid */}
                  <View style={styles.tagsGrid}>
                    {influencerCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => { triggerHaptic("light"); setOnboardInfluencerCategory(cat); }}
                        style={[
                          styles.tagChip,
                          onboardInfluencerCategory === cat && styles.tagChipActive
                        ]}
                      >
                        <Text style={[
                          styles.tagChipText,
                          onboardInfluencerCategory === cat && styles.tagChipTextActive
                        ]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, onboardLoading && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading}
                    onPress={() => onSubmit("INFLUENCER")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.submitBtnText}>Activate Creator Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP: BUSINESS ─── */}
              {step === "business" && (
                <View style={styles.formContainer}>
                  <TouchableOpacity onPress={() => setStep("select")} style={styles.backBtn}>
                    <Lucide name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <View style={[styles.pathIconCircle, { backgroundColor: "rgba(251,146,60,0.12)", alignSelf: "center", marginBottom: 16 }]}>
                    <Lucide name="storefront-outline" size={32} color="#fb923c" />
                  </View>
                  <Text style={styles.formTitle}>Business Maison</Text>
                  <Text style={styles.formSub}>Register your commercial brand on the AURA mesh.</Text>

                  {/* Brand Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Brand Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Rare Raven"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={onboardBrandName}
                      onChangeText={setOnboardBrandName}
                    />
                  </View>

                  {/* Website */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Website</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. rareraven.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={onboardWebsite}
                      onChangeText={setOnboardWebsite}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>

                  {/* Tax Structure Selector */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Tax Structure</Text>
                    <View style={styles.taxToggleRow}>
                      <TouchableOpacity
                        style={[styles.taxOption, !onboardGstExempt && styles.taxOptionActive]}
                        onPress={() => { triggerHaptic("light"); setOnboardGstExempt(false); }}
                      >
                        <Lucide name="document-text-outline" size={16} color={!onboardGstExempt ? "#fb923c" : "rgba(255,255,255,0.4)"} />
                        <Text style={[styles.taxOptionText, !onboardGstExempt && { color: "#fb923c" }]}>GST Registered</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.taxOption, onboardGstExempt && styles.taxOptionActive]}
                        onPress={() => { triggerHaptic("light"); setOnboardGstExempt(true); }}
                      >
                        <Lucide name="shield-checkmark-outline" size={16} color={onboardGstExempt ? "#34d399" : "rgba(255,255,255,0.4)"} />
                        <Text style={[styles.taxOptionText, onboardGstExempt && { color: "#34d399" }]}>Non-GST / Exempt</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* GSTIN Input (conditional) */}
                  {!onboardGstExempt && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>GSTIN / VAT ID</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={onboardTaxId}
                        onChangeText={setOnboardTaxId}
                        autoCapitalize="characters"
                        maxLength={15}
                      />
                      <Text style={styles.inputHint}>Standard 15-character alphanumeric tax identifier.</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.submitBtn, (onboardLoading || !onboardBrandName.trim()) && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    disabled={onboardLoading || !onboardBrandName.trim()}
                    onPress={() => onSubmit("BUSINESS")}
                  >
                    {onboardLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.submitBtnText}>Activate Maison Identity</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

  );
}
