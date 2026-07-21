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
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { loadRecentGalleryAssets, resolveGalleryUri, type GalleryAsset } from "@/lib/galleryAssets";
import { ensureMediaLibraryAccess } from "@/lib/createMediaPicker";
import { CameraSettingsSheet } from "@/components/create/CameraSettingsSheet";
import { REEL_COUNTDOWN_SECONDS, type ReelCountdownSeconds } from "@/constants/reelStudio";

const { width } = Dimensions.get("window");
const COLS = 3;
const CELL = width / COLS;

export type CaptureMode = "story" | "reel" | "live" | "product";

interface ReelGalleryStepProps {
  onClose: () => void;
  onNext: (uris: string[]) => void;
  onOpenRecord?: () => void;
  onModeChange?: (mode: CaptureMode) => void;
  showCenterModes?: boolean;
  activeMode?: CaptureMode;
  recordCountdown?: ReelCountdownSeconds;
  onRecordCountdownChange?: (seconds: ReelCountdownSeconds) => void;
}

export function ReelGalleryStep({
  onClose,
  onNext,
  onOpenRecord,
  onModeChange,
  showCenterModes = false,
  activeMode = "reel",
  recordCountdown = 0,
  onRecordCountdownChange,
}: ReelGalleryStepProps) {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [multiSelect, setMultiSelect] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCountdownPicker, setShowCountdownPicker] = useState(false);
  const [activeCountdown, setActiveCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await loadRecentGalleryAssets(120);
      setAssets(rows.filter((a) => a.mediaType === "video" || a.mediaType === "photo"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAsset = async (asset: GalleryAsset) => {
    const uri = await resolveGalleryUri(asset);

    if (multiSelect) {
      if (selectedIds.includes(asset.id)) {
        const idx = selectedIds.indexOf(asset.id);
        setSelectedIds((prev) => prev.filter((id) => id !== asset.id));
        setSelectedUris((prev) => prev.filter((_, i) => i !== idx));
      } else if (selectedIds.length >= 10) {
        Alert.alert("Limit", "You can select up to 10 clips for one reel.");
      } else {
        setSelectedIds((prev) => [...prev, asset.id]);
        setSelectedUris((prev) => [...prev, uri]);
      }
    } else {
      setSelectedIds([asset.id]);
      setSelectedUris([uri]);
    }
  };

  const runWithCountdown = (action: () => void) => {
    if (recordCountdown <= 0) {
      action();
      return;
    }
    setIsCountingDown(true);
    let tick = recordCountdown;
    setActiveCountdown(tick);
    const timer = setInterval(() => {
      tick -= 1;
      if (tick <= 0) {
        clearInterval(timer);
        setIsCountingDown(false);
        setActiveCountdown(0);
        action();
      } else {
        setActiveCountdown(tick);
      }
    }, 1000);
  };

  const openCamera = async () => {
    if (onOpenRecord) {
      onOpenRecord();
      return;
    }
    const launch = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Camera access needed");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos", "images"],
        quality: 0.9,
        videoMaxDuration: 90,
      });
      if (!result.canceled && result.assets[0]) {
        onNext([result.assets[0].uri]);
      }
    };
    runWithCountdown(() => {
      launch().catch(() => {});
    });
  };

  const canProceed = selectedUris.length > 0;

  const modes: { key: CaptureMode; label: string }[] = [
    { key: "story", label: "Story" },
    { key: "reel", label: "Reel" },
    { key: "live", label: "Live" },
    { key: "product", label: "Product" },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New reel</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowCountdownPicker((v) => !v)} hitSlop={12}>
            <Lucide name="time-outline" size={24} color={recordCountdown > 0 ? "#00f5ff" : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettings(true)} hitSlop={12}>
            <Lucide name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showCountdownPicker ? (
        <View style={styles.countdownRow}>
          {REEL_COUNTDOWN_SECONDS.map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[styles.countdownChip, recordCountdown === sec && styles.countdownChipActive]}
              onPress={() => {
                onRecordCountdownChange?.(sec);
                setShowCountdownPicker(false);
              }}
            >
              <Text style={[styles.countdownChipText, recordCountdown === sec && styles.countdownChipTextActive]}>
                {sec === 0 ? "Off" : `${sec}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!showCenterModes ? (
        <TouchableOpacity style={styles.templatesBtn}>
          <Lucide name="copy-outline" size={18} color="#fff" />
          <Text style={styles.templatesText}>Templates</Text>
        </TouchableOpacity>
      ) : null}

      {showCenterModes ? (
        <View style={styles.modeRow}>
          {modes.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeChip, activeMode === m.key && styles.modeChipActive]}
              onPress={() => onModeChange?.(m.key)}
            >
              <Text style={[styles.modeChipText, activeMode === m.key && styles.modeChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.galleryHeader}>
        <TouchableOpacity style={styles.recentsRow}>
          <Text style={styles.recentsLabel}>Recents</Text>
          <Lucide name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectRow} onPress={() => setMultiSelect((m) => !m)}>
          <Lucide name="copy-outline" size={20} color={multiSelect ? "#0095f6" : "#fff"} />
          <Text style={[styles.selectText, multiSelect && { color: "#0095f6" }]}>
            {multiSelect ? "Cancel" : "Select"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[{ id: "__camera__", uri: "", width: 0, height: 0, mediaType: "photo" as const }, ...assets]}
          numColumns={COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            if (item.id === "__camera__") {
              return (
                <TouchableOpacity style={styles.cell} onPress={openCamera}>
                  <Lucide name="camera-outline" size={36} color="#fff" />
                </TouchableOpacity>
              );
            }
            const isSelected = selectedIds.includes(item.id);
            const order = selectedIds.indexOf(item.id) + 1;
            return (
              <TouchableOpacity style={styles.cell} onPress={() => toggleAsset(item)}>
                <Image source={{ uri: item.uri }} style={styles.cellImage} contentFit="cover" />
                {item.mediaType === "video" ? (
                  <View style={styles.videoBadge}>
                    <Lucide name="videocam" size={12} color="#fff" />
                  </View>
                ) : null}
                <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                  {isSelected ? <Text style={styles.checkNum}>{order}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {canProceed ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.reelBtn} onPress={() => onNext(selectedUris)}>
            <Text style={styles.reelBtnText}>REEL</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <CameraSettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />

      {isCountingDown ? (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownOverlayText}>{activeCountdown}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export async function requestGalleryAccess(): Promise<boolean> {
  return ensureMediaLibraryAccess();
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  countdownChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  countdownChipActive: { backgroundColor: "#00f5ff" },
  countdownChipText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  countdownChipTextActive: { color: "#080415" },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  countdownOverlayText: { color: "#00f5ff", fontSize: 72, fontWeight: "900" },
  templatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  templatesText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  modeChipActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  modeChipText: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "700" },
  modeChipTextActive: { color: "#fff" },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recentsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  recentsLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  selectRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cell: {
    width: CELL,
    height: CELL * 1.15,
    backgroundColor: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cellImage: { width: "100%", height: "100%" },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 4,
    padding: 3,
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
  reelBtn: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
  },
  reelBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 1 },
});
