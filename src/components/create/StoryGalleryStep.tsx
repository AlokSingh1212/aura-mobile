import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  loadGalleryAlbums,
  loadRecentGalleryAssets,
  resolveGalleryUri,
  type GalleryAlbum,
  type GalleryAsset,
} from "@/lib/galleryAssets";
import { CameraSettingsSheet } from "@/components/create/CameraSettingsSheet";
import { StoryMusicPicker } from "@/components/stories/editor/StoryMusicPicker";
import type { AudioTrack } from "@/lib/audioLibrary";

const { width } = Dimensions.get("window");
const COLS = 3;
const CELL = width / COLS;
const FEATURE_CARD_W = (width - 32 - 16) / 3;

export type StoryGalleryPick = {
  uri: string;
  mediaType: "photo" | "video";
  musicTrack?: AudioTrack | null;
};

type Props = {
  onClose: () => void;
  onNext: (pick: StoryGalleryPick) => void;
};

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function StoryGalleryStep({ onClose, onNext }: Props) {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<StoryGalleryPick[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlbums, setShowAlbums] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [pendingMusic, setPendingMusic] = useState<AudioTrack | null>(null);

  const loadAssets = useCallback(async (album?: GalleryAlbum | null) => {
    setLoading(true);
    try {
      const albumId =
        album && album.title !== "Recents" ? album.id : undefined;
      const rows = await loadRecentGalleryAssets(120, albumId);
      setAssets(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    const albumRows = await loadGalleryAlbums();
    setAlbums(albumRows);
    const recents = albumRows.find((a) => a.title === "Recents") || null;
    setActiveAlbum(recents);
    await loadAssets(recents);
  }, [loadAssets]);

  useEffect(() => {
    load();
  }, [load]);

  const pickAsset = async (asset: GalleryAsset) => {
    const uri = await resolveGalleryUri(asset);
    const pick: StoryGalleryPick = {
      uri,
      mediaType: asset.mediaType,
      musicTrack: pendingMusic,
    };

    if (multiSelect) {
      if (selectedIds.includes(asset.id)) {
        const idx = selectedIds.indexOf(asset.id);
        setSelectedIds((prev) => prev.filter((id) => id !== asset.id));
        setSelectedPicks((prev) => prev.filter((_, i) => i !== idx));
      } else if (selectedIds.length >= 10) {
        Alert.alert("Limit", "You can select up to 10 items.");
      } else {
        setSelectedIds((prev) => [...prev, asset.id]);
        setSelectedPicks((prev) => [...prev, pick]);
      }
      return;
    }

    if (asset.mediaType === "video") {
      onNext(pick);
      return;
    }
    onNext(pick);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera access needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.92,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onNext({
        uri: asset.uri,
        mediaType: asset.type === "video" ? "video" : "photo",
        musicTrack: pendingMusic,
      });
    }
  };

  const openTemplates = () => {
    Alert.alert(
      "Story templates",
      "Start an Add Yours chain or pick a photo below to design your story.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Browse Add Yours",
          onPress: () => router.push("/account"),
        },
      ]
    );
  };

  const openAiImages = () => {
    router.push("/create/ai");
  };

  const selectAlbum = async (album: GalleryAlbum) => {
    setActiveAlbum(album);
    setShowAlbums(false);
    setSelectedIds([]);
    setSelectedPicks([]);
    await loadAssets(album);
  };

  const canProceed = selectedPicks.length > 0;

  const featureCards = [
    {
      key: "templates",
      label: "Templates",
      onPress: openTemplates,
      gradient: ["#2a2a2a", "#111"] as const,
      icon: "layers-outline" as const,
      accent: "#fff",
    },
    {
      key: "music",
      label: "Music",
      onPress: () => setShowMusic(true),
      gradient: ["#3d1f5c", "#1a0f2e"] as const,
      icon: "musical-notes" as const,
      accent: "#e879f9",
    },
    {
      key: "ai",
      label: "AI Images",
      onPress: openAiImages,
      gradient: ["#1e3a5f", "#0f172a"] as const,
      icon: "sparkles" as const,
      accent: "#60a5fa",
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to story</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} hitSlop={12}>
          <Lucide name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featureRow}
      >
        {featureCards.map((card) => (
          <TouchableOpacity
            key={card.key}
            style={styles.featureCard}
            activeOpacity={0.88}
            onPress={card.onPress}
          >
            <LinearGradient colors={[...card.gradient]} style={styles.featureCardInner}>
              {card.key === "templates" ? (
                <View style={styles.templatePreview}>
                  <View style={[styles.templateBubble, { left: 8, top: 10, zIndex: 1 }]} />
                  <View style={[styles.templateBubble, { right: 8, top: 18, zIndex: 2 }]} />
                  <View style={[styles.templateBubble, { alignSelf: "center", top: 28, zIndex: 3 }]} />
                </View>
              ) : card.key === "music" ? (
                <View style={styles.musicPreview}>
                  <View style={styles.vinyl}>
                    <Lucide name="heart" size={16} color="#e879f9" />
                  </View>
                </View>
              ) : (
                <View style={styles.aiPreview}>
                  <Lucide name="sparkles" size={28} color="#93c5fd" />
                </View>
              )}
            </LinearGradient>
            <Text style={styles.featureLabel}>{card.label}</Text>
            {card.key === "music" && pendingMusic ? (
              <Text style={styles.featureSub} numberOfLines={1}>
                {pendingMusic.title}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.galleryHeader}>
        <TouchableOpacity style={styles.recentsRow} onPress={() => setShowAlbums(true)}>
          <Text style={styles.recentsLabel}>{activeAlbum?.title || "Recents"}</Text>
          <Lucide name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.multiToggle}
          onPress={() => {
            setMultiSelect((m) => !m);
            setSelectedIds([]);
            setSelectedPicks([]);
          }}
          hitSlop={8}
        >
          <Lucide
            name="copy-outline"
            size={22}
            color={multiSelect ? "#0095f6" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[
            { id: "__camera__", uri: "", width: 0, height: 0, mediaType: "photo" as const },
            ...assets,
          ]}
          numColumns={COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: canProceed ? 96 : 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.id === "__camera__") {
              return (
                <TouchableOpacity style={styles.cell} onPress={openCamera} activeOpacity={0.85}>
                  <Lucide name="camera-outline" size={36} color="#fff" />
                </TouchableOpacity>
              );
            }

            const isSelected = selectedIds.includes(item.id);
            const order = selectedIds.indexOf(item.id) + 1;

            return (
              <TouchableOpacity
                style={styles.cell}
                onPress={() => pickAsset(item)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.uri }} style={styles.cellImage} contentFit="cover" />
                {item.mediaType === "video" ? (
                  <Text style={styles.durationBadge}>{formatDuration(item.duration)}</Text>
                ) : null}
                {multiSelect ? (
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? <Text style={styles.checkNum}>{order}</Text> : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {multiSelect && canProceed ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              const first = selectedPicks[0];
              if (first) onNext(first);
            }}
          >
            <Text style={styles.nextBtnText}>Next ({selectedPicks.length})</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={showAlbums} transparent animationType="fade" onRequestClose={() => setShowAlbums(false)}>
        <Pressable style={styles.albumBackdrop} onPress={() => setShowAlbums(false)}>
          <Pressable style={styles.albumSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.albumTitle}>Albums</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumRow}
                  onPress={() => selectAlbum(album)}
                >
                  <Lucide name="images-outline" size={20} color="#fff" />
                  <Text style={styles.albumRowText}>{album.title}</Text>
                  <Text style={styles.albumCount}>{album.assetCount}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <CameraSettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />

      <StoryMusicPicker
        visible={showMusic}
        onClose={() => setShowMusic(false)}
        onSelect={(track) => {
          setPendingMusic(track);
          setShowMusic(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  featureRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  featureCard: {
    width: FEATURE_CARD_W,
    alignItems: "center",
  },
  featureCardInner: {
    width: FEATURE_CARD_W,
    height: FEATURE_CARD_W * 1.05,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  featureSub: {
    color: "#0095f6",
    fontSize: 10,
    marginTop: 2,
    maxWidth: FEATURE_CARD_W,
    textAlign: "center",
  },
  templatePreview: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  templateBubble: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 2,
    borderColor: "#fff",
  },
  musicPreview: {
    alignItems: "center",
    justifyContent: "center",
  },
  vinyl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiPreview: {
    alignItems: "center",
    justifyContent: "center",
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recentsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  recentsLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  multiToggle: { padding: 4 },
  cell: {
    width: CELL,
    height: CELL,
    backgroundColor: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cellImage: { width: "100%", height: "100%" },
  durationBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkCircle: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: { backgroundColor: "#0095f6", borderColor: "#0095f6" },
  checkNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  nextBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  albumBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  albumSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  albumTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  albumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  albumRowText: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },
  albumCount: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
});
