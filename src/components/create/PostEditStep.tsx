import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import type { PostEditState } from "@/lib/postEditState";
import { PostEditorCanvas } from "@/components/create/PostEditorCanvas";
import { POST_CANVAS_W, POST_CANVAS_H } from "@/components/create/postEditorConstants";
import type { StickerLayer } from "@/lib/createDraft";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import { PostAudioSheet } from "@/components/create/PostAudioSheet";
import { PostFilterSheet } from "@/components/create/PostFilterSheet";
import { PostAdjustSheet } from "@/components/create/PostAdjustSheet";
import { StoryStickerTray } from "@/components/stories/editor/StoryStickerTray";
import { StoryTextEditor } from "@/components/stories/editor/StoryTextEditor";
import { StoryPartnershipSheet } from "@/components/stories/editor/StoryPartnershipSheet";
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
import type { AudioTrack } from "@/lib/audioLibrary";
import type { GifSearchResult } from "@/lib/gifSearch";
import type { ProductSticker } from "@/lib/postEditState";
import { mergeProductTagSticker } from "@/lib/productTagUtils";
import {
  pickMediaFromLibrary,
  pickMultipleImages,
  waitForNativePickerReady,
} from "@/lib/createMediaPicker";

function newStickerId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface PostEditStepProps {
  mediaUris: string[];
  activeIndex: number;
  editState: PostEditState;
  brandStores: BrandStoreOption[];
  userId?: string;
  profileId?: string | null;
  profileAvatar?: string | null;
  profileUsername?: string;
  onBack: () => void;
  onNext: () => void;
  onEditChange: (edit: PostEditState) => void;
  onActiveIndexChange: (index: number) => void;
}

