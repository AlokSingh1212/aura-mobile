import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { searchProfiles, type ProfileSearchResult } from "@/lib/postComposerSearch";

export type MentionPick = ProfileSearchResult;

type Props = {
  visible: boolean;
  onClose: () => void;
  onDone: (profiles: MentionPick[]) => void;
};

export function StoryMentionPicker({ visible, onClose, onDone }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [selected, setSelected] = useState<Map<string, ProfileSearchResult>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const rows = await searchProfiles(query);
        if (!cancelled) setResults(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, visible]);

  const toggle = (p: ProfileSearchResult) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, p);
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.searchRow}>
            <Lucide name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <Text style={styles.hint}>
            People added here will be mentioned in your story but their username won't always be
            visible on the sticker.
          </Text>
          {!query.trim() ? (
            <Text style={styles.empty}>Search for people to mention</Text>
          ) : loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#0095f6" />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const on = selected.has(item.id);
                return (
                  <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
                    {item.logo ? (
                      <Image source={{ uri: item.logo }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarLetter}>{item.username[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name || item.username}</Text>
                      <Text style={styles.username}>@{item.username}</Text>
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on ? <Lucide name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
          <TouchableOpacity
            style={[styles.doneBtn, selected.size === 0 && styles.doneBtnDisabled]}
            disabled={selected.size === 0}
            onPress={() => {
              onDone([...selected.values()]);
              setSelected(new Map());
              setQuery("");
              onClose();
            }}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "78%",
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginTop: 10,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#111",
  },
  hint: {
    fontSize: 13,
    color: "#666",
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontWeight: "700", color: "#555" },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  username: { fontSize: 13, color: "#666", marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { backgroundColor: "#0095f6", borderColor: "#0095f6" },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneBtnDisabled: { opacity: 0.45 },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 24,
    fontSize: 14,
  },
});
