import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";
import { FILTER_PRESETS } from "@/components/ImageEditor";

const { width: SCREEN_W } = Dimensions.get("window");

export async function captureFilteredImage(
  canvasRef: React.RefObject<View | null>,
  width = 1080,
  height = 1080
): Promise<string> {
  if (!canvasRef.current) {
    throw new Error("Canvas not ready.");
  }
  return captureRef(canvasRef, { format: "jpg", quality: 0.92, width, height });
}

export type FilterBakeCanvasProps = {
  imageUri: string;
  filterId: string;
  aspectRatio?: number;
  canvasRef: React.RefObject<View | null>;
};

export function FilterBakeCanvas({
  imageUri,
  filterId,
  aspectRatio = 1,
  canvasRef,
}: FilterBakeCanvasProps) {
  const overlayColor = FILTER_PRESETS.find((f) => f.id === filterId)?.overlayColor || "transparent";
  const w = SCREEN_W - 32;
  const h = w / aspectRatio;

  return (
    <View ref={canvasRef} collapsable={false} style={{ width: w, height: h, overflow: "hidden", borderRadius: 4 }}>
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayColor },
          filterId === "obsidian_noir" && ({ mixBlendMode: "color" } as object),
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

export { FILTER_PRESETS };
