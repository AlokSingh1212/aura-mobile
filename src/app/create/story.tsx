import React, { useCallback, useMemo, useState } from "react";
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
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { StoryCompositor, type StoryCompositorExportMeta } from "@/components/create/StoryCompositor";
import {
  StoryGalleryStep,
  type StoryGalleryPick,
} from "@/components/create/StoryGalleryStep";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import { buildStoryPublishExtras } from "@/lib/storyPublishPayload";
import { uploadStoryStickerAssets } from "@/lib/uploadStoryStickers";
import { compressImageForStory } from "@/lib/compressMedia";
import { uploadAndPublish } from "@/lib/publishContent";
import { createEmptyDraft, saveDraft, type StickerLayer } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import type { AudioTrack } from "@/lib/audioLibrary";
import { isReelVideoUrl } from "@/lib/reelMedia";

const { width, height } = Dimensions.get("window");

type Step = "pick" | "edit" | "preview" | "share";

export default function StoryComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const activeProfile = useStore((s) => s.activeProfile);
  const userProfiles = useStore((s) => s.userProfiles);
  const { templateId, prompt } = useLocalSearchParams<{ templateId?: string; prompt?: string }>();
  const participateTemplateId = typeof templateId === "string" ? templateId : undefined;
  const participatePrompt = typeof prompt === "string" ? decodeURIComponent(prompt) : "";
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const [step, setStep] = useState<Step>("pick");
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isVideoStory, setIsVideoStory] = useState(false);
  const [bakedUri, setBakedUri] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showCompositor, setShowCompositor] = useState(false);
  const [alsoPostToGrid, setAlsoPostToGrid] = useState(false);
  const [addYoursPrompt, setAddYoursPrompt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [processingPick, setProcessingPick] = useState(false);
  const [exportMeta, setExportMeta] = useState<StoryCompositorExportMeta | null>(null);
  const [initialMusic, setInitialMusic] = useState<AudioTrack | null>(null);

  const brandStores: BrandStoreOption[] = useMemo(
    () =>
      userProfiles
        .filter((p) => p.type === "BUSINESS")
        .map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          maisonId: p.maisonId || p.username,
          logo: p.logo,
        })),
    [userProfiles]
  );

  const handleGalleryPick = useCallback(
    async (pick: StoryGalleryPick) => {
      setProcessingPick(true);
      try {
        triggerHaptic("success");
        setInitialMusic(pick.musicTrack || null);

        const draft = createEmptyDraft("story");
        draft.clips = [{ id: "clip_1", uri: pick.uri, inMs: 0, outMs: 0 }];
        draft.step = pick.mediaType === "video" ? "preview" : "edit";
        const saved = await saveDraft(draft);
        setDraftId(saved.id);

        if (pick.mediaType === "video" || isReelVideoUrl(pick.uri)) {
          setLocalUri(pick.uri);
          setIsVideoStory(true);
          setBakedUri(null);
          setStickers([]);
          setShowCompositor(false);
          setStep("preview");
          return;
        }

        const compressed = await compressImageForStory(pick.uri);
        setLocalUri(compressed);
        setIsVideoStory(false);
        setBakedUri(null);
        setStickers([]);
        setShowCompositor(true);
        setStep("edit");
      } catch (e) {
        Alert.alert(
          "Media error",
          e instanceof Error ? e.message : "Could not process media."
        );
        setStep("pick");
      } finally {
        setProcessingPick(false);
      }
    },
    [triggerHaptic]
  );

  const handleCompositorExport = async (
    uri: string,
    exportedStickers: StickerLayer[],
    meta: StoryCompositorExportMeta
  ) => {
    setBakedUri(uri);
    setStickers(exportedStickers);
    setExportMeta(meta);
    setShowCompositor(false);
    setStep("preview");

    const addYoursFromSticker = exportedStickers.find((s) => s.type === "add_yours");
    if (addYoursFromSticker?.meta?.addYoursPrompt && !participateTemplateId) {
      setAddYoursPrompt(addYoursFromSticker.meta.addYoursPrompt);
    }

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
      const partnership = exportMeta?.partnership ?? {
        paidPartnershipLabel: false,
        partnershipAdCode: false,
        partnershipAdCodeValue: null,
      };
      const uploadedStickers = await uploadStoryStickerAssets(stickers);
      const extras = buildStoryPublishExtras(
        uploadedStickers,
        partnership,
        partnership.partnershipAdCodeValue
      );
      const result = await uploadAndPublish(publishUri, "story", {
        userId,
        profileId,
        profileName,
        caption: participatePrompt || extras.addYoursPrompt || "Story",
        alsoPostToGrid,
        templateId: participateTemplateId,
        addYoursPrompt: participateTemplateId
          ? undefined
          : addYoursPrompt.trim() || extras.addYoursPrompt || undefined,
        photoTags: extras.photoTags,
        productStickers: extras.productStickers,
        location: extras.location,
        latitude: extras.latitude,
        longitude: extras.longitude,
        music: extras.music || initialMusic?.title,
        musicTrack: extras.musicTrack || (initialMusic
          ? {
              id: initialMusic.id,
              title: initialMusic.title,
              artist: initialMusic.artist,
              url: initialMusic.url,
              cover: initialMusic.cover,
            }
          : null),
        storyLayers: extras.storyLayers,
        partnership: extras.partnership,
      });
      syncAfterPublish("story", { ...result, storyLayers: extras.storyLayers }, "Story");
      triggerHaptic("success");
      Alert.alert(
        participateTemplateId ? "Added to template" : alsoPostToGrid ? "Story + post shared" : "Story shared",
        participateTemplateId
          ? "Your story was added to the Add Yours chain."
          : alsoPostToGrid
            ? "Your story and grid post are live."
            : addYoursPrompt.trim()
              ? "Your story and Add Yours template are live for 24 hours."
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

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (step === "pick") {
    return (
      <>
        <StoryGalleryStep
          onClose={() => router.back()}
          onNext={handleGalleryPick}
        />
        {processingPick ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
      </>
    );
  }

  const previewUri = bakedUri || localUri;

  return (
    <>
      {localUri && !isVideoStory ? (
        <StoryCompositor
          visible={showCompositor}
          imageUri={localUri}
          userId={userId}
          profileId={profileId}
          profileAvatar={activeProfile?.logo}
          profileUsername={activeProfile?.username}
          brandStores={brandStores}
          initialMusicTrack={initialMusic}
          onClose={() => {
            setShowCompositor(false);
            if (!bakedUri) {
              setStep("pick");
              setLocalUri(null);
            }
          }}
          onExport={handleCompositorExport}
        />
      ) : null}

      {step === "preview" && previewUri && (
        <View style={styles.fullScreen}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={() => {
                if (isVideoStory) {
                  setStep("pick");
                  setLocalUri(null);
                } else {
                  setShowCompositor(true);
                  setStep("edit");
                }
              }}
              hitSlop={12}
            >
              <Lucide name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Preview</Text>
            <TouchableOpacity onPress={() => setStep("share")} hitSlop={12}>
              <Text style={styles.previewNext}>Next</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.previewWrap}>
            {isVideoStory ? (
              <SafeVideoPlayer
                source={previewUri}
                playing
                loop
                style={styles.storyPreview}
                contentFit="cover"
              />
            ) : (
              <Image source={{ uri: previewUri }} style={styles.storyPreview} resizeMode="cover" />
            )}
            {stickers.length > 0 ? (
              <Text style={styles.bakedHint}>
                {stickers.length} sticker{stickers.length === 1 ? "" : "s"} baked into image
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {step === "share" && (
        <View style={styles.fullScreen}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setStep("preview")} hitSlop={12}>
              <Lucide name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Share story</Text>
            <TouchableOpacity onPress={handleShare} disabled={publishing} hitSlop={12}>
              {publishing ? (
                <ActivityIndicator color="#00f5ff" size="small" />
              ) : (
                <Text style={styles.previewNext}>Share</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.shareWrap}>
            {previewUri ? (
              isVideoStory ? (
                <SafeVideoPlayer
                  source={previewUri}
                  playing={false}
                  style={styles.shareThumb}
                  contentFit="cover"
                />
              ) : (
                <Image source={{ uri: previewUri }} style={styles.shareThumb} />
              )
            ) : null}
            {participateTemplateId && participatePrompt ? (
              <View style={styles.addYoursBanner}>
                <Text style={styles.addYoursBannerLabel}>Add Yours</Text>
                <Text style={styles.addYoursBannerPrompt}>{participatePrompt}</Text>
              </View>
            ) : null}
            <View style={styles.shareOptions}>
              {!participateTemplateId ? (
                <View style={styles.optionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>Start Add Yours</Text>
                    <Text style={styles.optionDesc}>
                      Let others respond with their own story using your prompt
                    </Text>
                    <TextInput
                      style={styles.promptInput}
                      placeholder='e.g. "Show your fit of the day"'
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={addYoursPrompt}
                      onChangeText={setAddYoursPrompt}
                      maxLength={280}
                    />
                  </View>
                </View>
              ) : null}
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
        </View>
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
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 54,
    paddingBottom: 10,
  },
  previewTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  previewNext: { color: "#00f5ff", fontSize: 16, fontWeight: "700" },
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
  addYoursBanner: {
    backgroundColor: "rgba(229,57,53,0.2)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(229,57,53,0.35)",
  },
  addYoursBannerLabel: {
    color: "#ff6b6b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  addYoursBannerPrompt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  promptInput: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
});
