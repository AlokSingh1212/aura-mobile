import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerShell } from "@/components/create/ComposerShell";
import { StoryCompositor } from "@/components/create/StoryCompositor";
import { pickMediaFromLibrary } from "@/lib/createMediaPicker";
import { compressImageForStory } from "@/lib/compressMedia";
import { uploadAndPublish } from "@/lib/publishContent";
import { createEmptyDraft, saveDraft, type StickerLayer } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";

const { width, height } = Dimensions.get("window");

type Step = "pick" | "edit" | "preview" | "share";

export default function StoryComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const [step, setStep] = useState<Step>("pick");
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [bakedUri, setBakedUri] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showCompositor, setShowCompositor] = useState(false);
  const [alsoPostToGrid, setAlsoPostToGrid] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [picking, setPicking] = useState(false);
  const pickerStarted = useRef(false);

  const openGallery = useCallback(async () => {
    setPicking(true);
    try {
      const asset = await pickMediaFromLibrary("story");
      if (!asset?.uri) {
        if (!localUri) router.back();
        return;
      }
      triggerHaptic("success");
      const compressed = await compressImageForStory(asset.uri);
      setLocalUri(compressed);
      setBakedUri(null);
      setStickers([]);

      const draft = createEmptyDraft("story");
      draft.clips = [{ id: "clip_1", uri: compressed, inMs: 0, outMs: 0 }];
      draft.step = "edit";
      const saved = await saveDraft(draft);
      setDraftId(saved.id);

      setShowCompositor(true);
      setStep("edit");
    } catch (e) {
      Alert.alert(
        "Photo error",
        e instanceof Error ? e.message : "Could not process photo."
      );
      if (!localUri) router.back();
    } finally {
      setPicking(false);
    }
  }, [localUri, triggerHaptic]);

  useEffect(() => {
    if (!ready || pickerStarted.current) return;
    pickerStarted.current = true;
    openGallery();
  }, [ready, openGallery]);

  const handleCompositorExport = async (uri: string, exportedStickers: StickerLayer[]) => {
    setBakedUri(uri);
    setStickers(exportedStickers);
    setShowCompositor(false);
    setStep("preview");

    if (draftId) {
      const draft = createEmptyDraft("story");
      draft.id = draftId;
      draft.clips = [{ id: "clip_1", uri, inMs: 0, outMs: 0 }];
      draft.stickers = exportedStickers;
      draft.step = "preview";
      await saveDraft(draft);
    }
  };

  const handleShare = async () => {
    const publishUri = bakedUri || localUri;
    if (!publishUri) return;
    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const result = await uploadAndPublish(publishUri, "story", {
        userId,
        profileId,
        profileName,
        caption: "Story",
        alsoPostToGrid,
      });
      syncAfterPublish("story", result, "Story");
      triggerHaptic("success");
      Alert.alert(
        alsoPostToGrid ? "Story + post shared" : "Story shared",
        alsoPostToGrid
          ? "Your story and grid post are live."
          : "Your story is live for 24 hours.",
        [{ text: "OK", onPress: () => router.replace("/account") }]
      );
    } catch (e) {
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not publish story."
      );
    } finally {
      setPublishing(false);
      resetExportJob();
    }
  };

  if (!ready || (step === "pick" && picking)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Opening gallery…</Text>
      </View>
    );
  }

  const previewUri = bakedUri || localUri;

  return (
    <>
      {localUri ? (
        <StoryCompositor
          visible={showCompositor}
          imageUri={localUri}
          onClose={() => {
            setShowCompositor(false);
            if (!bakedUri) router.back();
          }}
          onExport={handleCompositorExport}
        />
      ) : null}

      {step === "pick" && (
        <ComposerShell title="New story" stepLabel="Select photo">
          <View style={styles.emptyPick}>
            <Lucide name="add-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Choose a vertical photo for your story</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openGallery}>
              <Text style={styles.primaryBtnText}>Open gallery</Text>
            </TouchableOpacity>
          </View>
        </ComposerShell>
      )}

      {step === "preview" && previewUri && (
        <ComposerShell
          title="New story"
          stepLabel="Preview"
          onBack={() => {
            setShowCompositor(true);
            setStep("edit");
          }}
          rightLabel="Next"
          onRightPress={() => setStep("share")}
        >
          <View style={styles.previewWrap}>
            <Image source={{ uri: previewUri }} style={styles.storyPreview} resizeMode="cover" />
            {stickers.length > 0 ? (
              <Text style={styles.bakedHint}>
                {stickers.length} sticker{stickers.length === 1 ? "" : "s"} baked into image
              </Text>
            ) : null}
          </View>
        </ComposerShell>
      )}

      {step === "share" && (
        <ComposerShell
          title="New story"
          stepLabel="Share"
          onBack={() => setStep("preview")}
          rightLabel="Share"
          onRightPress={handleShare}
          rightLoading={publishing}
        >
          <View style={styles.shareWrap}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.shareThumb} />
            ) : null}
            <View style={styles.shareOptions}>
              <View style={styles.optionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Also share to profile grid</Text>
                  <Text style={styles.optionDesc}>Creates a permanent post alongside your story</Text>
                </View>
                <Switch
                  value={alsoPostToGrid}
                  onValueChange={setAlsoPostToGrid}
                  trackColor={{ false: "#333", true: "rgba(0,245,255,0.35)" }}
                  thumbColor={alsoPostToGrid ? "#00f5ff" : "#888"}
                />
              </View>
            </View>
          </View>
        </ComposerShell>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 12,
    fontSize: 14,
  },
  emptyPick: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#080415",
    fontWeight: "700",
    fontSize: 16,
  },
  previewWrap: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  storyPreview: {
    width: width * 0.72,
    height: height * 0.75,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  bakedHint: {
    color: "#00f5ff",
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
  },
  shareWrap: {
    flex: 1,
    padding: 20,
  },
  shareThumb: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#111",
    marginBottom: 24,
  },
  shareOptions: {
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
  },
  optionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  optionDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 4,
  },
});
