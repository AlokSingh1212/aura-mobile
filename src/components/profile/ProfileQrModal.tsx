import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { API_HOST } from "@/constants/api";

type ProfileQrModalProps = {
  visible: boolean;
  username: string;
  profileName?: string;
  avatarUrl?: string | null;
  onClose: () => void;
  triggerHaptic?: (style: "light" | "medium" | "success") => void;
};

export function ProfileQrModal({
  visible,
  username,
  profileName,
  avatarUrl,
  onClose,
  triggerHaptic,
}: ProfileQrModalProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !username) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_HOST}/api/mobile/profile/qr?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setQrImageUrl(data.qrImageUrl);
          setProfileUrl(data.profileUrl);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, username]);

  const handleShare = async () => {
    triggerHaptic?.("medium");
    await Share.share({
      message: `Follow @${username} on AURA\n${profileUrl}`,
      url: profileUrl,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Profile QR code</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.body}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <Text style={styles.initial}>{(profileName || username)[0]?.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.name}>{profileName || username}</Text>
            <Text style={styles.handle}>@{username}</Text>

            {loading ? (
              <ActivityIndicator color="#00f5ff" style={{ marginVertical: 24 }} />
            ) : qrImageUrl ? (
              <Image source={{ uri: qrImageUrl }} style={styles.qr} contentFit="contain" />
            ) : null}

            <Text style={styles.hint}>Scan to open this profile in AURA</Text>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Lucide name="share-outline" size={20} color="#080415" />
              <Text style={styles.shareBtnText}>Share profile link</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#0a0a0a", borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: "70%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  body: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  avatarPh: { backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  initial: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  handle: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 20 },
  qr: { width: 220, height: 220, borderRadius: 12, backgroundColor: "#fff" },
  hint: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 16, textAlign: "center" },
  shareBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00f5ff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: { color: "#080415", fontSize: 15, fontWeight: "700" },
});
