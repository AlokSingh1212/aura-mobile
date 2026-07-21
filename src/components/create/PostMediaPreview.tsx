import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { FILTER_PRESETS, type PostEditState, type TextLayer } from "@/lib/postEditState";
import { buildAdjustmentOverlays } from "@/lib/imageAdjustments";
import type { PhotoTag } from "@/lib/postComposerTypes";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";
import { ProductThumbnailStrip } from "@/components/post/PostProductOverlay";
import { StoryDrawStrokesLayer, StoryStickerLayerView } from "@/components/stories/editor/StoryStickerLayerView";
import { POST_CANVAS_W } from "@/components/create/postEditorConstants";

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
  const [layoutW, setLayoutW] = React.useState(0);
  const scale = layoutW > 0 ? layoutW / POST_CANVAS_W : 0.35;
  const filterOverlay =
    FILTER_PRESETS.find((f) => f.id === edit.filterId)?.overlayColor || "transparent";
  const adjustLayers = buildAdjustmentOverlays(edit.adjustments);
  const hasMusicSticker = edit.stickerLayers.some((s) => s.type === "music");
  const hasProductSticker = edit.stickerLayers.some((s) => s.type === "product");

  return (
    <View
      style={[styles.wrap, fill && styles.wrapFill, !fill && { aspectRatio }]}
      onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}
    >
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

      <StoryDrawStrokesLayer strokes={edit.drawStrokes} scale={scale} />
      {edit.stickerLayers.map((s) => (
        <View
          key={s.id}
          style={{ position: "absolute", left: s.x * scale, top: s.y * scale }}
          pointerEvents="none"
        >
          <StoryStickerLayerView sticker={{ ...s, x: 0, y: 0 }} scale={scale} />
        </View>
      ))}

      <MediaPeopleOverlay photoTags={photoTags} bottom={edit.productStickers.length ? 56 : 10} left={10} />

      <ProductThumbnailStrip products={hasProductSticker ? [] : edit.productStickers} bottom={6} />

      {edit.audioLabel && !hasMusicSticker ? (
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
