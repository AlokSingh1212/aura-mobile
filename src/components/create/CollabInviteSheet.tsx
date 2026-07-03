import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { searchProfiles } from "@/lib/postComposerSearch";
import type { CollabPartner } from "@/lib/postComposerTypes";

interface CollabInviteSheetProps {
  visible: boolean;
  partner: CollabPartner | null;
  onClose: () => void;
  onSelect: (partner: CollabPartner | null) => void;
}

/** Invite one co-author (Instagram-style Collab post). */
export function CollabInviteSheet({ visible, partner, onClose, onSelect }: CollabInviteSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; title: string; subtitle: string; imageUri: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const profiles = await searchProfiles(text);
      setResults(
        profiles.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `@${p.username}`,
          imageUri: p.logo,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [visible, query, runSearch]);

  const pickPartner = (item: { id: string; title: string; subtitle: string; imageUri: string | null }) => {
    onSelect({
      profileId: item.id,
      username: item.subtitle.replace(/^@/, ""),
      name: item.title,
      logo: item.imageUri,
      status: "pending",
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Invite collab</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.hint}>
          A collab partner is a co-author — their name appears next to yours and the post can show on both profiles. This is not a photo tag or @mention.
        </Text>

        {partner ? (
          <View style={styles.selectedRow}>
            {partner.logo ? (
              <Image source={{ uri: partner.logo }} style={styles.thumb} />
            ) : (
              <View style={styles.iconCircle}>
                <Text style={styles.iconLetter}>{partner.name[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{partner.name}</Text>
              <Text style={styles.rowSub}>@{partner.username} · pending invite</Text>
            </View>
            <TouchableOpacity onPress={() => onSelect(null)}>
              <Lucide name="close-circle" size={22} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search co-author…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus={!partner}
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#00f5ff" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim() ? "No profiles found" : "Search for one collab partner"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => pickPartner(item)}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                ) : (
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconLetter}>{item.title[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.subtitle}</Text>
                </View>
                <Lucide name="people" size={18} color="#00f5ff" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 24,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  thumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#111" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLetter: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