export function PostEditStep({
  mediaUris,
  activeIndex,
  editState,
  brandStores,
  userId = "",
  profileId,
  profileAvatar,
  profileUsername,
  onBack,
  onNext,
  onEditChange,
  onActiveIndexChange,
}: PostEditStepProps) {
  const [activeTool, setActiveTool] = useState<
    "audio" | "filter" | "edit" | null
  >(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showStickers, setShowStickers] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [promptKind, setPromptKind] = useState<StoryPromptKind | null>(null);

  const uri = mediaUris[activeIndex] ?? mediaUris[0];
  const patch = (p: Partial<PostEditState>) => onEditChange({ ...editState, ...p });

  const addSticker = useCallback(
    (layer: StickerLayer) => {
      patch({ stickerLayers: [...editState.stickerLayers, layer] });
      setSelectedId(layer.id);
    },
    [editState.stickerLayers, onEditChange, editState]
  );

  const moveSticker = useCallback(
    (id: string, x: number, y: number) => {
      patch({
        stickerLayers: editState.stickerLayers.map((s) => (s.id === id ? { ...s, x, y } : s)),
      });
    },
    [editState.stickerLayers, onEditChange, editState]
  );

  const deleteSticker = useCallback(
    (id: string) => {
      patch({ stickerLayers: editState.stickerLayers.filter((s) => s.id !== id) });
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [editState.stickerLayers, onEditChange, editState]
  );

  const addMentionStickers = (profiles: ProfileSearchResult[]) => {
    const next = [...editState.stickerLayers];
    profiles.forEach((p, i) => {
      next.push({
        id: newStickerId("mn"),
        type: "mention",
        text: p.username,
        x: POST_CANVAS_W * 0.12,
        y: POST_CANVAS_H * (0.2 + i * 0.07),
        scale: 1,
        meta: {
          username: p.username,
          profileId: p.id,
          avatar: p.logo || undefined,
          name: p.name,
        },
      });
    });
    patch({ stickerLayers: next });
  };

  const addLocationSticker = (loc: LocationResult) => {
    addSticker({
      id: newStickerId("loc"),
      type: "location",
      text: loc.label,
      x: POST_CANVAS_W * 0.12,
      y: POST_CANVAS_H * 0.3,
      scale: 1,
      meta: { locationName: loc.label, locationLat: loc.lat, locationLon: loc.lon },
    });
  };

  const pickOverlayPhoto = async (kind: "photo" | "cutout") => {
    setShowStickers(false);
    await waitForNativePickerReady();
    const asset = await pickMediaFromLibrary("post");
    if (!asset?.uri) return;
    addSticker({
      id: newStickerId(kind === "cutout" ? "co" : "ph"),
      type: kind,
      text: "",
      x: POST_CANVAS_W * 0.25,
      y: POST_CANVAS_H * 0.25,
      scale: 1,
      meta: { imageUri: asset.uri },
    });
  };

  const pickFramePhotos = async () => {
    setShowStickers(false);
    await waitForNativePickerReady();
    const assets = await pickMultipleImages(3);
    if (!assets.length) return;
    addSticker({
      id: newStickerId("fr"),
      type: "frame",
      text: "Photostrip",
      x: POST_CANVAS_W * 0.55,
      y: POST_CANVAS_H * 0.2,
      scale: 1,
      meta: { frameUris: assets.map((a) => a.uri) },
    });
  };

  const handleStickerSelect = (def: StoryStickerDef) => {
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
          x: POST_CANVAS_W * 0.12,
          y: POST_CANVAS_H * 0.65,
          scale: 1,
        });
        break;
      case "avatar":
        addSticker({
          id: newStickerId("av"),
          type: "avatar",
          text: profileUsername || "You",
          x: POST_CANVAS_W * 0.35,
          y: POST_CANVAS_H * 0.45,
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
          Alert.alert("No products", "Create a brand store to add product stickers.");
          return;
        }
        setShowProduct(true);
        break;
      default:
        break;
    }
  };

  const syncPartnership = (partnership: PostEditState["partnership"]) => {
    const without = editState.stickerLayers.filter((s) => s.type !== "partnership");
    const layers: StickerLayer[] = partnership.paidPartnershipLabel
      ? [
          ...without,
          {
            id: newStickerId("pt"),
            type: "partnership" as const,
            text: "Paid partnership",
            x: POST_CANVAS_W * 0.08,
            y: POST_CANVAS_H * 0.06,
            scale: 1,
            meta: {
              partnershipPaid: partnership.paidPartnershipLabel,
              partnershipAdCode: partnership.partnershipAdCode,
              partnershipAdCodeValue: partnership.partnershipAdCodeValue ?? undefined,
            },
          },
        ]
      : without;
    patch({ partnership, stickerLayers: layers });
  };

  const rightTools = [
    { id: "text", icon: "text", onPress: () => setShowText(true) },
    { id: "stickers", icon: "happy-outline", onPress: () => setShowStickers(true) },
    { id: "mention", icon: "at", onPress: () => setShowMention(true) },
    { id: "draw", icon: "brush-outline", onPress: () => setShowDraw(true) },
    { id: "partnership", icon: "briefcase-outline", onPress: () => setShowPartnership(true) },
  ] as const;

  const bottomTools = [
    { id: "audio", icon: "musical-notes-outline", label: "Audio", onPress: () => setActiveTool("audio") },
    { id: "filter", icon: "color-filter-outline", label: "Filter", onPress: () => setActiveTool("filter") },
    { id: "edit", icon: "options-outline", label: "Edit", onPress: () => setActiveTool("edit") },
  ] as const;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Lucide name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {editState.audioLabel ? (
          <View style={styles.audioHeaderPill}>
            <Text style={styles.audioHeaderText} numberOfLines={1}>
              ♪ {editState.audioLabel}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity style={styles.nextPill} onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
          <Lucide name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {mediaUris.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselDots}>
          {mediaUris.map((u, i) => (
            <TouchableOpacity key={u + i} onPress={() => onActiveIndexChange(i)}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <Pressable style={styles.previewFlex} onPress={() => setSelectedId(null)}>
        <PostEditorCanvas
          uri={uri}
          edit={editState}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveSticker}
          onDelete={deleteSticker}
        />
        <View style={styles.rightToolbar}>
          {rightTools.map((t) => (
            <TouchableOpacity key={t.id} style={styles.toolIconBtn} onPress={t.onPress}>
              <Lucide name={t.icon as any} size={22} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>

      <View style={styles.toolbar}>
        {bottomTools.map((t) => (
          <TouchableOpacity key={t.id} style={styles.toolBtn} onPress={t.onPress}>
            <View style={styles.toolIconWrap}>
              <Lucide name={t.icon as any} size={22} color="#fff" />
            </View>
            <Text style={styles.toolLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PostAudioSheet
        visible={activeTool === "audio"}
        onClose={() => setActiveTool(null)}
        onSelect={(track: AudioTrack) => {
          patch({
            audioTrackId: track.id,
            audioLabel: `${track.title}${track.artist ? ` · ${track.artist}` : ""}`,
            audioUrl: track.url,
            audioArtist: track.artist,
            audioCover: track.cover,
          });
          setActiveTool(null);
        }}
      />

      <PostFilterSheet
        visible={activeTool === "filter"}
        imageUri={uri}
        selectedId={editState.filterId}
        onClose={() => setActiveTool(null)}
        onSelect={(filterId) => {
          patch({ filterId });
          setActiveTool(null);
        }}
      />

      <PostAdjustSheet
        visible={activeTool === "edit"}
        imageUri={uri}
        adjustments={editState.adjustments}
        filterId={editState.filterId}
        onClose={() => setActiveTool(null)}
        onChange={(adjustments) => patch({ adjustments })}
        onDone={() => setActiveTool(null)}
      />

      <StoryStickerTray visible={showStickers} onClose={() => setShowStickers(false)} onSelect={handleStickerSelect} />

      <StoryTextEditor
        visible={showText}
        imageUri={uri}
        onClose={() => setShowText(false)}
        onDone={(result) => {
          addSticker({
            id: newStickerId("tx"),
            type: "text",
            text: result.text,
            x: POST_CANVAS_W * 0.12,
            y: POST_CANVAS_H * 0.4,
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
        settings={editState.partnership}
        userId={userId}
        profileId={profileId}
        onClose={() => setShowPartnership(false)}
        onChange={syncPartnership}
      />

      <StoryMentionPicker visible={showMention} onClose={() => setShowMention(false)} onDone={addMentionStickers} />
      <StoryLocationPicker visible={showLocation} onClose={() => setShowLocation(false)} onPick={addLocationSticker} />

      <StoryMusicPicker
        visible={showMusic}
        onClose={() => setShowMusic(false)}
        onSelect={(track) => {
          addSticker({
            id: newStickerId("mu"),
            type: "music",
            text: track.title,
            x: POST_CANVAS_W * 0.1,
            y: POST_CANVAS_H * 0.82,
            scale: 1,
            meta: {
              musicTitle: track.title,
              musicTrackId: track.id,
              musicArtist: track.artist,
              musicUrl: track.url,
              musicCover: track.cover,
            },
          });
          patch({
            audioTrackId: track.id,
            audioLabel: `${track.title}${track.artist ? ` · ${track.artist}` : ""}`,
            audioUrl: track.url,
            audioArtist: track.artist,
            audioCover: track.cover,
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
            x: POST_CANVAS_W * 0.2,
            y: POST_CANVAS_H * 0.3,
            scale: 1,
            meta: { imageUri: gif.url, gifId: gif.id, gifPreviewUrl: gif.previewUrl },
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
            x: POST_CANVAS_W * 0.12,
            y: POST_CANVAS_H * 0.55,
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
            x: POST_CANVAS_W * 0.35,
            y: POST_CANVAS_H * 0.4,
            scale: 1,
            meta: { countdownLabel: result.label, countdownEndsAt: result.endsAt },
          });
        }}
      />

      <StoryProductPicker
        visible={showProduct}
        userId={userId}
        brandStores={brandStores}
        initialSelected={editState.productStickers}
        onClose={() => setShowProduct(false)}
        onPickProducts={(products: ProductSticker[]) => {
          patch({
            stickerLayers: mergeProductTagSticker(
              editState.stickerLayers,
              products,
              POST_CANVAS_W,
              POST_CANVAS_H
            ),
            productStickers: products,
          });
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
              x: POST_CANVAS_W * 0.1,
              y: POST_CANVAS_H * 0.35,
              scale: 1,
              meta: { pollOptions: result.options },
            });
          } else if (result.kind === "question") {
            addSticker({
              id: newStickerId("qs"),
              type: "question",
              text: result.question,
              x: POST_CANVAS_W * 0.1,
              y: POST_CANVAS_H * 0.38,
              scale: 1,
              meta: { question: result.question },
            });
          } else if (result.kind === "hashtag") {
            addSticker({
              id: newStickerId("ht"),
              type: "hashtag",
              text: result.tag,
              x: POST_CANVAS_W * 0.12,
              y: POST_CANVAS_H * 0.45,
              scale: 1,
            });
          } else if (result.kind === "emoji_slider") {
            addSticker({
              id: newStickerId("es"),
              type: "emoji_slider",
              text: result.emoji,
              x: POST_CANVAS_W * 0.08,
              y: POST_CANVAS_H * 0.5,
              scale: 1,
              meta: { emoji: result.emoji, sliderValue: 50 },
            });
          }
        }}
      />

      {showEmoji ? (
        <View style={styles.emojiOverlay}>
          <Pressable style={styles.emojiBackdrop} onPress={() => setShowEmoji(false)} />
          <View style={styles.emojiSheet}>
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
                      x: POST_CANVAS_W * 0.2 + Math.random() * POST_CANVAS_W * 0.4,
                      y: POST_CANVAS_H * 0.2 + Math.random() * POST_CANVAS_H * 0.35,
                      scale: 1.2,
                    });
                    setShowEmoji(false);
                  }}
                >
                  <Text style={styles.emojiGlyph}>{em}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <StoryDrawOverlay
        visible={showDraw}
        canvasWidth={POST_CANVAS_W}
        canvasHeight={POST_CANVAS_H}
        initialStrokes={editState.drawStrokes}
        onClose={() => setShowDraw(false)}
        onDone={(strokes) => {
          patch({ drawStrokes: strokes });
          setShowDraw(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  audioHeaderPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioHeaderText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  nextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0095f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  carouselDots: { maxHeight: 20, paddingHorizontal: 16 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginRight: 6,
  },
  dotActive: { backgroundColor: "#0095f6" },
  previewFlex: { flex: 1, minHeight: 0, position: "relative" },
  rightToolbar: {
    position: "absolute",
    right: 8,
    top: "22%",
    gap: 10,
    zIndex: 20,
  },
  toolIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#000",
  },
  toolBtn: { alignItems: "center", gap: 6, width: 72 },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: { color: "#fff", fontSize: 11, fontWeight: "500" },
  emojiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
  },
  emojiBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  emojiSheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 32,
  },
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
