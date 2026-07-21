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
import { searchGifs, type GifSearchResult } from "@/lib/gifSearch";

type Props = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onPick: (gif: GifSearchResult) => void;
};

export function StoryGifPicker({ visible, userId, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await searchGifs(query, userId);
        if (!cancelled) setResults(rows);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setError(e instanceof Error ? e.message : "GIF search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, visible, userId]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.searchRow}>
            <Lucide name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search GIFs"
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#0095f6" />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={2}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cell}
                  onPress={() => {
                    onPick(item);
                    setQuery("");
                    onClose();
                  }}
                >
                  <Image source={{ uri: item.previewUrl }} style={styles.gif} resizeMode="cover" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No GIFs found</Text>}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "75%",
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
    marginBottom: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12, color: "#111" },
  grid: { paddingHorizontal: 8 },
  cell: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eee",
    maxWidth: "50%",
  },
  gif: { width: "100%", height: "100%" },
  empty: { textAlign: "center", color: "#999", paddingVertical: 24 },
  error: { textAlign: "center", color: "#c62828", padding: 24, lineHeight: 20 },
});
