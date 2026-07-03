import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { ComposerBottomSheet } from "@/components/create/ComposerBottomSheet";
import {
  ADJUST_CONTROLS,
  FILTER_PRESETS,
  type AdjustKey,
  type ImageAdjustments,
} from "@/lib/postEditState";
import { buildAdjustmentOverlays } from "@/lib/imageAdjustments";

const { width } = Dimensions.get("window");

interface PostAdjustSheetProps {
  visible: boolean;
  imageUri: string;
  adjustments: ImageAdjustments;
  filterId: string;
  onClose: () => void;
  onChange: (adj: ImageAdjustments) => void;
  onDone: () => void;
}

export function PostAdjustSheet({
  visible,
  imageUri,
  adjustments,
  filterId,
  onClose,
  onChange,
  onDone,
}: PostAdjustSheetProps) {
  const [activeKey, setActiveKey] = useState<AdjustKey>("lux");
  const value = adjustments[activeKey];
  const filterOverlay = FILTER_PRESETS.find((f) => f.id === filterId)?.overlayColor || "transparent";
  const layers = buildAdjustmentOverlays(adjustments);

  const setValue = (v: number) => {
    onChange({ ...adjustments, [activeKey]: Math.max(-100, Math.min(100, v)) });
  };

  return (
    <ComposerBottomSheet
      visible={visible}
      title="Edit"
      cancelLabel="Cancel"
      onClose={onClose}
      onDone={onDone}
      height="58%"
    >
      <View style={styles.preview}>
        <Image source={{ uri: imageUri }} style={styles.previewImg} contentFit="contain" />
        {layers.map((layer, i) => (
          <View key={i} style={[StyleSheet.absoluteFill, layer]} pointerEvents="none" />
        ))}
        {filterOverlay !== "transparent" ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: filterOverlay }]} pointerEvents="none" />
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.controlTabs}>
        {ADJUST_CONTROLS.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.controlTab, activeKey === c.key && styles.controlTabActive]}
            onPress={() => setActiveKey(c.key)}
          >
            <Text style={[styles.controlTabText, activeKey === c.key && styles.controlTabTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderMin}>-100</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.sliderTrack}>
            {Array.from({ length: 41 }, (_, i) => i * 5 - 100).map((tick) => (
              <TouchableOpacity key={tick} style={styles.tickBtn} onPress={() => setValue(tick)}>
                <View style={[styles.tick, tick === value && styles.tickActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.sliderMax}>+100</Text>
      </View>
      <Text style={styles.valueLabel}>{value}</Text>
    </ComposerBottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: width * 0.35,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#000",
    borderRadius: 4,
    overflow: "hidden",
  },
  previewImg: { width: "100%", height: "100%" },
  controlTabs: { maxHeight: 40, marginBottom: 8, paddingHorizontal: 8 },
  controlTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  controlTabActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  controlTabText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  controlTabTextActive: { color: "#fff" },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sliderMin: { color: "rgba(255,255,255,0.4)", fontSize: 11, width: 36 },
  sliderMax: { color: "rgba(255,255,255,0.4)", fontSize: 11, width: 36, textAlign: "right" },
  sliderTrack: { flexDirection: "row", alignItems: "center", height: 40 },
  tickBtn: { paddingHorizontal: 3, paddingVertical: 8 },
  tick: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tickActive: { backgroundColor: "#0095f6", height: 24 },
  valueLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
});
