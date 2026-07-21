import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { profileModalStyles as styles } from "@/components/profile/profileModalStyles";

type UserProfile = {
  id: string;
  name?: string;
  username?: string;
  category?: string;
};

type ProfileSwitcherModalProps = {
  visible: boolean;
  userProfiles: UserProfile[];
  activeProfileId?: string;
  onClose: () => void;
  onSwitchProfile: (profileId: string) => void;
  onAddBrandProfile: () => void;
};

export function ProfileSwitcherModal({
  visible,
  userProfiles,
  activeProfileId,
  onClose,
  onSwitchProfile,
  onAddBrandProfile,
}: ProfileSwitcherModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.switcherBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.switcherPanel} onStartShouldSetResponder={() => true}>
          <View style={styles.switcherHandle} />
          <Text style={styles.switcherTitle}>Switch profile</Text>

          <ScrollView style={styles.switcherList} showsVerticalScrollIndicator={false}>
            {userProfiles.map((m) => {
              const isActive = m.id === activeProfileId;
              const initials = m.name
                ? m.name.substring(0, 2).toUpperCase()
                : (m.username || "").substring(0, 2).toUpperCase();

              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.switcherItem, isActive && styles.switcherItemActive]}
                  onPress={() => onSwitchProfile(m.id)}
                >
                  <View style={[styles.switcherAvatar, isActive && styles.switcherAvatarActive]}>
                    <Text style={styles.switcherAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.switcherInfo}>
                    <Text style={styles.switcherMaisonId}>@{m.username}</Text>
                    <Text style={styles.switcherMaisonName}>
                      {m.name || "AURA Profile"} •{" "}
                      <Text style={{ color: "#00f5ff", fontSize: 10.5 }}>{m.category || "Personal"}</Text>
                    </Text>
                  </View>
                  {isActive && (
                    <View style={styles.switcherCheck}>
                      <Lucide name="checkmark-circle" size={20} color="#00f5ff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.addBrandBtn} onPress={onAddBrandProfile}>
            <Lucide name="add-circle-outline" size={22} color="#00f5ff" />
            <Text style={styles.addBrandBtnText}>Add brand profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
