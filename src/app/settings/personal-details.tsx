import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

const GENDERS = ["Male", "Female", "Non-Binary", "Prefer Not to Say"];

export default function PersonalDetailsScreen() {
  const { currentUser, activeProfile, updateProfile, triggerHaptic } = useStore();
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer Not to Say");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(currentUser?.email || activeProfile?.email || "");
    setPhone(String(currentUser?.phone || activeProfile?.phone || ""));
    setDob(currentUser?.dob || "2000-01-01");
    setGender(currentUser?.gender || "Prefer Not to Say");
  }, [currentUser?.id, activeProfile?.id]);

  const save = async () => {
    if (!dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }
    setSaving(true);
    triggerHaptic("medium");
    const res = await updateProfile({
      userId: currentUser?.id,
      dob,
      gender,
      email,
      phone,
    });
    setSaving(false);
    if (res.success) {
      triggerHaptic("success");
      Alert.alert("Saved", "Personal details updated.");
    } else {
      Alert.alert("Error", res.error || "Could not save.");
    }
  };

  return (
    <IgSettingsScreen title="Personal details">
      <IgBodyText>
        Used for account recovery, checkout and age-appropriate content. Never sold to advertisers.
      </IgBodyText>

      <IgSectionTitle>Date of birth</IgSectionTitle>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={IG.textMuted}
        value={dob}
        onChangeText={setDob}
        autoCapitalize="none"
      />

      <IgSectionTitle>Gender</IgSectionTitle>
      <View style={styles.chips}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, gender === g && styles.chipOn]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.chipText, gender === g && styles.chipTextOn]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <IgSectionTitle>Contact</IgSectionTitle>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={IG.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor={IG.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save</Text>
        )}
      </TouchableOpacity>
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: IG.searchBg,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    color: IG.text,
    fontSize: 16,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: IG.searchBg,
  },
  chipOn: { backgroundColor: IG.accent },
  chipText: { color: IG.text, fontSize: 13, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: IG.accent,
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
