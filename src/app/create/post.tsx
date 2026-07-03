import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerShell } from "@/components/create/ComposerShell";
import { pickMediaFromLibrary, pickMultipleImages } from "@/lib/createMediaPicker";
import { compressImageForPost } from "@/lib/compressMedia";
import { uploadAndPublish, uploadCarouselImages } from "@/lib/publishContent";
import { FilterBakeCanvas, captureFilteredImage, FILTER_PRESETS } from "@/lib/bakeImageFilter";
import { createEmptyDraft, saveDraft } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";

const { width } = Dimensions.get("window");

type Step = "pick" | "edit" | "caption";

export default function PostComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const [step, setStep] = useState<Step>("pick");
  const [localUris, setLocalUris] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterId, setFilterId] = useState("normal");
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [baking, setBaking] = useState(false);
  const canvasRef = useRef<View>(null);
  const pickerStarted = useRef(false);

  const localUri = localUris[activeIndex] ?? null;

  const openGallery = useCallback(async () => {
    setPicking(true);
    try {
      const assets = await pickMultipleImages(10);
      if (!assets.length) {
        const single = await pickMediaFromLibrary("post");
        if (!single?.uri) {
          if (!localUris.length) router.back();
          return;
        }
        const compressed = await compressImageForPost(single.uri);
        setLocalUris([compressed]);
      } else {
        const compressed: string[] = [];
        for (const a of assets) {
          compressed.push(await compressImageForPost(a.uri));
        }
        setLocalUris(compressed);
      }
      triggerHaptic("success");
      setStep("edit");

      const draft = createEmptyDraft("post");
      draft.step = "edit";
      await saveDraft(draft);
    } catch (e) {
      Alert.alert("Photo error", e instanceof Error ? e.message : "Could not process photos.");
      if (!localUris.length) router.back();
    } finally {
      setPicking(false);
    }
  }, [localUris.length, triggerHaptic]);

  useEffect(() => {
    if (!ready || pickerStarted.current) return;
    pickerStarted.current = true;
    openGallery();
  }, [ready, openGallery]);

  const bakeAndAdvance = async () => {
    if (!localUri) return;
    setBaking(true);
    try {
      if (filterId !== "normal" && canvasRef.current) {
        const baked = await captureFilteredImage(canvasRef, 1080, 1080);
        const next = [...localUris];
        next[activeIndex] = baked;
        setLocalUris(next);
      }
      setStep("caption");
    } catch (e) {
      Alert.alert("Filter error", e instanceof Error ? e.message : "Could not bake filter.");
    } finally {
      setBaking(false);
    }
  };

  const handleShare = async () => {
    if (!localUris.length || !caption.trim()) {
      Alert.alert("Caption required", "Write a caption before sharing.");
      return;
    }
    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const uploaded = await uploadCarouselImages(localUris);
      const result = await uploadAndPublish(uploaded[0], "post", {
        userId,
        profileId,
        profileName,
        caption: caption.trim(),
        mediaUrls: uploaded.length > 1 ? uploaded : undefined,
      });
      syncAfterPublish("post", result, caption.trim());
      triggerHaptic("success");
      Alert.alert(
        localUris.length > 1 ? "Carousel posted" : "Post shared",
        "Your post is live on profile and feed.",
        [{ text: "OK", onPress: () => router.replace("/account") }]
      );
    } catch (e) {
      Alert.alert("Publish failed", e instanceof Error ? e.message : "Could not publish post.");
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

  if (step === "pick") {
    return (
      <ComposerShell title="New post" stepLabel="Select photos">
        <View style={styles.emptyPick}>
          <Lucide name="images-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyText}>Choose one or more photos (carousel)</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openGallery}>
            <Text style={styles.primaryBtnText}>Open gallery</Text>
          </TouchableOpacity>
        </View>
      </ComposerShell>
    );
  }

  if (step === "edit" && localUri) {
    return (
      <ComposerShell
        title="New post"
        stepLabel={`Edit ${localUris.length > 1 ? `${activeIndex + 1}/${localUris.length}` : ""}`}
        onBack={() => {
          setStep("pick");
          openGallery();
        }}
        rightLabel="Next"
        onRightPress={bakeAndAdvance}
        rightLoading={baking}
      >
        <View style={styles.previewWrap}>
          <FilterBakeCanvas imageUri={localUri} filterId={filterId} canvasRef={canvasRef} />
          {localUris.length > 1 ? (
            <ScrollView horizontal style={styles.thumbRow}>
              {localUris.map((uri, i) => (
                <TouchableOpacity key={uri + i} onPress={() => setActiveIndex(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === activeIndex && styles.thumbActive]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTER_PRESETS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filterId === f.id && styles.filterChipActive]}
              onPress={() => setFilterId(f.id)}
            >
              <Text style={[styles.filterText, filterId === f.id && styles.filterTextActive]}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.hint}>Filters are baked into the exported image</Text>
      </ComposerShell>
    );
  }

  return (
    <ComposerShell
      title="New post"
      stepLabel="Caption"
      onBack={() => setStep("edit")}
      rightLabel="Share"
      onRightPress={handleShare}
      rightDisabled={!caption.trim()}
      rightLoading={publishing}
    >
      <View style={styles.captionWrap}>
        {localUri ? <Image source={{ uri: localUri }} style={styles.captionThumb} /> : null}
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={caption}
          onChangeText={setCaption}
          multiline
          autoFocus
          maxLength={2200}
        />
      </View>
    </ComposerShell>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12, fontSize: 14 },
  emptyPick: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 15, marginTop: 16, marginBottom: 24, textAlign: "center" },
  primaryBtn: { backgroundColor: "#00f5ff", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  primaryBtnText: { color: "#080415", fontWeight: "700", fontSize: 16 },
  previewWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  thumbRow: { maxHeight: 56, marginTop: 12 },
  thumb: { width: 48, height: 48, borderRadius: 6, marginRight: 8, backgroundColor: "#111" },
  thumbActive: { borderWidth: 2, borderColor: "#00f5ff" },
  filterRow: { maxHeight: 44, paddingHorizontal: 12, marginTop: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  filterChipActive: { backgroundColor: "rgba(0,245,255,0.15)", borderWidth: 1, borderColor: "#00f5ff" },
  filterText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#00f5ff" },
  hint: { color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", paddingBottom: 16 },
  captionWrap: { flex: 1, flexDirection: "row", padding: 16, gap: 14 },
  captionThumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: "#111" },
  captionInput: { flex: 1, color: "#fff", fontSize: 16, lineHeight: 22, textAlignVertical: "top", minHeight: 120 },
});
