import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image 
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { AUDIO_LIBRARY } from "@/constants/audio";

export interface AudioSelectorDrawerProps {
  setShowAudioDrawer: (show: boolean) => void;
  stopTrack: () => void;
  audioSearchQuery: string;
  setAudioSearchQuery: (query: string) => void;
  activeAudioCategory: "all" | "trending" | "pop" | "bollywood" | "hiphop" | "electronic";
  setActiveAudioCategory: (cat: any) => void;
  selectedAudio: any;
  setSelectedAudio: (track: any) => void;
  isPlayingAudio: boolean;
  soundRef: React.RefObject<any>;
  playTrack: (url: string) => void;
}

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
}) => {
  const { triggerHaptic } = useStore();

  return (
    <View style={styles.cameraOverlayDrawer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Select Luxury Curation Soundtrack</Text>
        <TouchableOpacity onPress={() => { setShowAudioDrawer(false); stopTrack(); }}>
          <Lucide name="close-circle" size={24} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      {/* Interactive Search bar with magnifying glass and clear icons */}
      <View style={styles.audioSearchContainer}>
        <Lucide name="search-outline" size={21} color="#aaa" style={styles.audioSearchIcon} />
        <TextInput
          style={styles.audioSearchInput}
          placeholder="Search real songs, artists, genres..."
          placeholderTextColor="#888"
          value={audioSearchQuery}
          onChangeText={setAudioSearchQuery}
          autoCapitalize="none"
        />
        {audioSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setAudioSearchQuery("")}>
            <Lucide name="close-circle" size={21} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Slider Tabs */}
      <View style={{ height: 38, marginBottom: 8 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
        >
          {[
            { key: "all", label: "All Music" },
            { key: "trending", label: "🔥 Trending" },
            { key: "pop", label: "Pop Hits" },
            { key: "bollywood", label: "Bollywood" },
            { key: "hiphop", label: "Hip Hop" },
            { key: "electronic", label: "Electronic" }
          ].map((cat) => (
            <TouchableOpacity 
              key={cat.key} 
              style={[
                styles.audioCategoryTab, 
                activeAudioCategory === cat.key && styles.audioCategoryTabActive
              ]}
              onPress={() => {
                triggerHaptic("light");
                setActiveAudioCategory(cat.key as any);
              }}
            >
              <Text style={[
                styles.audioCategoryTabText, 
                activeAudioCategory === cat.key && styles.audioCategoryTabTextActive
              ]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Playlist mapping with live preview actions */}
      <ScrollView style={styles.drawerScroll}>
        {AUDIO_LIBRARY.filter(track => {
          const matchesSearch = track.title.toLowerCase().includes(audioSearchQuery.toLowerCase()) || 
                                track.artist.toLowerCase().includes(audioSearchQuery.toLowerCase());
          const matchesCategory = activeAudioCategory === "all" || 
                                  (activeAudioCategory === "trending" && track.isTrending) || 
                                  track.category === activeAudioCategory;
          return matchesSearch && matchesCategory;
        }).map((track, i) => {
          const isCurrentlySelected = selectedAudio && selectedAudio.title === track.title;
          const isThisPlaying = isPlayingAudio && soundRef.current && selectedAudio && selectedAudio.url === track.url;
          
          return (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.drawerItem, 
                isCurrentlySelected && styles.drawerItemCurrentlySelected
              ]} 
              onPress={() => {
                triggerHaptic("medium");
                setSelectedAudio(track);
                stopTrack(); // Silence the audition preview
                setShowAudioDrawer(false); // Close drawer
              }}
            >
              <Image source={{ uri: track.cover }} style={styles.drawerItemArt} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.drawerItemText} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.drawerItemSub} numberOfLines={1}>{track.artist}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Live preview play/pause trigger */}
                <TouchableOpacity 
                  style={styles.audioPreviewBtn}
                  onPress={(e) => {
                    e.stopPropagation(); // Avoid triggering row selection
                    triggerHaptic("light");
                    if (isThisPlaying) {
                      stopTrack();
                    } else {
                      setSelectedAudio(track);
                      playTrack(track.url);
                    }
                  }}
                >
                  <Lucide 
                    name={isThisPlaying ? "pause-circle" : "play-circle"} 
                    size={24} 
                    color="#00f5ff" 
                  />
                </TouchableOpacity>

                {/* Selected checkmark indicator */}
                {isCurrentlySelected && (
                  <Lucide name="checkmark-circle" size={21} color="#39ff14" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraOverlayDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 420,
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingTop: 16,
    zIndex: 999,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  drawerTitle: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 12,
  },
  drawerItemArt: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  drawerItemText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
  },
  drawerItemSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  audioSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  audioSearchIcon: {
    marginRight: 8,
  },
  audioSearchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14.5,
    paddingVertical: 0,
  },
  audioCategoryTab: {
    paddingHorizontal: 14,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  audioCategoryTabActive: {
    backgroundColor: "#00f5ff",
    borderColor: "#00f5ff",
  },
  audioCategoryTabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  audioCategoryTabTextActive: {
    color: "#080415",
    fontWeight: "bold",
  },
  drawerItemCurrentlySelected: {
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    borderColor: "rgba(0, 245, 255, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  audioPreviewBtn: {
    padding: 4,
  },
});
