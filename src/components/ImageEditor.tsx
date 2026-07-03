import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat, FlipType } from "expo-image-manipulator";
import Lucide from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

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
  { id: "obsidian_noir", name: "Obsidian Noir", overlayColor: "rgba(0, 0, 0, 0.55)" },
];

export const ImageEditor: React.FC<ImageEditorProps> = ({
  visible,
  imageUri,
  onClose,
  onSave,
}) => {
  const [currentUri, setCurrentUri] = useState<string>(imageUri);
  const [selectedFilter, setSelectedFilter] = useState<string>("normal");
  const [processing, setProcessing] = useState<boolean>(false);

  const canvasSize = useMemo(() => {
    const horizontalPad = 32;
    const reservedVertical = 280;
    const maxW = SCREEN_W - horizontalPad;
    const maxH = Math.max(200, SCREEN_H - reservedVertical);
    return { width: maxW, height: maxH };
  }, []);

  useEffect(() => {
    setCurrentUri(imageUri);
    setSelectedFilter("normal");
  }, [imageUri, visible]);

  const triggerHaptic = (type: "light" | "medium" | "success" = "light") => {
    try {
      if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
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

  const activeOverlayColor =
    FILTER_PRESETS.find((f) => f.id === selectedFilter)?.overlayColor || "transparent";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      onRequestClose={onClose}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Lucide name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit photo</Text>
          <TouchableOpacity onPress={handleDone} style={styles.headerDoneBtn}>
            <Text style={styles.headerDoneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.canvasContainer}>
          {currentUri ? (
            <View style={[styles.imageWrapper, canvasSize]}>
              <Image
                source={{ uri: currentUri }}
                style={styles.canvasImage}
                contentFit="contain"
              />
              <View
                style={[
                  styles.filterOverlay,
                  { backgroundColor: activeOverlayColor },
                  selectedFilter === "obsidian_noir" && ({ mixBlendMode: "color" } as object),
                ]}
                pointerEvents="none"
              />
              {processing ? (
                <View style={styles.processingLoader}>
                  <ActivityIndicator size="large" color="#00f5ff" />
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.emptyText}>No image selected</Text>
          )}
        </View>

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

        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            keyboardShouldPersistTaps="handled"
          >
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
                  <View style={[styles.filterPreviewWrapper, isActive && styles.filterPreviewActive]}>
                    <Image
                      source={{ uri: currentUri }}
                      style={styles.filterPreviewImg}
                      contentFit="cover"
                    />
                    <View
                      style={[styles.filterPreviewOverlay, { backgroundColor: preset.overlayColor }]}
                    />
                  </View>
                  <Text style={[styles.filterName, isActive && styles.filterNameActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05030f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  headerBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  headerDoneBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "#00f5ff",
    borderRadius: 8,
    minWidth: 64,
    alignItems: "center",
  },
  headerDoneText: {
    color: "#080415",
    fontSize: 14,
    fontWeight: "700",
  },
  canvasContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#020108",
    minHeight: 0,
  },
  imageWrapper: {
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#0a0618",
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
    gap: 40,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  toolBtn: {
    alignItems: "center",
    gap: 4,
    minWidth: 72,
  },
  toolText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  filterSection: {
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#080415",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingRight: 24,
  },
  filterCard: {
    alignItems: "center",
    gap: 6,
    width: 72,
  },
  filterCardActive: {},
  filterPreviewWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterPreviewActive: {
    borderColor: "#00f5ff",
  },
  filterPreviewImg: {
    width: "100%",
    height: "100%",
  },
  filterPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  filterName: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  filterNameActive: {
    color: "#00f5ff",
    fontWeight: "700",
  },
});
