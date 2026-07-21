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
import Lucide from "@expo/vector-icons/Ionicons";
import { profilePortalStyles as portalStyles } from "@/components/profile/profilePortalStyles";

type ProfilePersonalDetailsModalProps = {
  visible: boolean;
  topInset: number;
  personalDob: string;
  personalGender: string;
  personalEmail: string;
  personalPhone: string;
  isVerifiedUser: boolean;
  isUpdating: boolean;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onSave: () => void;
  onRequestVerification: () => void;
  setPersonalDob: (v: string) => void;
  setPersonalGender: (v: string) => void;
  setPersonalEmail: (v: string) => void;
  setPersonalPhone: (v: string) => void;
};

export function ProfilePersonalDetailsModal({
  visible,
  topInset,
  personalDob,
  personalGender,
  personalEmail,
  personalPhone,
  isVerifiedUser,
  isUpdating,
  triggerHaptic,
  onClose,
  onSave,
  onRequestVerification,
  setPersonalDob,
  setPersonalGender,
  setPersonalEmail,
  setPersonalPhone,
}: ProfilePersonalDetailsModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={[portalStyles.editModalContainer, { paddingTop: topInset }]}>
          <View style={{ flex: 1 }}>
            {/* Header bar */}
            <View style={portalStyles.editModalNavBar}>
              <TouchableOpacity onPress={onClose}>
                <Text style={portalStyles.editModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={portalStyles.editModalTitle}>Personal Details</Text>
              <TouchableOpacity onPress={onSave} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator color="#00f5ff" size="small" />
                ) : (
                  <Text style={portalStyles.editModalDoneText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={portalStyles.editModalScroll} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Social Data Ledger</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>AURA keeps your personal metadata secure. It is never federated to standard advertising systems or public catalog nodes.</Text>
              </View>

              {/* Date of Birth Form block */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Date of Birth</Text>
              <View style={portalStyles.accountsCenterCard}>
                <View style={portalStyles.inputFieldRow}>
                  <Lucide name="calendar-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#555"
                    value={personalDob}
                    onChangeText={setPersonalDob}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Gender selection Form block */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Gender</Text>
              <View style={[portalStyles.accountsCenterCard, { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 16 }]}>
                {["Male", "Female", "Non-Binary", "Prefer Not to Say"].map((g) => {
                  const isSelected = personalGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isSelected ? "#00f5ff" : "rgba(255,255,255,0.08)",
                      }}
                      onPress={() => {
                        triggerHaptic("light");
                        setPersonalGender(g);
                      }}
                    >
                      <Text style={{ color: isSelected ? "#080415" : "#fff", fontSize: 12, fontWeight: "bold" }}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Contact Information Form block */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Contact Information</Text>
              <View style={portalStyles.accountsCenterCard}>
                <View style={portalStyles.inputFieldRow}>
                  <Lucide name="mail-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Email Address"
                    placeholderTextColor="#555"
                    value={personalEmail}
                    onChangeText={setPersonalEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
                <View style={[portalStyles.inputFieldRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <Lucide name="call-outline" size={20} color="#8e8e8e" style={{ marginRight: 12 }} />
                  <TextInput
                    style={{ flex: 1, color: "#fff", fontSize: 14 }}
                    placeholder="Phone Number"
                    placeholderTextColor="#555"
                    value={personalPhone}
                    onChangeText={setPersonalPhone}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Identity Verification Badging status */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Identity Verification Node</Text>
              <TouchableOpacity style={portalStyles.accountsCenterCard} onPress={onRequestVerification}>
                <View style={portalStyles.accountsCenterProfileRow}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color={isVerifiedUser ? "#00f5ff" : "#8e8e8e"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                      {isVerifiedUser ? "Sovereign Mark Verified" : "Unverified Identity node"}
                    </Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>
                      {isVerifiedUser 
                        ? "Your identity ledger keys match AURA cryptographic primary trust." 
                        : "Submit government-issued business tax registers to unlock verified metadata markers."}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

  );
}
