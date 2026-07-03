import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerShell } from "@/components/create/ComposerShell";
import { ReelTimelineEditor } from "@/components/create/ReelTimelineEditor";
import { AudioSegmentPicker } from "@/components/create/AudioSegmentPicker";
import { AudioSelectorDrawer, type AudioCategory } from "@/components/AudioSelectorDrawer";
import { fetchAudioCatalog, type AudioTrack } from "@/lib/audioLibrary";
import { pickMediaFromLibrary } from "@/lib/createMediaPicker";
import { uploadAndPublish } from "@/lib/publishContent";
import { createEmptyDraft, saveDraft, type ClipSegment } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import { AddProductSheet, type BrandStoreOption } from "@/components/profile/AddProductSheet";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const { width, height } = Dimensions.get("window");

type Step = "choose" | "pick" | "edit" | "caption";

function ReelPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={styles.previewVideo} contentFit="contain" nativeControls />;
}

export default function ReelComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const userProfiles = useStore((s) => s.userProfiles);
  const activeProfile = useStore((s) => s.activeProfile);
  const [step, setStep] = useState<Step>("choose");
  const [clips, setClips] = useState<ClipSegment[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState("none");
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [linkedProductId, setLinkedProductId] = useState<string | null>(null);
  const [linkedProductTitle, setLinkedProductTitle] = useState<string | null>(null);

  const brandStores: BrandStoreOption[] = userProfiles
    .filter((p) => p.type === "BUSINESS")
    .map((p) => ({
      id: p.id,
      name: p.name,
      username: p.username,
      maisonId: p.maisonId || p.username,
      logo: p.logo,
    }));

  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [audioStartMs, setAudioStartMs] = useState(0);
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const soundRef = useRef<any>(null);
  const [audioSearchQuery, setAudioSearchQuery] = useState("");
  const [activeAudioCategory, setActiveAudioCategory] = useState<AudioCategory>("trending");

  useEffect(() => {
    fetchAudioCatalog().then(({ tracks }) => {
      if (tracks[0]) setSelectedAudio(tracks[0]);
    });
  }, []);

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const playTrack = async (url: string) => {
    try {
      soundRef.current?.pause?.();
      soundRef.current?.remove?.();
      const player = createAudioPlayer(url, { downloadFirst: false });
      player.loop = true;
      player.play();
      soundRef.current = player;
      setIsPlayingAudio(true);
    } catch {
      /* ignore */
    }
  };

  const stopTrack = () => {
    soundRef.current?.pause?.();
    soundRef.current?.remove?.();
    soundRef.current = null;
    setIsPlayingAudio(false);
  };

  const addClipFromUri = async (uri: string) => {
    const clip: ClipSegment = {
      id: `clip_${Date.now()}`,
      uri,
      inMs: 0,
      outMs: 0,
    };
    const next = [...clips, clip];
    setClips(next);
    setActiveClipId(clip.id);
    setStep("edit");

    const draft = createEmptyDraft("reel");
    if (draftId) draft.id = draftId;
    draft.clips = next;
    draft.filterId = filterId;
    draft.step = "edit";
    const saved = await saveDraft(draft);
    setDraftId(saved.id);
  };

  const openRecordCamera = () => {
    triggerHaptic("medium");
    router.replace({ pathname: "/", params: { activeTab: "reels", openCamera: "true" } } as any);
  };

  const openGallery = useCallback(async () => {
    setPicking(true);
    try {
      const asset = await pickMediaFromLibrary("reel");
      if (!asset?.uri) {
        if (!clips.length) router.back();
        return;
      }
      triggerHaptic("success");
      await addClipFromUri(asset.uri);
    } catch (e) {
      Alert.alert("Video error", e instanceof Error ? e.message : "Could not load video.");
    } finally {
      setPicking(false);
    }
  }, [clips.length, triggerHaptic]);

  const handleAddClip = () => openGallery();

  const handleRemoveClip = (id: string) => {
    const next = clips.filter((c) => c.id !== id);
    setClips(next);
    setActiveClipId(next[0]?.id ?? null);
    if (!next.length) setStep("choose");
  };

  const handleShare = async () => {
    if (!clips.length) return;
    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const result = await uploadAndPublish(clips[0].uri, "reel", {
        userId,
        profileId,
        profileName,
        caption: caption.trim() || "New reel",
        productId: linkedProductId,
        clips: clips.length > 1 ? clips : undefined,
        filterId,
        audioTrack: selectedAudio?.url
          ? { url: selectedAudio.url, trackId: selectedAudio.id, startMs: audioStartMs, volume: 1 }
          : null,
      });
      syncAfterPublish("reel", result, caption.trim() || "New reel", true);
      triggerHaptic("success");
      Alert.alert(
        "Reel shared",
        linkedProductId
          ? "Your reel and linked product are live."
          : "Music, filters, and clips baked into your reel.",
        [{ text: "OK", onPress: () => router.replace("/account") }]
      );
    } catch (e) {
      Alert.alert("Publish failed", e instanceof Error ? e.message : "Could not publish reel.");
    } finally {
      setPublishing(false);
      resetExportJob();
      stopTrack();
    }
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  if (step === "choose") {
    return (
      <ComposerShell title="New reel" stepLabel="Instagram-level editor">
        <View style={styles.emptyPick}>
          <TouchableOpacity style={styles.primaryBtn} onPress={openRecordCamera}>
            <Lucide name="videocam" size={22} color="#080415" />
            <Text style={styles.primaryBtnText}>Record reel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.secondaryBtn]}
            onPress={() => {
              setStep("pick");
              openGallery();
            }}
          >
            <Lucide name="images-outline" size={22} color="#00f5ff" />
            <Text style={[styles.primaryBtnText, { color: "#00f5ff" }]}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>
      </ComposerShell>
    );
  }

  if (step === "pick" && picking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={styles.loadingText}>Opening gallery…</Text>
      </View>
    );
  }

  if (step === "edit" && activeClip) {
    return (
      <ComposerShell
        title="New reel"
        stepLabel="Edit"
        onBack={() => (clips.length ? setStep("choose") : router.back())}
        rightLabel="Next"
        onRightPress={() => setStep("caption")}
      >
        <View style={styles.previewWrap}>
          <ReelPreview uri={activeClip.uri} />
        </View>
        <ReelTimelineEditor
          clips={clips}
          activeClipId={activeClipId}
          onSelectClip={setActiveClipId}
          onAddClip={handleAddClip}
          onRemoveClip={handleRemoveClip}
          filterId={filterId}
          onFilterChange={setFilterId}
        />
        <TouchableOpacity style={styles.musicBtn} onPress={() => setShowAudioDrawer(true)}>
          <Lucide name="musical-notes" size={18} color="#00f5ff" />
          <Text style={styles.musicBtnText}>{selectedAudio?.title || "Add music"}</Text>
        </TouchableOpacity>
        <AudioSegmentPicker
          durationMs={selectedAudio?.durationMs}
          startMs={audioStartMs}
          onChange={setAudioStartMs}
          trackTitle={selectedAudio?.title}
        />
        {showAudioDrawer && (
          <AudioSelectorDrawer
            setShowAudioDrawer={setShowAudioDrawer}
            stopTrack={stopTrack}
            audioSearchQuery={audioSearchQuery}
            setAudioSearchQuery={setAudioSearchQuery}
            activeAudioCategory={activeAudioCategory}
            setActiveAudioCategory={setActiveAudioCategory}
            selectedAudio={selectedAudio}
            setSelectedAudio={setSelectedAudio}
            isPlayingAudio={isPlayingAudio}
            soundRef={soundRef}
            playTrack={playTrack}
          />
        )}
      </ComposerShell>
    );
  }

  return (
    <ComposerShell
      title="New reel"
      stepLabel="Share"
      onBack={() => setStep("edit")}
      rightLabel="Share"
      onRightPress={handleShare}
      rightLoading={publishing}
    >
      <View style={styles.captionWrap}>
        <Text style={styles.sectionLabel}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />
        <View style={styles.destRow}>
          <Lucide name="checkmark-circle" size={18} color="#00f5ff" />
          <Text style={styles.destText}>
            {clips.length} clip(s) · {filterId !== "none" ? "filter" : "no filter"} · music baked on export
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addProductRow}
          onPress={() => {
            triggerHaptic("medium");
            setShowAddProduct(true);
          }}
        >
          <Lucide name="pricetag-outline" size={20} color="#00f5ff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.addProductTitle}>
              {linkedProductId ? "Product linked" : "Add product to reel"}
            </Text>
            <Text style={styles.addProductSub}>
              {linkedProductTitle || "Tag a shoppable product from your store"}
            </Text>
          </View>
          <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <AddProductSheet
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        brandStores={brandStores}
        defaultStoreId={activeProfile?.type === "BUSINESS" ? activeProfile.id : null}
        showStorePicker={brandStores.length > 1 || activeProfile?.type === "PERSONAL"}
        prefillVideoUri={clips[0]?.uri || null}
        onProductCreated={(artifactId, productTitle) => {
          setLinkedProductId(artifactId);
          setLinkedProductTitle(productTitle);
          setShowAddProduct(false);
        }}
      />
    </ComposerShell>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12, fontSize: 14 },
  emptyPick: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  primaryBtn: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryBtn: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#00f5ff" },
  primaryBtnText: { color: "#080415", fontWeight: "700", fontSize: 16 },
  previewWrap: { flex: 1, backgroundColor: "#000" },
  previewVideo: { width, height: height * 0.45 },
  musicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderRadius: 10,
  },
  musicBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  captionWrap: { flex: 1, padding: 20 },
  sectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  captionInput: { color: "#fff", fontSize: 16, lineHeight: 22, minHeight: 100, textAlignVertical: "top" },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    padding: 14,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderRadius: 10,
  },
  destText: { color: "rgba(255,255,255,0.75)", fontSize: 14, flex: 1 },
  addProductRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addProductTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  addProductSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
