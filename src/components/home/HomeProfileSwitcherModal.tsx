import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeSwitcherStyles as styles } from "@/components/home/homeSwitcherStyles";

type UserProfile = {
  id: string;
  name: string;
  username: string;
  type?: string;
  category?: string;
  isPrivate?: boolean;
};

type HomeProfileSwitcherModalProps = {
  visible: boolean;
  userProfiles: UserProfile[];
  activeProfileId?: string;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onSwitchProfile: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  onAddProfile: () => void;
};

export function HomeProfileSwitcherModal({
  visible,
  userProfiles,
  activeProfileId,
  triggerHaptic,
  onClose,
  onSwitchProfile,
  onAddProfile,
}: HomeProfileSwitcherModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.dismissTouchable} 
            onPress={() => onClose()} 
          />
          <View style={styles.panel}>
            {/* Header notch indicator */}
            <View style={styles.notch} />
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Switch Sovereign Identity</Text>
              <TouchableOpacity onPress={() => onClose()}>
                <Lucide name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.profileList}>
              {userProfiles && userProfiles.map((p) => {
                const isActive = activeProfileId === p.id;
                let profileIcon = "person-outline";
                let iconColor = "#00f5ff";
                let bgOverlay = "rgba(0, 245, 255, 0.08)";

                if (p.type === "INFLUENCER") {
                  profileIcon = "sparkles-outline";
                  iconColor = "#a78bfa";
                  bgOverlay = "rgba(167, 139, 250, 0.08)";
                } else if (p.type === "BUSINESS") {
                  profileIcon = "storefront-outline";
                  iconColor = "#fb923c";
                  bgOverlay = "rgba(251, 146, 60, 0.08)";
                }

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.profileCard,
                      isActive && styles.profileCardActive
                    ]}
                    onPress={async () => {
                      triggerHaptic("medium");
                      const res = await onSwitchProfile(p.id);
                      if (res.success) {
                        onClose();
                      } else {
                        Alert.alert("Handshake Interrupted", res.error || "Failed to switch active node.");
                      }
                    }}
                  >
                    <View style={[styles.profileIconCircle, { backgroundColor: bgOverlay }]}>
                      <Lucide name={profileIcon as any} size={22} color={iconColor} />
                    </View>
                    <View style={styles.profileTextBlock}>
                      <Text style={styles.profileNameText}>{p.name}</Text>
                      <Text style={styles.profileUsernameText}>
                        @{p.username} • {p.type === "PERSONAL" ? (p.isPrivate ? "🔒 Private" : "✦ Public") : p.category}
                      </Text>
                    </View>
                    {isActive ? (
                      <Lucide name="checkmark-circle" size={24} color="#00f5ff" />
                    ) : (
                      <View style={styles.uncheckDot} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Add New Profile Trigger */}
              <TouchableOpacity
                style={styles.addProfileBtn}
                onPress={() => {
                  triggerHaptic("medium");
                  onClose();
                  setTimeout(() => {
                    onAddProfile();
                  }, 100);
                }}
              >
                <View style={styles.addProfileIconCircle}>
                  <Lucide name="add" size={24} color="#00f5ff" />
                </View>
                <Text style={styles.addProfileBtnText}>Create New Sovereign Identity</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

  );
}
