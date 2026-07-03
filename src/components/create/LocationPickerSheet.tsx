import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { searchLocations, searchNearbyLocations } from "@/lib/postComposerSearch";
import type { VerifiedLocation } from "@/lib/postComposerTypes";

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: VerifiedLocation) => void;
}

function formatDistance(km?: number): string {
  if (km == null) return "";
  if (km < 0.1) return "<0.1km";
  if (km < 1) return `${(km * 1000).toFixed(0)}m`;
  return `${km.toFixed(1)}km`;
}

export function LocationPickerSheet({ visible, onClose, onSelect }: LocationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(VerifiedLocation & { distanceKm?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const loadNearby = useCallback(async () => {
    setGpsLoading(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setResults([]);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nearby = await searchNearbyLocations(pos.coords.latitude, pos.coords.longitude);
      setResults(
        nearby.map((r) => ({
          id: r.id,
          label: r.label,
          fullName: r.fullName,
          lat: r.lat,
          lon: r.lon,
          distanceKm: r.distanceKm,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      loadNearby();
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
  }, [loadNearby]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      return;
    }
    loadNearby();
  }, [visible, loadNearby]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [visible, query, runSearch]);

  const pick = (item: VerifiedLocation) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Locations</Text>
          <View style={{ width: 64 }} />
        </View>

        <Text style={styles.lead}>Choose a location to tag</Text>
        <Text style={styles.leadSub}>
          People you share with can see the location you tag and view this on the map.
        </Text>

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {gpsLoading || loading ? (
          <ActivityIndicator color="#0095f6" style={{ marginTop: 24 }} />
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {results.map((item) => (
              <TouchableOpacity key={item.id} style={styles.row} onPress={() => pick(item)}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.rowSub} numberOfLines={2}>
                  {item.distanceKm != null
                    ? `${formatDistance(item.distanceKm)} · ${item.fullName}`
                    : item.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={loadNearby} disabled={gpsLoading}>
          <Text style={styles.addBtnText}>Refresh nearby</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancel: { color: "#fff", fontSize: 16, width: 64 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  lead: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  leadSub: {
    color: "#0095f6",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  list: { flex: 1 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 3 },
  addBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#1e3a5f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
