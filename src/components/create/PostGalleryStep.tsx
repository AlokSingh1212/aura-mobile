import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { loadRecentGalleryAssets, resolveGalleryUri, type GalleryAsset } from "@/lib/galleryAssets";
import { ensureMediaLibraryAccess } from "@/lib/createMediaPicker";

const { width } = Dimensions.get("window");
const COLS = 4;
const CELL = width / COLS;

interface PostGalleryStepProps {
  onClose: () => void;
  onNext: (uris: string[]) => void;
}

export function PostGalleryStep({ onClose, onNext }: PostGalleryStepProps) {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [multiSelect, setMultiSelect] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await loadRecentGalleryAssets(100);
      setAssets(rows);
      if (rows[0]) {
        const uri = await resolveGalleryUri(rows[0]);
        setPreviewUri(uri);
        setSelectedIds([rows[0].id]);
        setSelectedUris([uri]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAsset = async (asset: GalleryAsset) => {
    const uri = await resolveGalleryUri(asset);
    setPreviewUri(uri);

    if (multiSelect) {
      if (selectedIds.includes(asset.id)) {
        const idx = selectedIds.indexOf(asset.id);
        setSelectedIds((prev) => prev.filter((id) => id !== asset.id));
        setSelectedUris((prev) => prev.filter((_, i) => i !== idx));
      } else if (selectedIds.length >= 10) {
        Alert.alert("Limit", "You can select up to 10 photos.");
      } else {
        setSelectedIds((prev) => [...prev, asset.id]);
        setSelectedUris((prev) => [...prev, uri]);
      }
    } else {
      setSelectedIds([asset.id]);
      setSelectedUris([uri]);
    }
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera access needed");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
      setSelectedIds([`cam_${Date.now()}`]);
      setSelectedUris([uri]);
    }
  };

  const canNext = selectedUris.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <TouchableOpacity
          onPress={() => canNext && onNext(selectedUris)}
          disabled={!canNext}
          hitSlop={12}
        >
          <Text style={[styles.nextBtn, !canNext && { opacity: 0.35 }]}>Next</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewArea}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />
        ) : (
          <View style={styles.previewEmpty}>
            <Lucide name="images-outline" size={48} color="rgba(255,255,255,0.25)" />
          </View>
        )}
        <TouchableOpacity style={styles.aspectBtn}>
          <Lucide name="scan-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.galleryHeader}>
        <TouchableOpacity style={styles.recentsRow}>
          <Text style={styles.recentsLabel}>Recents</Text>
          <Lucide name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMultiSelect((m) => !m)}>
          <Lucide
            name={multiSelect ? "copy-outline" : "copy-outline"}
            size={22}
            color={multiSelect ? "#0095f6" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#0095f6" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={[{ id: "camera" } as GalleryAsset, ...assets]}
          numColumns={COLS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (index === 0) {
              return (
                <TouchableOpacity style={styles.cell} onPress={openCamera}>
                  <Lucide name="camera-outline" size={32} color="#fff" />
                </TouchableOpacity>
              );
            }
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity style={styles.cell} onPress={() => toggleAsset(item)}>
                <Image source={{ uri: item.uri }} style={styles.cellImage} contentFit="cover" />
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedNum}>
                      {multiSelect ? selectedIds.indexOf(item.id) + 1 : "✓"}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  nextBtn: { color: "#0095f6", fontSize: 16, fontWeight: "700" },
  previewArea: {
    width: "100%",
    height: width,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  previewEmpty: { flex: 1, justifyContent: "center", alignItems: "center" },
  aspectBtn: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  recentsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  recentsLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
  selectedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0095f6",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
