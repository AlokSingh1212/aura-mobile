import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat, FlipType } from "expo-image-manipulator";
import Lucide from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface ImageEditorProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (finalUri: string, appliedFilter: string) => void;
}

export const FILTER_PRESETS = [
  { id: "normal", name: "Normal", overlayColor: "transparent" },
  { id: "retro_warm", name: "Retro Warm", overlayColor: "rgba(235, 150, 50, 0.16)" },
  { id: "cool_ice", name: "Cool Ice", overlayColor: "rgba(50, 150, 255, 0.16)" },
  { id: "sepia", name: "Sepia Vintage", overlayColor: "rgba(180, 130, 80, 0.22)" },
  { id: "obsidian_noir", name: "Obsidian Noir", overlayColor: "rgba(0, 0, 0, 0.55)" }
];

export const ImageEditor: React.FC<ImageEditorProps> = ({
  visible,
  imageUri,
  onClose,
  onSave
}) => {
  const [currentUri, setCurrentUri] = useState<string>(imageUri);
  const [selectedFilter, setSelectedFilter] = useState<string>("normal");
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUri(imageUri);
    setSelectedFilter("normal");
  }, [imageUri, visible]);

  const triggerHaptic = (type: "light" | "medium" | "success" = "light") => {
    try {
      if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Fail-silent on web/simulators
    }
  };

  const handleRotate = async () => {
    triggerHaptic("medium");
    setProcessing(true);
    try {
      const result = await manipulateAsync(
        currentUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );
      setCurrentUri(result.uri);
    } catch (err) {
      console.warn("Rotation failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFlip = async () => {
    triggerHaptic("medium");
    setProcessing(true);
    try {
      const result = await manipulateAsync(
        currentUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );
      setCurrentUri(result.uri);
    } catch (err) {
      console.warn("Flip failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = () => {
    triggerHaptic("success");
    onSave(currentUri, selectedFilter);
  };

  const activeOverlayColor = FILTER_PRESETS.find(f => f.id === selectedFilter)?.overlayColor || "transparent";

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Lucide name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Curation</Text>
          <TouchableOpacity onPress={handleDone} style={styles.headerDoneBtn}>
            <Text style={styles.headerDoneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Workspace Canvas View */}
        <View style={styles.canvasContainer}>
          {currentUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: currentUri }} style={styles.canvasImage} contentFit="contain" />
              
              {/* Color filter overlay simulating matrix mapping */}
              <View 
                style={[
                  styles.filterOverlay, 
                  { backgroundColor: activeOverlayColor },
                  selectedFilter === "obsidian_noir" && { mixBlendMode: "color" } as any
                ]} 
                pointerEvents="none" 
              />
              
              {processing && (
                <View style={styles.processingLoader}>
                  <ActivityIndicator size="large" color="#00f5ff" />
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No image selected</Text>
          )}
        </View>

        {/* Toolbar (Rotate, Flip) */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={handleRotate} disabled={processing}>
            <Lucide name="reload-outline" size={22} color="#fff" />
            <Text style={styles.toolText}>Rotate 90°</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolBtn} onPress={handleFlip} disabled={processing}>
            <Lucide name="swap-horizontal-outline" size={22} color="#fff" />
            <Text style={styles.toolText}>Mirror</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Carousel Slider */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {FILTER_PRESETS.map((preset) => {
              const isActive = selectedFilter === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.filterCard, isActive && styles.filterCardActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setSelectedFilter(preset.id);
                  }}
                >
                  <View style={styles.filterPreviewWrapper}>
                    <Image source={{ uri: currentUri }} style={styles.filterPreviewImg} contentFit="cover" />
                    <View style={[styles.filterPreviewOverlay, { backgroundColor: preset.overlayColor }]} />
                  </View>
                  <Text style={[styles.filterName, isActive && styles.filterNameActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05030f",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  headerDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#00f5ff",
    borderRadius: 6,
  },
  headerDoneText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "bold",
  },
  canvasContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#020108",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  canvasImage: {
    width: "100%",
    height: "100%",
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  processingLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,3,15,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  toolBtn: {
    alignItems: "center",
    gap: 4,
  },
  toolText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  filterSection: {
    paddingVertical: 18,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
    paddingBottom: 24,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterCard: {
    alignItems: "center",
    gap: 6,
    width: 72,
  },
  filterCardActive: {
    transform: [{ scale: 1.02 }],
  },
  filterPreviewWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterPreviewImg: {
    width: "100%",
    height: "100%",
  },
  filterPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  filterName: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  filterNameActive: {
    color: "#00f5ff",
    fontWeight: "bold",
  },
});
