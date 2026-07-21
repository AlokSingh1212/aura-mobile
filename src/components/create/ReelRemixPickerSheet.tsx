import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

type ReelOption = {
  id: string;
  caption: string;
  thumbnail: string;
  creatorUsername?: string;
};

type ReelRemixPickerSheetProps = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSelect: (reelId: string, caption?: string) => void;
};

export function ReelRemixPickerSheet({ visible, userId, onClose, onSelect }: ReelRemixPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reels, setReels] = useState<ReelOption[]>([]);

  const loadReels = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/feed?userId=${userId}&limit=30&tab=For%20You`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.feed)) {
        const videoItems = data.feed
          .filter((item: any) => item.type === "CREATOR_COMMERCE" || item.content?.videoUrl)
          .map((item: any) => ({
            id: item.id,
            caption: item.content?.caption || "",
            thumbnail: item.content?.thumbnail || item.content?.mediaUrl || "",
            creatorUsername: item.creator?.username,
          }));
        setReels(videoItems);
      }
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) loadReels();
  }, [visible, loadReels]);

  const filtered = reels.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return r.caption.toLowerCase().includes(q) || r.creatorUsername?.toLowerCase().includes(q);
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Remix a reel</Text>
            <View style={{ width: 60 }} />
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search reels…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
          />

          {loading ? (
            <ActivityIndicator color="#00f5ff" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: 8 }}
              ListEmptyComponent={<Text style={styles.empty}>No reels found</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cell}
                  onPress={() => {
                    onSelect(item.id, item.caption);
                    onClose();
                  }}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} contentFit="cover" />
                  <View style={styles.remixBadge}>
                    <Lucide name="git-branch-outline" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)" },
  sheet: { flex: 1, marginTop: 60, backgroundColor: "#0a0a0a", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancel: { color: "#fff", fontSize: 16 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
  },
  cell: { flex: 1 / 3, aspectRatio: 9 / 16, padding: 4, position: "relative" },
  thumb: { width: "100%", height: "100%", borderRadius: 8, backgroundColor: "#222" },
  remixBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 4,
  },
  empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 40 },
});
