import React, { useState } from "react";
import { Alert, TouchableOpacity, Text, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

type ExportKey =
  | "profile"
  | "posts"
  | "shop"
  | "messages"
  | "activity"
  | "security";

export default function DataExportScreen() {
  const { currentUser, activeProfile, userProfiles, wishlist, triggerHaptic } = useStore();
  const [selected, setSelected] = useState<Record<ExportKey, boolean>>({
    profile: true,
    posts: true,
    shop: true,
    messages: false,
    activity: true,
    security: true,
  });

  const toggle = (key: ExportKey) =>
    setSelected((s) => ({ ...s, [key]: !s[key] }));

  const exportAll = async () => {
    triggerHaptic("success");
    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      format: "AURA_JSON_v2",
    };
    if (selected.profile) {
      payload.profile = { user: currentUser, activeProfile, profiles: userProfiles };
    }
    if (selected.shop) {
      payload.shop = { wishlist };
    }
    if (selected.security) {
      payload.security = { note: "Passwords and tokens are never included in exports." };
    }
    if (selected.posts) payload.posts = { note: "Request full post archive from support for large accounts." };
    if (selected.messages) payload.messages = { note: "DM export available on web dashboard." };
    if (selected.activity) payload.activity = { note: "See Settings → Your activity for recent history." };

    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    Alert.alert(
      "Export ready",
      "Your selected data was copied to the clipboard. Paste into Notes or email to yourself."
    );
  };

  const rows: { key: ExportKey; label: string; hint: string }[] = [
    { key: "profile", label: "Profile information", hint: "Name, username, bio, contact" },
    { key: "posts", label: "Posts and reels", hint: "Metadata and captions" },
    { key: "shop", label: "Shop & wishlist", hint: "Saved products and preferences" },
    { key: "messages", label: "Messages", hint: "Requires web export for full history" },
    { key: "activity", label: "Activity", hint: "Likes, saves and watch history" },
    { key: "security", label: "Security settings", hint: "Preferences, not secrets" },
  ];

  return (
    <IgSettingsScreen title="Download your information">
      <IgBodyText>
        Choose what to include. Instagram-style exports help you move or backup your AURA data.
      </IgBodyText>

      <IgSectionTitle>Select data</IgSectionTitle>
      {rows.map((r, idx) => (
        <IgToggle
          key={r.key}
          label={r.label}
          hint={r.hint}
          value={selected[r.key]}
          onValueChange={() => toggle(r.key)}
          last={idx === rows.length - 1}
        />
      ))}

      <TouchableOpacity style={styles.btn} onPress={exportAll}>
        <Text style={styles.btnText}>Create export</Text>
      </TouchableOpacity>
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: IG.accent,
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
