import React, { useState } from "react";
import {
  Alert,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Share,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useStore } from "@/store/useStore";
import { fetchUserDataExport } from "@/lib/authApi";
import { IG } from "@/theme/settingsTheme";

type ExportKey =
  | "profile"
  | "posts"
  | "shop"
  | "messages"
  | "activity"
  | "security";

export default function DataExportScreen() {
  const { currentUser, triggerHaptic } = useStore();
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Record<ExportKey, boolean>>({
    profile: true,
    posts: true,
    shop: true,
    messages: true,
    activity: true,
    security: true,
  });

  const toggle = (key: ExportKey) =>
    setSelected((s) => ({ ...s, [key]: !s[key] }));

  const filterExport = (full: Record<string, unknown>) => {
    const out: Record<string, unknown> = {
      exportedAt: full.exportedAt,
      format: full.format,
    };
    if (selected.profile && full.user) {
      out.user = full.user;
      out.profiles = full.profiles;
    }
    if (selected.posts && full.posts) out.posts = full.posts;
    if (selected.shop) {
      out.orders = full.orders;
      out.wishlist = full.wishlist;
      out.addresses = full.addresses;
      out.paymentMethods = full.paymentMethods;
    }
    if (selected.messages && full.messages) out.conversations = full.messages;
    if (selected.activity && full.activity) out.engagements = full.activity;
    if (selected.security) {
      out.preferences = full.settings;
      out.walletTransactions = full.walletTransactions;
    }
    return out;
  };

  const exportAll = async () => {
    if (!currentUser?.id) {
      Alert.alert("Sign in required");
      return;
    }
    setExporting(true);
    try {
      triggerHaptic("light");
      const res = await fetchUserDataExport(currentUser.id);
      if (!res.success || !res.export) {
        Alert.alert("Export failed", res.error || "Could not fetch your data.");
        return;
      }

      const payload = filterExport(res.export as Record<string, unknown>);
      const json = JSON.stringify(payload, null, 2);
      const fileName = `aura-export-${Date.now()}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Platform.OS !== "web") {
        try {
          await Share.share({
            url: fileUri,
            title: "AURA data export",
            message: "Your AURA data export",
          });
        } catch {
          await Clipboard.setStringAsync(json);
          Alert.alert(
            "Export ready",
            "Your data was copied to the clipboard. Paste into Notes or email to yourself."
          );
        }
      } else {
        await Clipboard.setStringAsync(json);
        Alert.alert("Export ready", "Your data was copied to the clipboard.");
      }
      triggerHaptic("success");
    } catch {
      Alert.alert("Error", "Could not create export.");
    } finally {
      setExporting(false);
    }
  };

  const rows: { key: ExportKey; label: string; hint: string }[] = [
    { key: "profile", label: "Profile information", hint: "Name, username, bio, contact" },
    { key: "posts", label: "Posts and reels", hint: "Captions, media URLs and metadata" },
    { key: "shop", label: "Shop & orders", hint: "Orders, wishlist, addresses, payments" },
    { key: "messages", label: "Messages", hint: "Recent conversation history" },
    { key: "activity", label: "Activity", hint: "Likes, saves and engagement" },
    { key: "security", label: "Preferences", hint: "Settings and wallet history" },
  ];

  return (
    <IgSettingsScreen title="Download your information">
      <IgBodyText>
        Request a full export from AURA servers. Choose sections to include, then save or share the
        JSON file.
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

      <TouchableOpacity
        style={[styles.btn, exporting && styles.btnDisabled]}
        onPress={exportAll}
        disabled={exporting}
      >
        {exporting ? (
          <View style={styles.btnInner}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.btnText}> Preparing export…</Text>
          </View>
        ) : (
          <Text style={styles.btnText}>Create export</Text>
        )}
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
  btnDisabled: { opacity: 0.7 },
  btnInner: { flexDirection: "row", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
