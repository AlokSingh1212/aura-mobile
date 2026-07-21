import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Linking,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { profilePortalStyles as portalStyles } from "@/components/profile/profilePortalStyles";

type ProfileSummary = {
  id: string;
  username?: string;
  name?: string;
  logo?: string | null;
  category?: string;
};

type ActiveSession = {
  id: string;
  device: string;
  location: string;
  active: boolean;
  icon: string;
};

type ProfileAccountsCenterModalProps = {
  visible: boolean;
  topInset: number;
  personalProfile: ProfileSummary | null | undefined;
  brandProfiles: ProfileSummary[];
  activeProfileId?: string;
  currentUserName?: string;
  activeSessions: ActiveSession[];
  fediverseSharing: boolean;
  alertsEnabled: boolean;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  regionLockEnabled: boolean;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onSwitchProfile: (profileId: string) => void;
  onOpenPersonalDetails: () => void;
  onOpenBusinessSuite: () => void;
  onDownloadInformation: () => void;
  onDeactivateMaison: () => void;
  onToggleFediverse: () => void;
  onToggleAlerts: () => void;
  onToggleBiometric: () => void;
  onToggleTwoFactor: () => void;
  onToggleRegionLock: () => void;
  onRevokeSession: (sessionId: string) => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
};

