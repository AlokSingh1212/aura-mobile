import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useStore } from "@/store/useStore";
import { fetchAudioCatalog, searchAudioTracks, type AudioTrack } from "@/lib/audioLibrary";
import { formatDurationMs, formatUses } from "@/constants/reelStudio";

export type AudioCategory =
  | "all"
  | "trending"
  | "pop"
  | "bollywood"
  | "hiphop"
  | "electronic"
  | "house"
  | "lofi"
  | "ambient"
  | "cinematic"
  | "acoustic";

export interface AudioSelectorDrawerProps {
  setShowAudioDrawer: (show: boolean) => void;
  stopTrack: () => void;
  audioSearchQuery: string;
  setAudioSearchQuery: (query: string) => void;
  activeAudioCategory: AudioCategory;
  setActiveAudioCategory: (cat: AudioCategory) => void;
  selectedAudio: AudioTrack | null;
  setSelectedAudio: (track: AudioTrack) => void;
  isPlayingAudio: boolean;
  soundRef: React.RefObject<any>;
  playTrack: (url: string) => void;
  onSegmentReset?: () => void;
}

const CATEGORY_TABS: { key: AudioCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "trending", label: "Trending" },
  { key: "pop", label: "Pop" },
  { key: "bollywood", label: "Bollywood" },
  { key: "hiphop", label: "Hip Hop" },
  { key: "electronic", label: "Electronic" },
  { key: "house", label: "House" },
  { key: "lofi", label: "Lo-fi" },
  { key: "ambient", label: "Ambient" },
  { key: "cinematic", label: "Cinematic" },
  { key: "acoustic", label: "Acoustic" },
];

export const AudioSelectorDrawer: React.FC<AudioSelectorDrawerProps> = ({
  setShowAudioDrawer,
  stopTrack,
  audioSearchQuery,
  setAudioSearchQuery,
  activeAudioCategory,
  setActiveAudioCategory,
  selectedAudio,
  setSelectedAudio,
  isPlayingAudio,
  soundRef,
  playTrack,
  onSegmentReset,
}) => {
  const { triggerHaptic } = useStore();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list =
        audioSearchQuery.trim() || activeAudioCategory !== "all"
          ? await searchAudioTracks(
              audioSearchQuery,
              activeAudioCategory === "trending" ? "trending" : activeAudioCategory
            )
          : (await fetchAudioCatalog()).tracks;
      if (!cancelled) {
        const filtered =
          activeAudioCategory === "trending"
            ? list.filter((t) => t.isTrending)
            : list;
        setTracks(filtered);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioSearchQuery, activeAudioCategory]);

  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Audio library</Text>
          <Text style={styles.subtitle}>{tracks.length} tracks · baked into reel on Share</Text>
        </View>
        <TouchableOpacity onPress={() => { setShowAudioDrawer(false); stopTrack(); }}>
          <Lucide name="close-circle" size={26} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Lucide name="search-outline" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, moods..."
          placeholderTextColor="#666"
          value={audioSearchQuery}
          onChangeText={setAudioSearchQuery}
          autoCapitalize="none"
        />
        {audioSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setAudioSearchQuery("")}>
            <Lucide name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {CATEGORY_TABS.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, activeAudioCategory === cat.key && styles.tabActive]}
            onPress={() => { triggerHaptic("light"); setActiveAudioCategory(cat.key); }}
          >
            <Text style={[styles.tabText, activeAudioCategory === cat.key && styles.tabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#00f5ff" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list}>
          {tracks.map((track) => {
            const selected = selectedAudio?.id === track.id;
            const playing = isPlayingAudio && selectedAudio?.url === track.url;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  triggerHaptic("medium");
                  setSelectedAudio(track);
                  onSegmentReset?.();
                  stopTrack();
                  setShowAudioDrawer(false);
                }}
              >
                <Image source={{ uri: track.cover }} style={styles.art} />
                <View style={styles.meta}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  <Text style={styles.trackMeta}>
                    {formatDurationMs(track.durationMs)}
                    {track.bpm ? ` · ${track.bpm} BPM` : ""}
                    {track.isTrending ? " · 🔥" : ""}
                    {` · ${formatUses(track.usesCount)} reels`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    triggerHaptic("light");
                    if (playing) stopTrack();
                    else {
                      setSelectedAudio(track);
                      playTrack(track.url);
                    }
                  }}
                >
                  <Lucide name={playing ? "pause-circle" : "play-circle"} size={28} color="#00f5ff" />
                </TouchableOpacity>
                {selected && <Lucide name="checkmark-circle" size={22} color="#39ff14" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "72%",
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  tabs: { maxHeight: 40, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabActive: { backgroundColor: "#00f5ff" },
  tabText: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#080415", fontWeight: "800" },
  list: { flex: 1, paddingHorizontal: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 6,
    borderRadius: 12,
    gap: 10,
  },
  rowSelected: { backgroundColor: "rgba(0,245,255,0.1)", borderWidth: 1, borderColor: "rgba(0,245,255,0.25)" },
  art: { width: 48, height: 48, borderRadius: 8 },
  meta: { flex: 1 },
  trackTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  trackArtist: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 1 },
  trackMeta: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 3 },
  playBtn: { padding: 4 },
});
