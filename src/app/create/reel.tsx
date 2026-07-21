import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReelGalleryStep, type CaptureMode } from "@/components/create/ReelGalleryStep";
import { ReelEditStep } from "@/components/create/ReelEditStep";
import { ReelShareStep, buildReelCaption, buildReelPublishExtras, type ReelShareDetails } from "@/components/create/ReelShareStep";
import { CameraStudio } from "@/components/CameraStudio";
import { pickMediaFromLibrary } from "@/lib/createMediaPicker";
import { uploadAndPublish } from "@/lib/publishContent";
import { createEmptyDraft, saveDraft, type ClipSegment } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import type { AudioTrack } from "@/lib/audioLibrary";
import type { ReelCountdownSeconds } from "@/constants/reelStudio";

type Step = "gallery" | "edit" | "share";

function urisToClips(uris: string[]): ClipSegment[] {
  return uris.map((uri, i) => ({
    id: `clip_${Date.now()}_${i}`,
    uri,
    inMs: 0,
    outMs: 0,
  }));
}

export default function ReelComposerScreen() {
  const params = useLocalSearchParams<{ centerModes?: string; openRecord?: string }>();
  const showCenterModes = params.centerModes === "1";
  const insets = useSafeAreaInsets();
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const userProfiles = useStore((s) => s.userProfiles);
  const activeProfile = useStore((s) => s.activeProfile);

  const [step, setStep] = useState<Step>("gallery");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("reel");
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState("none");
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [audioStartMs, setAudioStartMs] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showRecordCamera, setShowRecordCamera] = useState(params.openRecord === "1");
  const [recordCountdown, setRecordCountdown] = useState<ReelCountdownSeconds>(0);

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

  const previewUri = clips[0]?.uri || "";

  const handleGalleryNext = useCallback(
    async (uris: string[]) => {
      if (!uris.length) return;
      triggerHaptic("success");
      const nextClips = urisToClips(uris);
      setClips(nextClips);
      setActiveClipId(nextClips[0]?.id ?? null);
      setStep("edit");

      const draft = createEmptyDraft("reel");
      if (draftId) draft.id = draftId;
      draft.clips = nextClips;
      draft.step = "edit";
      const saved = await saveDraft(draft);
      setDraftId(saved.id);
    },
    [draftId, triggerHaptic]
  );

  const handleAddClip = useCallback(async () => {
    try {
      const asset = await pickMediaFromLibrary("reel");
      if (!asset?.uri) return;
      const clip: ClipSegment = {
        id: `clip_${Date.now()}`,
        uri: asset.uri,
        inMs: 0,
        outMs: 0,
      };
      setClips((prev) => [...prev, clip]);
      setActiveClipId(clip.id);
      triggerHaptic("success");
    } catch (e) {
      Alert.alert("Video error", e instanceof Error ? e.message : "Could not load video.");
    }
  }, [triggerHaptic]);

  const handleRemoveClip = (id: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveClipId(next[0]?.id ?? null);
      if (!next.length) setStep("gallery");
      return next;
    });
  };

  const handleModeChange = (mode: CaptureMode) => {
    setCaptureMode(mode);
    switch (mode) {
      case "story":
        router.replace("/create/story");
        break;
      case "live":
        router.replace({ pathname: "/account", params: { openCreate: "live" } } as any);
        break;
      case "product":
        router.replace({ pathname: "/account", params: { openCreate: "product" } } as any);
        break;
      default:
        break;
    }
  };

  const persistDraft = async (details: ReelShareDetails) => {
    const draft = createEmptyDraft("reel");
    if (draftId) draft.id = draftId;
    draft.clips = clips;
    draft.filterId = filterId;
    draft.caption = buildReelCaption(details);
    draft.step = "share";
    const saved = await saveDraft(draft);
    setDraftId(saved.id);
    Alert.alert("Draft saved", "Your reel draft is saved. Finish it anytime from your drafts.");
  };

  const handleShare = async (details: ReelShareDetails) => {
    if (!clips.length) return;
    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const caption = buildReelCaption(details) || "New reel";
      const extras = buildReelPublishExtras(details);
      const result = await uploadAndPublish(clips[0].uri, "reel", {
        userId,
        profileId,
        profileName,
        caption,
        productId: details.productStickers[0]?.productId || details.productId || null,
        productStickers: extras.productStickers,
        storyLayers: extras.storyLayers,
        remixSourceId: extras.remixSourceId,
        location: details.verifiedLocation?.label,
        latitude: details.verifiedLocation?.lat,
        longitude: details.verifiedLocation?.lon,
        photoTags: details.photoTags,
        collabs: details.collabPartners,
        clips: clips.length > 1 ? clips : undefined,
        filterId,
        audioTrack: selectedAudio?.url
          ? { url: selectedAudio.url, trackId: selectedAudio.id, startMs: audioStartMs, volume: 1 }
          : null,
        thumbnailUrl: details.customCoverUri,
        scheduledPublishAt: details.scheduledPublishAt || undefined,
        hashtags: details.hashtags,
      });
      syncAfterPublish("reel", result, caption, true);
      triggerHaptic("success");
      if (result.scheduled) {
        Alert.alert(
          "Reel scheduled",
          result.scheduledPublishAt
            ? `Your reel will go live ${new Date(result.scheduledPublishAt).toLocaleString()}.`
            : "Your reel is scheduled and will appear in the feed soon.",
          [{ text: "OK", onPress: () => router.replace("/account") }]
        );
      } else {
        Alert.alert("Reel shared", "Your reel is live on AURA.", [
          { text: "OK", onPress: () => router.replace("/account") },
        ]);
      }
    } catch (e) {
      Alert.alert("Publish failed", e instanceof Error ? e.message : "Could not publish reel.");
    } finally {
      setPublishing(false);
      resetExportJob();
    }
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0095f6" />
      </View>
    );
  }

  if (step === "gallery") {
    return (
      <>
        <ReelGalleryStep
          onClose={() => router.back()}
          onNext={handleGalleryNext}
          onOpenRecord={() => setShowRecordCamera(true)}
          recordCountdown={recordCountdown}
          onRecordCountdownChange={setRecordCountdown}
          showCenterModes={showCenterModes}
          activeMode={captureMode}
          onModeChange={handleModeChange}
        />
        <CameraStudio
          visible={showRecordCamera}
          onClose={() => setShowRecordCamera(false)}
          insets={insets}
          countdownSeconds={recordCountdown}
          onCountdownChange={setRecordCountdown}
          onPostPublished={() => {
            setShowRecordCamera(false);
            router.replace("/account");
          }}
        />
      </>
    );
  }

  if (step === "edit" && clips.length) {
    return (
      <ReelEditStep
        clips={clips}
        activeClipId={activeClipId}
        filterId={filterId}
        onClipsChange={setClips}
        onActiveClipChange={setActiveClipId}
        onFilterChange={setFilterId}
        onAddClip={handleAddClip}
        onRemoveClip={handleRemoveClip}
        selectedAudio={selectedAudio}
        onAudioChange={setSelectedAudio}
        audioStartMs={audioStartMs}
        onAudioStartMsChange={setAudioStartMs}
        onClose={() => setStep("gallery")}
        onNext={() => setStep("share")}
      />
    );
  }

  return (
    <ReelShareStep
      previewUri={previewUri}
      userId={userId}
      brandStores={brandStores}
      defaultStoreId={activeProfile?.type === "BUSINESS" ? activeProfile.id : null}
      publishing={publishing}
      onBack={() => setStep("edit")}
      onSaveDraft={persistDraft}
      onShare={handleShare}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
});