export function ProfileAccountsCenterModal({
  visible,
  topInset,
  personalProfile,
  brandProfiles,
  activeProfileId,
  currentUserName,
  activeSessions,
  fediverseSharing,
  alertsEnabled,
  biometricEnabled,
  twoFactorEnabled,
  regionLockEnabled,
  triggerHaptic,
  onClose,
  onSwitchProfile,
  onOpenPersonalDetails,
  onOpenBusinessSuite,
  onDownloadInformation,
  onDeactivateMaison,
  onToggleFediverse,
  onToggleAlerts,
  onToggleBiometric,
  onToggleTwoFactor,
  onToggleRegionLock,
  onRevokeSession,
  onOpenOnboarding,
  onLogout,
}: ProfileAccountsCenterModalProps) {
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
              <TouchableOpacity onPress={() => onClose()}>
                <Text style={portalStyles.editModalCancelText}>Close</Text>
              </TouchableOpacity>
              <Text style={portalStyles.editModalTitle}>Accounts Center</Text>
              <TouchableOpacity onPress={() => onClose()}>
                <Text style={portalStyles.editModalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={portalStyles.editModalScroll} showsVerticalScrollIndicator={false}>
              
              {/* META-STYLE SUBTITLE & DECK INFO */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>AURA Identity & Access</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 12, lineHeight: 16 }}>Manage your connected profiles, personal governance, payments, and system security credentials across all ledger flagships.</Text>
              </View>

              {/* 1. CONNECTED PROFILES DECK */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Profiles Mesh</Text>
              <View style={portalStyles.accountsCenterCard}>
                {/* Personal Profile */}
                {personalProfile && (
                  <TouchableOpacity 
                    style={portalStyles.accountsCenterProfileRow}
                    onPress={() => {
                      triggerHaptic("medium");
                      onSwitchProfile(personalProfile.id);
                      onClose();
                    }}
                  >
                    <View style={[portalStyles.profileTabCircle, { borderWidth: (activeProfileId === personalProfile.id) ? 1.5 : 0, borderColor: "#00f5ff", width: 40, height: 40, borderRadius: 20, overflow: "hidden", marginRight: 12, padding: 0, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
                      {personalProfile.logo ? (
                        <Image 
                          source={{ uri: personalProfile.logo }} 
                          style={{ width: "100%", height: "100%" }} 
                        />
                      ) : (
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                          {(personalProfile.name || "U")[0]?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{personalProfile.name || currentUserName || "Curator"}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Personal Creator Profile (@{personalProfile.username})</Text>
                    </View>
                    {activeProfileId === personalProfile.id && (
                      <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Available Brand profiles */}
                {brandProfiles.map((m, idx) => {
                  const isActive = m.id === activeProfileId;
                  const initials = (m.name || "R")[0]?.toUpperCase() || "R";
                  return (
                    <TouchableOpacity 
                      key={m.id || idx}
                      style={[portalStyles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                      onPress={() => {
                        triggerHaptic("medium");
                        onSwitchProfile(m.id);
                        onClose();
                      }}
                    >
                      <View style={[portalStyles.profileTabCircle, { width: 40, height: 40, borderRadius: 20, backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", marginRight: 12, borderWidth: isActive ? 1.5 : 0, borderColor: "#00f5ff", padding: 0 }]}>
                        <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>{m.name}</Text>
                        <Text style={{ color: "#8e8e8e", fontSize: 11 }}>Sovereign Brand Maison (@{m.username})</Text>
                      </View>
                      {isActive && (
                        <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 👥 PERSONAL DETAILS SECTION */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Personal Information</Text>
              <View style={portalStyles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[portalStyles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    onOpenPersonalDetails();
                  }}
                >
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="person-circle-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Personal Details</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage Date of Birth, Gender, and contact phone/email verification nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 💼 AURA BUSINESS SUITE SECTION */}
              <Text style={portalStyles.accountsCenterSectionTitle}>AURA Business & Marketing</Text>
              <View style={portalStyles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[portalStyles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={() => {
                    triggerHaptic("medium");
                    onClose();
                    onOpenBusinessSuite();
                  }}
                >
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="business-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>AURA Business Suite</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Manage e-commerce catalogs, billing ad accounts, team members, and pixel conversion stats.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 2. DATA SOVEREIGNITY & GOVERNANCE */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Sovereign Data & Portability</Text>
              <View style={portalStyles.accountsCenterCard}>
                <TouchableOpacity 
                  style={[portalStyles.accountsCenterProfileRow, { paddingVertical: 4 }]}
                  onPress={onDownloadInformation}
                >
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="cloud-download-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Download Your Information</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Export a JSON archive copy of your credentials, inventory, and ledgers.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[portalStyles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12, paddingVertical: 4 }]}
                  onPress={onDeactivateMaison}
                >
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="close-circle-outline" size={20} color="#ff3b30" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ff3b30", fontSize: 13, fontWeight: "bold" }}>Deactivate or Delete Node</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Temporarily suspend or permanently purge specific brand ledger nodes.</Text>
                  </View>
                  <Lucide name="chevron-forward-outline" size={16} color="#8e8e8e" />
                </TouchableOpacity>
              </View>

              {/* 3. FEDIVERSE & SOCIAL CROSSOVERS */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Connected Social & Fediverse</Text>
              <View style={portalStyles.accountsCenterCard}>
                <View style={portalStyles.accountsCenterProfileRow}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="share-social-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Fediverse Sharing (ActivityPub)</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Federate and auto-broadcast your e-commerce artifacts to Mastodon & open platforms.</Text>
                  </View>
                  <TouchableOpacity onPress={onToggleFediverse}>
                    <Lucide name={fediverseSharing ? "toggle" : "toggle-outline"} size={36} color={fediverseSharing ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[portalStyles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="globe-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Web Autoshare Crossovers</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Automatically mirror visual stories published in-app directly to the Next.js storefront.</Text>
                  </View>
                  <TouchableOpacity onPress={onToggleAlerts}>
                    <Lucide name={alertsEnabled ? "toggle" : "toggle-outline"} size={36} color={alertsEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. SECURITY PROTOCOLS */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Identity Security Protocol</Text>
              <View style={portalStyles.accountsCenterCard}>
                <View style={portalStyles.accountsCenterProfileRow}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="finger-print-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Biometric Identification</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Use FaceID or TouchID for executing high-value ledger acquisitions.</Text>
                  </View>
                  <TouchableOpacity onPress={onToggleBiometric}>
                    <Lucide name={biometricEnabled ? "toggle" : "toggle-outline"} size={36} color={biometricEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[portalStyles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="lock-closed-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Sovereign 2FA</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Direct hardware tokens required to commit critical parameter adjustments.</Text>
                  </View>
                  <TouchableOpacity onPress={onToggleTwoFactor}>
                    <Lucide name={twoFactorEnabled ? "toggle" : "toggle-outline"} size={36} color={twoFactorEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>

                <View style={[portalStyles.accountsCenterProfileRow, { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}>
                  <View style={portalStyles.accountsCenterIconWrapper}>
                    <Lucide name="shield-checkmark-outline" size={20} color="#00f5ff" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Geographic Node Lock</Text>
                    <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>Restrict profile operations to your current geographic coordinates.</Text>
                  </View>
                  <TouchableOpacity onPress={onToggleRegionLock}>
                    <Lucide name={regionLockEnabled ? "toggle" : "toggle-outline"} size={36} color={regionLockEnabled ? "#00f5ff" : "#8e8e8e"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. ACTIVE LOGINS & NODE DEVICES */}
              <Text style={portalStyles.accountsCenterSectionTitle}>Active Node Logins (Where You're Logged In)</Text>
              <View style={portalStyles.accountsCenterCard}>
                {activeSessions.map((s, idx) => (
                  <View 
                    key={s.id}
                    style={[portalStyles.accountsCenterProfileRow, idx > 0 && { borderTopWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 12 }]}
                  >
                    <View style={portalStyles.accountsCenterIconWrapper}>
                      <Lucide name={s.icon as any} size={20} color="#00f5ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>{s.device}</Text>
                      <Text style={{ color: "#8e8e8e", fontSize: 10, marginTop: 2 }}>{s.location} • {s.active ? "Active Node Session" : "Logged in recently"}</Text>
                    </View>
                    {!s.active ? (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(255,59,48,0.12)", borderRadius: 6 }}
                        onPress={() => onRevokeSession(s.id)}
                      >
                        <Text style={{ color: "#ff3b30", fontSize: 10, fontWeight: "bold" }}>Revoke</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "rgba(0,245,255,0.12)", borderRadius: 6 }}>
                        <Text style={{ color: "#00f5ff", fontSize: 10, fontWeight: "bold" }}>Current</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* SOVEREIGN MERCH ONBOARDING DECK */}
              <View style={{ marginHorizontal: 16, marginVertical: 30, padding: 20, backgroundColor: "rgba(0,245,255,0.03)", borderStyle: "dashed", borderWidth: 1.5, borderColor: "rgba(0,245,255,0.2)", borderRadius: 16, alignItems: "center" }}>
                <Lucide name="rocket-outline" size={32} color="#00f5ff" style={{ marginBottom: 12 }} />
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold", marginBottom: 6 }}>Become a Maison Director</Text>
                <Text style={{ color: "#8e8e8e", fontSize: 11, textAlign: "center", lineHeight: 16, marginBottom: 16 }}>Transform from a consumer node to a primary e-commerce supply hub. Architect flagships, manage inventories, and publish design catalogs directly.</Text>
                <TouchableOpacity 
                  style={{ width: "100%", backgroundColor: "#00f5ff", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}
                  onPress={() => {
                    triggerHaptic("success");
                    onOpenOnboarding();
                  }}
                >
                  <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5 }}>Commence Onboarding</Text>
                </TouchableOpacity>
              </View>

              {/* LOG OUT BUTTON */}
              <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 30 }}>
                <TouchableOpacity 
                  style={{ width: "100%", paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255, 59, 48, 0.15)", borderWidth: 1, borderColor: "rgba(255, 59, 48, 0.25)", alignItems: "center" }}
                  onPress={() => {
                    onLogout()
                  }}
                >
                  <Text style={{ color: "#ff3b30", fontSize: 12, fontWeight: "bold", letterSpacing: 1.5 }}>LOG OUT OF NODE</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

  );
}
