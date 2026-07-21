import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";
import Lucide from "@expo/vector-icons/Ionicons";
import { FILTER_PRESETS } from "@/components/ImageEditor";
import type { DrawStroke, StickerLayer } from "@/lib/createDraft";
import { StoryDrawStrokesLayer } from "@/components/stories/editor/StoryStickerLayerView";
import { StoryDraggableSticker } from "@/components/stories/editor/StoryDraggableSticker";
import { StoryStickerTray } from "@/components/stories/editor/StoryStickerTray";
import { StoryTextEditor } from "@/components/stories/editor/StoryTextEditor";
import {
  StoryPartnershipSheet,
  type PartnershipSettings,
} from "@/components/stories/editor/StoryPartnershipSheet";
import { StoryMentionPicker } from "@/components/stories/editor/StoryMentionPicker";
import { StoryLocationPicker } from "@/components/stories/editor/StoryLocationPicker";
import { StoryDrawOverlay } from "@/components/stories/editor/StoryDrawOverlay";
import { StoryMusicPicker } from "@/components/stories/editor/StoryMusicPicker";
import { StoryGifPicker } from "@/components/stories/editor/StoryGifPicker";
import { StoryLinkInput } from "@/components/stories/editor/StoryLinkInput";
import { StoryCountdownPicker } from "@/components/stories/editor/StoryCountdownPicker";
import {
  StoryPromptSheet,
  type StoryPromptKind,
} from "@/components/stories/editor/StoryPromptSheet";
import { StoryProductPicker } from "@/components/stories/editor/StoryProductPicker";
import {
  STORY_EMOJI_OPTIONS,
  type StoryStickerDef,
} from "@/components/stories/editor/storyEditorConstants";
import type { LocationResult, ProfileSearchResult } from "@/lib/postComposerSearch";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import type { AudioTrack } from "@/lib/audioLibrary";
import type { GifSearchResult } from "@/lib/gifSearch";
import type { ProductSticker } from "@/lib/postEditState";
import { mergeProductTagSticker } from "@/lib/productTagUtils";
import {
  pickMediaFromLibrary,
  pickMultipleImages,
  waitForNativePickerReady,
} from "@/lib/createMediaPicker";

const { width: SCREEN_W } = Dimensions.get("window");
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PREVIEW_W = SCREEN_W;
const PREVIEW_H = (PREVIEW_W * CANVAS_H) / CANVAS_W;
const SCALE = PREVIEW_W / CANVAS_W;

export type StoryCompositorExportMeta = {
  partnership: PartnershipSettings;
  filterId: string;
};

export type StoryCompositorProps = {
  visible: boolean;
  imageUri: string;
  userId: string;
  profileId?: string | null;
  profileAvatar?: string | null;
  profileUsername?: string;
  brandStores?: BrandStoreOption[];
  initialMusicTrack?: AudioTrack | null;
  onClose: () => void;
  onExport: (
    bakedUri: string,
    stickers: StickerLayer[],
    meta: StoryCompositorExportMeta
  ) => void;
};

