import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Lucide from "@expo/vector-icons/Ionicons";
import { pickMultipleImages } from "@/lib/createMediaPicker";
import { compressImageForPost } from "@/lib/compressMedia";
import { uploadAndPublish, uploadCarouselImages } from "@/lib/publishContent";
import { FilterBakeCanvas, captureFilteredImage, FILTER_PRESETS } from "@/lib/bakeImageFilter";
import { createEmptyDraft, saveDraft } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import {
  NewPostDetailsForm,
  type NewPostDetails,
} from "@/components/create/NewPostDetailsForm";
import { fetchProfileProducts } from "@/lib/profileApi";
import type { ProductSearchResult } from "@/lib/postComposerSearch";

type Step = "pick" | "compose" | "filters";

export default function PostComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const { triggerHaptic, activeProfile } = useStore();
  const username = activeProfile?.username || "you";

  const [step, setStep] = useState<Step>("pick");
  const [localUris, setLocalUris] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterId, setFilterId] = useState("normal");
  const [publishing, setPublishing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [baking, setBaking] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<ProductSearchResult[]>([]);
  const canvasRef = useRef<View>(null);
  const pickerStarted = useRef(false);

  useEffect(() => {
    if (!userId && !profileId) return;
    fetchProfileProducts({ userId, profileId: profileId || undefined })
      .then(({ products }) =>
        setCatalogProducts(
          products.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            images: p.images || [],
            maisonId: p.maisonId,
          }))
        )
      )
      .catch(() => setCatalogProducts([]));
  }, [userId, profileId]);

  const localUri = localUris[activeIndex] ?? null;

  const openGallery = useCallback(async () => {
    setPicking(true);
    try {
      const assets = await pickMultipleImages(10);
      if (!assets.length) {
        setStep("pick");
        return;
      }
      const compressed: string[] = [];
      for (const a of assets) {
        compressed.push(await compressImageForPost(a.uri));
      }
      setLocalUris(compressed);
      setActiveIndex(0);
      triggerHaptic("success");
      setStep("compose");

      const draft = createEmptyDraft("post");
      draft.step = "compose";
      await saveDraft(draft);
    } catch (e) {
      Alert.alert("Photo error", e instanceof Error ? e.message : "Could not process photos.");
      setStep("pick");
    } finally {
      setPicking(false);
    }
  }, [triggerHaptic]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      let cancelled = false;
      if (!pickerStarted.current) {
        pickerStarted.current = true;
        openGallery().finally(() => {
          if (cancelled) return;
        });
      }
      return () => {
        cancelled = true;
        pickerStarted.current = false;
      };
    }, [ready, openGallery])
  );

  const applyFilterAndReturn = async () => {
    if (!localUri) return;
    setBaking(true);
    try {
      if (filterId !== "normal" && canvasRef.current) {
        const baked = await captureFilteredImage(canvasRef, 1080, 1080);
        const next = [...localUris];
        next[activeIndex] = baked;
        setLocalUris(next);
      }
      setStep("compose");
    } catch (e) {
      Alert.alert("Filter error", e instanceof Error ? e.message : "Could not apply filter.");
    } finally {
      setBaking(false);
    }
  };

  const buildCaption = (details: NewPostDetails) => {
    let text = details.caption.trim();
    if (details.taggedPeople) {
      for (const raw of details.taggedPeople.split(",")) {
        const tag = raw.trim();
        if (tag && !text.includes(`@${tag}`)) {
          text = `${text} @${tag}`.trim();
        }
      }
    }
    if (details.aiLabel && !text.toLowerCase().includes("#ai")) {
      text = `${text}\n\n#AI`.trim();
    }
    return text;
  };

  const handleShare = async (details: NewPostDetails) => {
    if (!localUris.length) {
      Alert.alert("No photo", "Pick a photo before sharing.");
      return;
    }
    if (!useStore.getState().authToken) {
      Alert.alert("Session expired", "Please sign out and sign in again to publish.");
      return;
    }

    const caption = buildCaption(details) || `✨ ${profileName || "Your"} on AURA`;

    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const uploaded = await uploadCarouselImages(localUris);
      const result = await uploadAndPublish(uploaded[0], "post", {
        userId,
        profileId,
        profileName,
        caption,
        productId: details.productId || null,
        location: details.location || undefined,
        music: details.audio || undefined,
        mediaUrls: uploaded.length > 1 ? uploaded : undefined,
      });
      syncAfterPublish("post", result, caption);
      triggerHaptic("success");
      Alert.alert(
        localUris.length > 1 ? "Carousel posted" : "Post shared",
        details.shareToFeed
          ? "Your post is live on profile and feed."
          : "Your post is on your profile.",
        [{ text: "OK", onPress: () => router.replace("/account") }]
      );
    } catch (e) {
      Alert.alert("Publish failed", e instanceof Error ? e.message : "Could not publish post.");
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
      <View style={styles.loading}>
        {picking ? (
          <ActivityIndicator size="large" color="#00f5ff" />
        ) : (
          <Lucide name="images-outline" size={48} color="rgba(255,255,255,0.3)" />
        )}
        <Text style={styles.loadingText}>{picking ? "Opening gallery…" : "Select photos"}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={openGallery} disabled={picking}>
          <Text style={styles.primaryBtnText}>Open gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "compose" && localUris.length > 0) {
    return (
      <NewPostDetailsForm
        mediaUris={localUris}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        username={username}
        userId={userId}
        profileId={profileId}
        catalogProducts={catalogProducts}
        publishing={publishing}
        onBack={() => {
          Alert.alert("Discard post?", "Your selected photos will be lost.", [
            { text: "Keep editing", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => router.back() },
          ]);
        }}
        onShare={handleShare}
        onEditPhoto={() => setStep("filters")}
      />
    );
  }

  if (step === "filters" && localUri) {
    return (
      <View style={styles.filterScreen}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setStep("compose")}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Edit photo</Text>
          <TouchableOpacity onPress={applyFilterAndReturn} disabled={baking}>
            {baking ? (
              <ActivityIndicator color="#00f5ff" />
            ) : (
              <Text style={styles.filterDone}>Done</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.filterPreview}>
          <FilterBakeCanvas imageUri={localUri} filterId={filterId} canvasRef={canvasRef} />
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
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#080415",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12, fontSize: 14, marginBottom: 20 },
  primaryBtn: { backgroundColor: "#4a90d9", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  filterScreen: { flex: 1, backgroundColor: "#080415", paddingTop: 48 },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  filterDone: { color: "#00f5ff", fontSize: 16, fontWeight: "700" },
  filterPreview: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  filterRow: { maxHeight: 48, paddingHorizontal: 12, marginBottom: 24 },
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
});
