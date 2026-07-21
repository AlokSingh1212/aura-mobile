import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { searchLocations, type LocationResult } from "@/lib/postComposerSearch";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (location: LocationResult) => void;
};

export function StoryLocationPicker({ visible, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const run = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const rows = await searchLocations(query);
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.searchRow}>
            <Lucide name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations"
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color="#0095f6" />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.trim().length >= 2 ? (
                  <Text style={styles.empty}>No locations found</Text>
                ) : (
                  <Text style={styles.empty}>Type at least 2 characters</Text>
                )
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onPick(item);
                    setQuery("");
                    onClose();
                  }}
                >
                  <Lucide name="location" size={20} color="#7c4dff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.label}</Text>
                    <Text style={styles.sub}>{item.fullName}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
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
    maxHeight: "70%",
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  sub: { fontSize: 13, color: "#666", marginTop: 2 },
  empty: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 24,
    fontSize: 14,
  },
});
