import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeOnboardStyles as styles } from "@/components/home/homeOnboardStyles";
import { homeSwitcherStyles as switcherStyles } from "@/components/home/homeSwitcherStyles";

type ProfileType = "PERSONAL" | "INFLUENCER" | "BUSINESS";

type HomeAddProfileModalProps = {
  visible: boolean;
  profileType: ProfileType;
  profileName: string;
  username: string;
  profilePrivate: boolean;
  profileCategory: string;
  profileWebsite: string;
  profileGstExempt: boolean;
  profileTaxId: string;
  addProfileLoading: boolean;
  influencerCategories: string[];
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  setProfileType: (p: ProfileType) => void;
  setProfileName: (v: string) => void;
  setUsername: (v: string) => void;
  setProfilePrivate: (v: boolean) => void;
  setProfileCategory: (v: string) => void;
  setProfileWebsite: (v: string) => void;
  setProfileGstExempt: (v: boolean) => void;
  setProfileTaxId: (v: string) => void;
  onSubmit: () => void;
};

export function HomeAddProfileModal({
  visible,
  profileType,
  profileName,
  username,
  profilePrivate,
  profileCategory,
  profileWebsite,
  profileGstExempt,
  profileTaxId,
  addProfileLoading,
  influencerCategories,
  triggerHaptic,
  onClose,
  setProfileType,
  setProfileName,
  setUsername,
  setProfilePrivate,
  setProfileCategory,
  setProfileWebsite,
  setProfileGstExempt,
  setProfileTaxId,
  onSubmit,
}: HomeAddProfileModalProps) {
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
              
              <TouchableOpacity 
                onPress={() => onClose()} 
                style={[styles.backBtn, { alignSelf: "flex-start", marginBottom: 20 }]}
              >
                <Lucide name="arrow-back" size={20} color="#fff" />
                <Text style={styles.backBtnText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.headerBlock}>
                <Text style={styles.logoText}>A U R A</Text>
                <Text style={styles.headerTitle}>Mint New Identity Node</Text>
                <Text style={styles.headerSub}>
                  Add another sovereign persona to switch seamlessly and control your publishing algorithms.
                </Text>
              </View>

              {/* Pathway Type Switcher Cards */}
              <View style={switcherStyles.wizardSelectorRow}>
                {[
                  { type: "PERSONAL", label: "Personal", icon: "person-outline", color: "#00f5ff" },
                  { type: "INFLUENCER", label: "Creator", icon: "sparkles-outline", color: "#a78bfa" },
                  { type: "BUSINESS", label: "Maison", icon: "storefront-outline", color: "#fb923c" }
                ].map((item) => {
                  const isActive = profileType === item.type;
                  return (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        switcherStyles.wizardSelectorCard,
                        isActive && { borderColor: item.color, backgroundColor: "rgba(255,255,255,0.03)" }
                      ]}
                      onPress={() => { triggerHaptic("light"); setProfileType(item.type as any); }}
                    >
                      <Lucide name={item.icon as any} size={20} color={isActive ? item.color : "rgba(255,255,255,0.4)"} />
                      <Text style={[switcherStyles.wizardSelectorLabel, isActive && { color: "#fff" }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Shared inputs */}
              <View style={styles.formContainer}>
                
                {/* Profile Display Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Profile Display Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Alok Design Lab"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={profileName}
                    onChangeText={setProfileName}
                  />
                </View>

                {/* Username handle */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sovereign Username Handle</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. alok_design"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* PERSONAL PATHWAY SPECIFICS */}
                {profileType === "PERSONAL" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    <View style={styles.toggleRow}>
                      <View>
                        <Text style={styles.toggleLabel}>Private Account</Text>
                        <Text style={styles.toggleDesc}>
                          {profilePrivate
                            ? "Only approved followers can see your visual feed."
                            : "Your posts will populate discovery nodes globally."}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => { triggerHaptic("light"); setProfilePrivate(!profilePrivate); }}
                        style={[styles.toggleTrack, profilePrivate && styles.toggleTrackActive]}
                      >
                        <View style={[styles.toggleThumb, profilePrivate && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* INFLUENCER / CREATOR PATHWAY SPECIFICS */}
                {profileType === "INFLUENCER" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    <Text style={styles.inputLabel}>Creator Publishing Vertical</Text>
                    <View style={styles.tagsGrid}>
                      {influencerCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => { triggerHaptic("light"); setProfileCategory(cat); }}
                          style={[
                            styles.tagChip,
                            profileCategory === cat && styles.tagChipActive
                          ]}
                        >
                          <Text style={[
                            styles.tagChipText,
                            profileCategory === cat && styles.tagChipTextActive
                          ]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* BUSINESS MAISON PATHWAY SPECIFICS */}
                {profileType === "BUSINESS" && (
                  <View style={{ width: "100%", marginTop: 12 }}>
                    
                    {/* Brand profileWebsite */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Maison Web Link</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. alokmaison.com"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={profileWebsite}
                        onChangeText={setProfileWebsite}
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </View>

                    {/* Tax Registry Option */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Tax Structure Registry</Text>
                      <View style={styles.taxToggleRow}>
                        <TouchableOpacity
                          style={[styles.taxOption, !profileGstExempt && styles.taxOptionActive]}
                          onPress={() => { triggerHaptic("light"); setProfileGstExempt(false); }}
                        >
                          <Text style={[styles.taxOptionText, !profileGstExempt && { color: "#fb923c" }]}>GST Registered</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.taxOption, profileGstExempt && styles.taxOptionActive]}
                          onPress={() => { triggerHaptic("light"); setProfileGstExempt(true); }}
                        >
                          <Text style={[styles.taxOptionText, profileGstExempt && { color: "#34d399" }]}>Non-GST / Exempt</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* GSTIN Input */}
                    {!profileGstExempt && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>15-character GSTIN</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 29AAAAA1111A1Z1"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          value={profileTaxId}
                          onChangeText={setProfileTaxId}
                          autoCapitalize="characters"
                          maxLength={15}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Submit Action */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn, 
                    (addProfileLoading || !profileName.trim() || !username.trim()) && { opacity: 0.6 }
                  ]}
                  activeOpacity={0.85}
                  disabled={addProfileLoading || !profileName.trim() || !username.trim()}
                  onPress={onSubmit}
                >
                  {addProfileLoading ? (
                    <ActivityIndicator size="small" color="#080415" />
                  ) : (
                    <Text style={styles.submitBtnText}>Mint Sovereign Persona</Text>
                  )}
                </TouchableOpacity>

              </View>

            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

  );
}
