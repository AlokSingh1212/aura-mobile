import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { FILTER_PRESETS, type PostEditState, type TextLayer } from "@/lib/postEditState";
import { buildAdjustmentOverlays } from "@/lib/imageAdjustments";
import type { PhotoTag } from "@/lib/postComposerTypes";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";

interface PostMediaPreviewProps {
  uri: string;
  edit: PostEditState;
  photoTags?: PhotoTag[];
  aspectRatio?: number;
  fill?: boolean;
}

export function PostMediaPreview({
  uri,
  edit,
  photoTags = [],
  aspectRatio = 4 / 5,
  fill = false,
}: PostMediaPreviewProps) {
  const filterOverlay =
    FILTER_PRESETS.find((f) => f.id === edit.filterId)?.overlayColor || "transparent";
  const adjustLayers = buildAdjustmentOverlays(edit.adjustments);

  return (
    <View style={[styles.wrap, fill && styles.wrapFill, !fill && { aspectRatio }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit={fill ? "cover" : "contain"} />

      {adjustLayers.map((layer, i) => (
        <View key={`adj-${i}`} style={[StyleSheet.absoluteFill, layer]} pointerEvents="none" />
      ))}

      {filterOverlay !== "transparent" ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: filterOverlay }]}
          pointerEvents="none"
        />
      ) : null}

      {edit.textLayers.map((layer) => (
        <TextLayerView key={layer.id} layer={layer} />
      ))}

      <MediaPeopleOverlay photoTags={photoTags} bottom={edit.productStickers.length ? 56 : 10} left={10} />

      {edit.productStickers.length > 0 ? (
        <View style={styles.productStrip}>
          {edit.productStickers.slice(0, 4).map((p) => (
            <View key={p.productId} style={styles.productBox}>
              <Image source={{ uri: p.image }} style={styles.productImg} contentFit="cover" />
            </View>
          ))}
        </View>
      ) : null}

      {edit.audioLabel ? (
        <View style={styles.audioPill}>
          <Text style={styles.audioText} numberOfLines={1}>
            ♪ {edit.audioLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function TextLayerView({ layer }: { layer: TextLayer }) {
  return (
    <View
      style={[
        styles.textLayer,
        {
          left: `${Math.min(90, Math.max(5, layer.x))}%`,
          top: `${Math.min(85, Math.max(5, layer.y))}%`,
          backgroundColor: layer.bgColor || "transparent",
        },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.textLayerText, { color: layer.color }]}>{layer.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
    position: "relative",
  },
  wrapFill: {
    flex: 1,
    aspectRatio: undefined,
  },
  productStrip: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  productBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#111",
  },
  productImg: { width: "100%", height: "100%" },
  audioPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    left: "15%",
    right: "15%",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioText: { color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },
  textLayer: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: "80%",
  },
  textLayerText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
});
