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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { LocationCaptureSheet } from "@/components/create/LocationCaptureSheet";
import { searchLocations } from "@/lib/postComposerSearch";
import type { VerifiedLocation } from "@/lib/postComposerTypes";

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: VerifiedLocation) => void;
}

export function LocationPickerSheet({ visible, onClose, onSelect }: LocationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerifiedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGps, setShowGps] = useState(false);

  const runSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await searchLocations(text.trim());
      setResults(
        rows.map((r) => ({
          id: r.id,
          label: r.label,
          fullName: r.fullName,
          lat: r.lat,
          lon: r.lon,
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
      setShowGps(false);
      return;
    }
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [visible, query, runSearch]);

  if (showGps) {
    return (
      <LocationCaptureSheet
        visible={visible}
        onClose={() => setShowGps(false)}
        onConfirm={(location) => {
          onSelect(location);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Add location</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.hint}>
          Search and tag a place — post now or later, even if you are somewhere else.
        </Text>

        <TouchableOpacity style={styles.gpsBtn} onPress={() => setShowGps(true)}>
          <Lucide name="navigate-outline" size={20} color="#00f5ff" />
          <Text style={styles.gpsBtnText}>Use my current GPS on map</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities, venues, landmarks…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
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
                {query.trim().length < 2 ? "Type at least 2 characters to search" : "No places found"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Lucide name="location-outline" size={20} color="#00f5ff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {item.fullName}
                  </Text>
                </View>
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
    marginBottom: 10,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
  },
  gpsBtnText: { color: "#00f5ff", fontSize: 14, fontWeight: "600" },
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
