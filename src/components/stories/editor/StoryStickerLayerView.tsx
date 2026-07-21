import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { DrawStroke, StickerLayer } from "@/lib/createDraft";
import { STORY_TEXT_FONTS } from "@/components/stories/editor/storyEditorConstants";
import { ShoppableProductTag } from "@/components/commerce/ShoppableProductTag";
import { getStickerProducts } from "@/lib/productTagUtils";

type Props = {
  sticker: StickerLayer;
  scale: number;
};

function fontForSticker(sticker: StickerLayer) {
  const fontId = sticker.meta?.fontId || "modern";
  return STORY_TEXT_FONTS.find((f) => f.id === fontId) || STORY_TEXT_FONTS[0];
}

export function StoryStickerLayerView({ sticker, scale }: Props) {
  const s = sticker.scale * scale;
  const left = sticker.x * scale;
  const top = sticker.y * scale;
  const font = fontForSticker(sticker);

  if (sticker.type === "mention") {
    return (
      <View style={[styles.pill, { left, top, transform: [{ scale: s }] }]}>
        {sticker.meta?.avatar ? (
          <Image source={{ uri: sticker.meta.avatar }} style={styles.pillAvatar} />
        ) : null}
        <Text style={styles.pillTextDark}>@{sticker.meta?.username || sticker.text}</Text>
      </View>
    );
  }

  if (sticker.type === "location") {
    return (
      <View style={[styles.pill, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.pillIcon}>📍</Text>
        <Text style={styles.pillTextDark}>{sticker.meta?.locationName || sticker.text}</Text>
      </View>
    );
  }

  if (sticker.type === "hashtag") {
    return (
      <View style={[styles.pillDark, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.pillTextLight}>#{sticker.text.replace(/^#/, "")}</Text>
      </View>
    );
  }

  if (sticker.type === "poll") {
    const opts = sticker.meta?.pollOptions || ["Yes", "No"];
    return (
      <View style={[styles.pollCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.pollQuestion}>{sticker.text || "Ask a question…"}</Text>
        {opts.map((o) => (
          <View key={o} style={styles.pollOption}>
            <Text style={styles.pollOptionText}>{o}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (sticker.type === "question") {
    return (
      <View style={[styles.questionCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.questionLabel}>Questions</Text>
        <Text style={styles.questionText}>{sticker.meta?.question || sticker.text}</Text>
        <Text style={styles.questionHint}>Ask me a question</Text>
      </View>
    );
  }

  if (sticker.type === "add_yours") {
    return (
      <View style={[styles.addYoursCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.addYoursPrompt}>{sticker.meta?.addYoursPrompt || sticker.text}</Text>
        <Text style={styles.addYoursCta}>Add yours</Text>
      </View>
    );
  }

  if (sticker.type === "music") {
    return (
      <View style={[styles.musicPill, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.musicIcon}>🎵</Text>
        <Text style={styles.musicText} numberOfLines={1}>
          {sticker.meta?.musicTitle || sticker.text}
        </Text>
      </View>
    );
  }

  if (sticker.type === "partnership") {
    return (
      <View style={[styles.partnershipPill, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.partnershipText}>Paid partnership</Text>
      </View>
    );
  }

  if (sticker.type === "countdown") {
    return (
      <View style={[styles.countdownCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.countdownLabel}>{sticker.meta?.countdownLabel || "Countdown"}</Text>
        <Text style={styles.countdownTime}>{sticker.text || "00:00:00"}</Text>
      </View>
    );
  }

  if (sticker.type === "link") {
    return (
      <View style={[styles.linkPill, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.linkText}>🔗 {sticker.meta?.linkUrl || sticker.text}</Text>
      </View>
    );
  }

  if (sticker.type === "notify") {
    return (
      <View style={[styles.notifyCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.notifyTitle}>Turn on notifications</Text>
        <Text style={styles.notifySub}>Get notified when I post</Text>
      </View>
    );
  }

  if (sticker.type === "gif" || sticker.type === "photo" || sticker.type === "cutout") {
    const uri = sticker.meta?.imageUri;
    if (!uri) return null;
    const w = sticker.type === "gif" ? 140 : 120;
    return (
      <View style={[{ left, top, transform: [{ scale: s }] }]}>
        <Image
          source={{ uri }}
          style={[
            styles.overlayImage,
            { width: w * scale, height: w * scale, borderRadius: sticker.type === "cutout" ? w * scale : 8 },
          ]}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (sticker.type === "product") {
    const products = getStickerProducts(sticker);
    if (!products.length) return null;
    return (
      <View style={[{ left, top, transform: [{ scale: s }] }]}>
        <ShoppableProductTag products={products} />
      </View>
    );
  }

  if (sticker.type === "emoji_slider") {
    const emoji = sticker.meta?.emoji || "😍";
    const val = sticker.meta?.sliderValue ?? 50;
    return (
      <View style={[styles.sliderCard, { left, top, transform: [{ scale: s }] }]}>
        <Text style={styles.sliderEmoji}>{emoji}</Text>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${val}%` }]} />
        </View>
      </View>
    );
  }

  if (sticker.type === "frame") {
    const uris = sticker.meta?.frameUris || [];
    return (
      <View style={[styles.frameStrip, { left, top, transform: [{ scale: s }] }]}>
        {uris.slice(0, 3).map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.framePhoto} resizeMode="cover" />
        ))}
      </View>
    );
  }

  if (sticker.type === "avatar") {
    const uri = sticker.meta?.avatar || sticker.meta?.imageUri;
    return (
      <View style={[{ left, top, transform: [{ scale: s }] }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatarBubble} />
        ) : (
          <View style={[styles.avatarBubble, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{(sticker.text || "?")[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
  }

  const highlight = sticker.meta?.highlight;
  return (
    <Text
      style={[
        styles.freeText,
        {
          left,
          top,
          fontSize: (sticker.type === "emoji" ? 48 : 32) * s,
          color: highlight ? "#000" : sticker.color || "#fff",
          fontWeight: font.fontWeight,
          fontStyle: font.fontStyle,
          textAlign: sticker.meta?.textAlign || "center",
          backgroundColor: highlight ? "rgba(255,255,255,0.9)" : "transparent",
          paddingHorizontal: highlight ? 8 : 0,
          paddingVertical: highlight ? 4 : 0,
          borderRadius: highlight ? 6 : 0,
        },
      ]}
    >
      {sticker.text}
    </Text>
  );
}

export function StoryDrawStrokesLayer({
  strokes,
  scale,
}: {
  strokes: DrawStroke[];
  scale: number;
}) {
  if (!strokes.length) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <Svg width="100%" height="100%">
        {strokes.map((stroke, i) => (
          <Polyline
            key={`stroke_${i}`}
            points={stroke.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    maxWidth: 280,
  },
  pillDark: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillAvatar: { width: 22, height: 22, borderRadius: 11 },
  pillIcon: { fontSize: 14 },
  pillTextDark: { color: "#111", fontSize: 14, fontWeight: "700" },
  pillTextLight: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pollCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    width: 260,
  },
  pollQuestion: { color: "#111", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  pollOption: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  pollOptionText: { color: "#111", fontSize: 14, fontWeight: "600", textAlign: "center" },
  questionCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    width: 260,
  },
  questionLabel: { color: "#e91e63", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  questionText: { color: "#111", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  questionHint: { color: "rgba(0,0,0,0.45)", fontSize: 13 },
  addYoursCard: {
    position: "absolute",
    backgroundColor: "#E53935",
    borderRadius: 14,
    padding: 14,
    width: 220,
  },
  addYoursPrompt: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  addYoursCta: { color: "#fff", fontSize: 13, fontWeight: "600" },
  musicPill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: 240,
    gap: 6,
  },
  musicIcon: { fontSize: 14 },
  musicText: { color: "#111", fontSize: 13, fontWeight: "700", flexShrink: 1 },
  partnershipPill: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  partnershipText: { color: "#111", fontSize: 12, fontWeight: "700" },
  countdownCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    minWidth: 120,
  },
  countdownLabel: { color: "#111", fontSize: 11, fontWeight: "600", marginBottom: 4 },
  countdownTime: { color: "#111", fontSize: 22, fontWeight: "800" },
  linkPill: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  linkText: { color: "#111", fontSize: 13, fontWeight: "700" },
  notifyCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    width: 200,
  },
  notifyTitle: { color: "#111", fontSize: 13, fontWeight: "800" },
  notifySub: { color: "rgba(0,0,0,0.5)", fontSize: 11, marginTop: 4 },
  overlayImage: { backgroundColor: "#222" },
  productCard: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 8,
    gap: 8,
    width: 200,
  },
  productThumb: { width: 40, height: 40, borderRadius: 8 },
  productTitle: { color: "#111", fontSize: 12, fontWeight: "700" },
  productPrice: { color: "#666", fontSize: 11, marginTop: 2 },
  sliderCard: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderEmoji: { fontSize: 22 },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  sliderFill: { height: "100%", backgroundColor: "#e91e63", borderRadius: 3 },
  frameStrip: {
    position: "absolute",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 8,
    gap: 4,
  },
  framePhoto: { width: 72, height: 96, borderRadius: 4, backgroundColor: "#ddd" },
  avatarBubble: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#fff" },
  avatarFallback: { backgroundColor: "#ccc", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "800", color: "#555" },
  freeText: {
    position: "absolute",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: 280,
  },
});
