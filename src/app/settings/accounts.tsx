import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgDivider,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

export default function AccountsSettingsScreen() {
  const {
    triggerHaptic,
    currentUser,
    activeProfile,
    userProfiles,
    switchActiveProfile,
  } = useStore();

  const personalProfile = useMemo(
    () =>
      userProfiles.find((p) => p.type === "PERSONAL") ||
      userProfiles.find((p) => p.type !== "BUSINESS") ||
      userProfiles[0],
    [userProfiles]
  );
  const brandProfiles = useMemo(
    () => userProfiles.filter((p) => p.type === "BUSINESS"),
    [userProfiles]
  );
  const profiles = useMemo(
    () => [...(personalProfile ? [personalProfile] : []), ...brandProfiles],
    [personalProfile, brandProfiles]
  );

  const onSwitch = async (profileId: string) => {
    triggerHaptic("medium");
    const res = await switchActiveProfile(profileId);
    if (!res.success) {
      Alert.alert("Switch failed", res.error || "Could not switch profile.");
    }
  };

  return (
    <IgSettingsScreen title="Accounts Center" largeTitle="Accounts Center">
      <Text style={styles.lead}>
        Manage your connected experiences and account settings across AURA products.
      </Text>

      <IgSectionTitle>Profiles</IgSectionTitle>
      {profiles.map((p, idx) => {
        const isActive = p.id === activeProfile?.id;
        return (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => onSwitch(p.id)}>
            <View style={[styles.profileRow, idx === profiles.length - 1 && styles.rowLast]}>
              {p.logo ? (
                <Image source={{ uri: p.logo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPh}>
                  <Text style={styles.initial}>{(p.name || "U")[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name || currentUser?.name}</Text>
                <Text style={styles.handle}>@{p.username}</Text>
              </View>
              {isActive ? <Lucide name="checkmark-circle" size={22} color={IG.accent} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}

      <IgDivider />

      <IgSectionTitle>Account settings</IgSectionTitle>
      <IgRow
        label="Personal details"
        sublabel="Contact info, birthday, gender"
        onPress={() => router.push("/settings/personal-details" as any)}
      />
      <IgRow
        label="Password and security"
        onPress={() => router.push("/settings/security" as any)}
      />
      <IgRow
        label="Ad preferences"
        sublabel="Personalized ads and data"
        onPress={() => router.push("/settings/privacy" as any)}
        last
      />

      <IgDivider />

      <IgSectionTitle>Data</IgSectionTitle>
      <IgRow label="Download your information" onPress={() => router.push("/settings/data" as any)} />
      <IgRow
        label="Deactivate or delete"
        danger
        onPress={() => router.push("/settings/delete-account" as any)}
        last
      />
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  rowLast: { borderBottomWidth: 0 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPh: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: IG.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: IG.text, fontWeight: "700", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "600", color: IG.text },
  handle: { fontSize: 13, color: IG.textSecondary, marginTop: 2 },
});
