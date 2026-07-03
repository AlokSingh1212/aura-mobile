import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerBottomSheet } from "@/components/create/ComposerBottomSheet";
import { fetchAudioCatalog, type AudioTrack } from "@/lib/audioLibrary";

const TABS = ["For you", "Trending", "Original audio", "Saved"] as const;

interface PostAudioSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: AudioTrack) => void;
}

export function PostAudioSheet({ visible, onClose, onSelect }: PostAudioSheetProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("For you");
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const category =
        tab === "Trending" ? "trending" : tab === "Original audio" ? "original" : "all";
      const { tracks: rows } = await fetchAudioCatalog({
        q: query.trim() || undefined,
        category,
        force: true,
      });
      let list = rows;
      if (tab === "Trending") list = rows.filter((t) => t.isTrending);
      setTracks(list.slice(0, 30));
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    const timer = setTimeout(load, 220);
    return () => clearTimeout(timer);
  }, [visible, load]);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <ComposerBottomSheet visible={visible} onClose={onClose} height="72%">
      <View style={styles.searchBox}>
        <Lucide name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabChip, tab === t && styles.tabChipActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#0095f6" style={{ marginTop: 32 }} />
      ) : (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {tracks.map((track) => (
            <TouchableOpacity key={track.id} style={styles.row} onPress={() => onSelect(track)}>
              {track.cover ? (
                <Image source={{ uri: track.cover }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverFallback]}>
                  <Lucide name="musical-notes" size={20} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackMeta} numberOfLines={1}>
                  {track.artist} · {(track.usesCount / 1000).toFixed(0)}K reels ·{" "}
                  {formatDuration(track.durationMs)}
                </Text>
              </View>
              <Lucide name="bookmark-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </ComposerBottomSheet>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  tabs: { maxHeight: 44, paddingHorizontal: 12, marginBottom: 8 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 4,
  },
  tabChipActive: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#000" },
  list: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cover: { width: 48, height: 48, borderRadius: 6, backgroundColor: "#333" },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  trackTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  trackMeta: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