function newStickerId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function StoryCompositor({
  visible,
  imageUri,
  userId,
  profileId,
  profileAvatar,
  profileUsername,
  brandStores = [],
  initialMusicTrack,
  onClose,
  onExport,
}: StoryCompositorProps) {
  const canvasRef = useRef<View>(null);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const musicSeededRef = useRef(false);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [showStickers, setShowStickers] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [promptKind, setPromptKind] = useState<StoryPromptKind | null>(null);

  const [partnership, setPartnership] = useState<PartnershipSettings>({
    paidPartnershipLabel: false,
    partnershipAdCode: false,
    partnershipAdCodeValue: null,
  });

  const overlayColor =
    FILTER_PRESETS.find((f) => f.id === selectedFilter)?.overlayColor || "transparent";

  const addSticker = useCallback((layer: StickerLayer) => {
    setStickers((prev) => [...prev, layer]);
    setSelectedId(layer.id);
  }, []);

  useEffect(() => {
    if (!visible || !initialMusicTrack || musicSeededRef.current) return;
    musicSeededRef.current = true;
    addSticker({
      id: `mu_${Date.now()}`,
      type: "music",
      text: initialMusicTrack.title,
      x: CANVAS_W * 0.12,
      y: CANVAS_H * 0.12,
      scale: 1,
      meta: {
        musicTrackId: initialMusicTrack.id,
        musicTitle: initialMusicTrack.title,
        musicArtist: initialMusicTrack.artist,
        musicUrl: initialMusicTrack.url,
        musicCover: initialMusicTrack.cover,
      },
    });
  }, [visible, initialMusicTrack, addSticker]);

  useEffect(() => {
    if (!visible) {
      musicSeededRef.current = false;
    }
  }, [visible]);

  const moveSticker = useCallback((id: string, x: number, y: number) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  }, []);

  const deleteSticker = useCallback((id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const addMentionStickers = useCallback(
    (profiles: ProfileSearchResult[]) => {
      profiles.forEach((p, i) => {
        addSticker({
          id: newStickerId("mn"),
          type: "mention",
          text: p.username,
          x: CANVAS_W * 0.12,
          y: CANVAS_H * (0.25 + i * 0.08),
          scale: 1,
          meta: {
            username: p.username,
            profileId: p.id,
            avatar: p.logo || undefined,
            name: p.name,
          },
        });
      });
    },
    [addSticker]
  );

  const addLocationSticker = useCallback(
    (loc: LocationResult) => {
      addSticker({
        id: newStickerId("loc"),
        type: "location",
        text: loc.label,
        x: CANVAS_W * 0.12,
        y: CANVAS_H * 0.35,
        scale: 1,
        meta: {
          locationName: loc.label,
          locationLat: loc.lat,
          locationLon: loc.lon,
        },
      });
    },
    [addSticker]
  );

  const pickOverlayPhoto = useCallback(
    async (kind: "photo" | "cutout") => {
      setShowStickers(false);
      await waitForNativePickerReady();
      const asset = await pickMediaFromLibrary("post");
      if (!asset?.uri) return;
      addSticker({
        id: newStickerId(kind === "cutout" ? "co" : "ph"),
        type: kind,
        text: "",
        x: CANVAS_W * 0.25,
        y: CANVAS_H * 0.3,
        scale: 1,
        meta: { imageUri: asset.uri },
      });
    },
    [addSticker]
  );

  const pickFramePhotos = useCallback(async () => {
    setShowStickers(false);
    await waitForNativePickerReady();
    const assets = await pickMultipleImages(3);
    if (!assets.length) return;
    addSticker({
      id: newStickerId("fr"),
      type: "frame",
      text: "Photostrip",
      x: CANVAS_W * 0.55,
      y: CANVAS_H * 0.28,
      scale: 1,
      meta: { frameUris: assets.map((a) => a.uri) },
    });
  }, [addSticker]);

  const handleStickerSelect = useCallback(
    (def: StoryStickerDef) => {
      const type = def.mapsTo;
      switch (type) {
        case "mention":
          setShowMention(true);
          break;
        case "location":
          setShowLocation(true);
          break;
        case "music":
          setShowMusic(true);
          break;
        case "photo":
          pickOverlayPhoto("photo");
          break;
        case "gif":
          setShowGif(true);
          break;
        case "add_yours":
          setPromptKind("add_yours");
          break;
        case "frame":
          pickFramePhotos();
          break;
        case "question":
          setPromptKind("question");
          break;
        case "cutout":
          pickOverlayPhoto("cutout");
          break;
        case "notify":
          addSticker({
            id: newStickerId("nt"),
            type: "notify",
            text: "Notify",
            x: CANVAS_W * 0.12,
            y: CANVAS_H * 0.65,
            scale: 1,
          });
          break;
        case "avatar":
          addSticker({
            id: newStickerId("av"),
            type: "avatar",
            text: profileUsername || "You",
            x: CANVAS_W * 0.35,
            y: CANVAS_H * 0.5,
            scale: 1,
            meta: {
              avatar: profileAvatar || undefined,
              profileId: profileId || undefined,
              username: profileUsername,
            },
          });
          break;
        case "emoji":
          setShowEmoji(true);
          break;
        case "poll":
          setPromptKind("poll");
          break;
        case "emoji_slider":
          setPromptKind("emoji_slider");
          break;
        case "link":
          setShowLink(true);
          break;
        case "hashtag":
          setPromptKind("hashtag");
          break;
        case "countdown":
          setShowCountdown(true);
          break;
        case "product":
          if (!brandStores.length) {
            Alert.alert(
              "No products",
              "Create a brand store and add products to use product stickers."
            );
            return;
          }
          setShowProduct(true);
          break;
        default:
          break;
      }
    },
    [addSticker, brandStores.length, pickFramePhotos, pickOverlayPhoto, profileAvatar, profileId, profileUsername]
  );

  const syncPartnershipSticker = useCallback((settings: PartnershipSettings) => {
    setPartnership(settings);
    setStickers((prev) => {
      const without = prev.filter((s) => s.type !== "partnership");
      if (!settings.paidPartnershipLabel) return without;
      return [
        ...without,
        {
          id: newStickerId("pt"),
          type: "partnership" as const,
          text: "Paid partnership",
          x: CANVAS_W * 0.08,
          y: CANVAS_H * 0.08,
          scale: 1,
          meta: {
            partnershipPaid: settings.paidPartnershipLabel,
            partnershipAdCode: settings.partnershipAdCode,
            partnershipAdCodeValue: settings.partnershipAdCodeValue ?? undefined,
          },
        },
      ];
    });
  }, []);

  const exportStickers = useMemo(() => {
    if (!drawStrokes.length) return stickers;
    return [
      ...stickers.filter((s) => s.type !== "draw"),
      {
        id: newStickerId("dr"),
        type: "draw" as const,
        text: "",
        x: 0,
        y: 0,
        scale: 1,
        meta: { drawStrokes },
      },
    ];
  }, [stickers, drawStrokes]);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const uri = await captureRef(canvasRef, {
        format: "jpg",
        quality: 0.92,
        width: CANVAS_W,
        height: CANVAS_H,
      });
      onExport(uri, exportStickers, { partnership, filterId: selectedFilter });
    } catch (e) {
      Alert.alert(
        "Export failed",
        e instanceof Error ? e.message : "Could not bake story layers."
      );
    } finally {
      setExporting(false);
    }
  }, [exportStickers, onExport, partnership, selectedFilter]);

  const toolbarItems = [
    { id: "text", icon: "text", label: "Text", onPress: () => setShowText(true) },
    { id: "stickers", icon: "happy-outline", label: "Stickers", onPress: () => setShowStickers(true) },
    { id: "effects", icon: "color-wand-outline", label: "Effects", onPress: () => setShowFilters((v) => !v) },
    { id: "partnership", icon: "briefcase-outline", label: "Partnership", onPress: () => setShowPartnership(true) },
    { id: "mention", icon: "at", label: "Mention", onPress: () => setShowMention(true) },
    { id: "draw", icon: "brush-outline", label: "Draw", onPress: () => setShowDraw(true) },
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.root} onPress={() => setSelectedId(null)}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.topBtn}>
            <Lucide name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} disabled={exporting} style={styles.topBtn}>
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.nextText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.canvasWrap}>
          <View
            ref={canvasRef}
            collapsable={false}
            style={[styles.canvas, { width: PREVIEW_W, height: PREVIEW_H }]}
          >
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
              pointerEvents="none"
            />
            <StoryDrawStrokesLayer strokes={drawStrokes} scale={SCALE} />
            {stickers.map((s) => (
              <StoryDraggableSticker
                key={s.id}
                sticker={s}
                scale={SCALE}
                canvasW={CANVAS_W}
                canvasH={CANVAS_H}
                selected={selectedId === s.id}
                onSelect={setSelectedId}
                onMove={moveSticker}
                onDelete={deleteSticker}
              />
            ))}
          </View>

          <View style={styles.rightToolbar}>
            {toolbarItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.toolIconBtn}
                onPress={item.onPress}
                accessibilityLabel={item.label}
              >
                <Lucide name={item.icon as any} size={24} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showFilters ? (
          <View style={styles.filterDock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTER_PRESETS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterBtn, selectedFilter === f.id && styles.filterBtnActive]}
                  onPress={() => setSelectedFilter(f.id)}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      selectedFilter === f.id && styles.filterBtnTextActive,
                    ]}
                  >
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <StoryStickerTray
          visible={showStickers}
          onClose={() => setShowStickers(false)}
          onSelect={handleStickerSelect}
        />

        <StoryTextEditor
          visible={showText}
          imageUri={imageUri}
          onClose={() => setShowText(false)}
          onDone={(result) => {
            addSticker({
              id: newStickerId("tx"),
              type: "text",
              text: result.text,
              x: CANVAS_W * 0.12,
              y: CANVAS_H * 0.42,
              scale: 1,
              color: result.color,
              meta: result.meta,
            });
          }}
          onOpenMention={() => {
            setShowText(false);
            setShowMention(true);
          }}
          onOpenLocation={() => {
            setShowText(false);
            setShowLocation(true);
          }}
        />

        <StoryPartnershipSheet
          visible={showPartnership}
          settings={partnership}
          userId={userId}
          profileId={profileId}
          onClose={() => setShowPartnership(false)}
          onChange={syncPartnershipSticker}
        />

        <StoryMentionPicker
          visible={showMention}
          onClose={() => setShowMention(false)}
          onDone={addMentionStickers}
        />

        <StoryLocationPicker
          visible={showLocation}
          onClose={() => setShowLocation(false)}
          onPick={addLocationSticker}
        />

        <StoryMusicPicker
          visible={showMusic}
          onClose={() => setShowMusic(false)}
          onSelect={(track: AudioTrack) => {
            addSticker({
              id: newStickerId("mu"),
              type: "music",
              text: track.title,
              x: CANVAS_W * 0.1,
              y: CANVAS_H * 0.78,
              scale: 1,
              meta: {
                musicTitle: track.title,
                musicTrackId: track.id,
                musicArtist: track.artist,
                musicUrl: track.url,
                musicCover: track.cover,
              },
            });
          }}
        />

        <StoryGifPicker
          visible={showGif}
          userId={userId}
          onClose={() => setShowGif(false)}
          onPick={(gif: GifSearchResult) => {
            addSticker({
              id: newStickerId("gf"),
              type: "gif",
              text: gif.title,
              x: CANVAS_W * 0.2,
              y: CANVAS_H * 0.35,
              scale: 1,
              meta: {
                imageUri: gif.url,
                gifId: gif.id,
                gifPreviewUrl: gif.previewUrl,
              },
            });
          }}
        />

        <StoryLinkInput
          visible={showLink}
          onClose={() => setShowLink(false)}
          onSubmit={(url) => {
            addSticker({
              id: newStickerId("lk"),
              type: "link",
              text: url.replace(/^https?:\/\//, "").slice(0, 32),
              x: CANVAS_W * 0.12,
              y: CANVAS_H * 0.6,
              scale: 1,
              meta: { linkUrl: url },
            });
          }}
        />

        <StoryCountdownPicker
          visible={showCountdown}
          onClose={() => setShowCountdown(false)}
          onSubmit={(result) => {
            addSticker({
              id: newStickerId("cd"),
              type: "countdown",
              text: result.displayText,
              x: CANVAS_W * 0.35,
              y: CANVAS_H * 0.45,
              scale: 1,
              meta: {
                countdownLabel: result.label,
                countdownEndsAt: result.endsAt,
              },
            });
          }}
        />

        <StoryProductPicker
          visible={showProduct}
          userId={userId}
          brandStores={brandStores}
          onClose={() => setShowProduct(false)}
          onPickProducts={(products: ProductSticker[]) => {
            setStickers((prev) =>
              mergeProductTagSticker(prev, products, CANVAS_W, CANVAS_H)
            );
          }}
        />

        <StoryPromptSheet
          visible={promptKind !== null}
          kind={promptKind || "poll"}
          onClose={() => setPromptKind(null)}
          onSubmit={(result) => {
            if (result.kind === "poll") {
              addSticker({
                id: newStickerId("pl"),
                type: "poll",
                text: result.question,
                x: CANVAS_W * 0.1,
                y: CANVAS_H * 0.4,
                scale: 1,
                meta: { pollOptions: result.options },
              });
            } else if (result.kind === "question") {
              addSticker({
                id: newStickerId("qs"),
                type: "question",
                text: result.question,
                x: CANVAS_W * 0.1,
                y: CANVAS_H * 0.42,
                scale: 1,
                meta: { question: result.question },
              });
            } else if (result.kind === "add_yours") {
              addSticker({
                id: newStickerId("ay"),
                type: "add_yours",
                text: result.prompt,
                x: CANVAS_W * 0.12,
                y: CANVAS_H * 0.55,
                scale: 1,
                meta: { addYoursPrompt: result.prompt },
              });
            } else if (result.kind === "hashtag") {
              addSticker({
                id: newStickerId("ht"),
                type: "hashtag",
                text: result.tag,
                x: CANVAS_W * 0.12,
                y: CANVAS_H * 0.48,
                scale: 1,
              });
            } else if (result.kind === "emoji_slider") {
              addSticker({
                id: newStickerId("es"),
                type: "emoji_slider",
                text: result.emoji,
                x: CANVAS_W * 0.08,
                y: CANVAS_H * 0.58,
                scale: 1,
                meta: { emoji: result.emoji, sliderValue: 50 },
              });
            }
          }}
        />

        <Modal visible={showEmoji} animationType="slide" transparent onRequestClose={() => setShowEmoji(false)}>
          <Pressable style={styles.emojiBackdrop} onPress={() => setShowEmoji(false)}>
            <Pressable style={styles.emojiSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.emojiTitle}>Pick emoji</Text>
              <View style={styles.emojiGrid}>
                {STORY_EMOJI_OPTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={styles.emojiCell}
                    onPress={() => {
                      addSticker({
                        id: newStickerId("em"),
                        type: "emoji",
                        text: em,
                        x: CANVAS_W * 0.2 + Math.random() * CANVAS_W * 0.4,
                        y: CANVAS_H * 0.25 + Math.random() * CANVAS_H * 0.35,
                        scale: 1.2,
                      });
                      setShowEmoji(false);
                    }}
                  >
                    <Text style={styles.emojiGlyph}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <StoryDrawOverlay
          visible={showDraw}
          canvasWidth={CANVAS_W}
          canvasHeight={CANVAS_H}
          initialStrokes={drawStrokes}
          onClose={() => setShowDraw(false)}
          onDone={(strokes) => {
            setDrawStrokes(strokes);
            setShowDraw(false);
          }}
        />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  canvasWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  canvas: { overflow: "hidden", backgroundColor: "#111" },
  rightToolbar: {
    position: "absolute",
    right: 12,
    top: "28%",
    gap: 14,
    alignItems: "center",
  },
  toolIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterDock: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 72,
    paddingHorizontal: 12,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  filterBtnActive: { backgroundColor: "rgba(255,255,255,0.92)" },
  filterBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  filterBtnTextActive: { color: "#111" },
  emojiBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  emojiSheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 32,
  },
  emojiTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiGlyph: { fontSize: 28 },
});
