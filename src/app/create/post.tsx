import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Lucide from "@expo/vector-icons/Ionicons";
import { pickMultipleImages } from "@/lib/createMediaPicker";
import { compressImageForPost } from "@/lib/compressMedia";
import { uploadAndPublish, uploadCarouselImages } from "@/lib/publishContent";
import { createEmptyDraft, saveDraft } from "@/lib/createDraft";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import {
  NewPostDetailsForm,
  type NewPostDetails,
} from "@/components/create/NewPostDetailsForm";
import { ImageEditor } from "@/components/ImageEditor";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import { splitPeopleTags } from "@/lib/postComposerTypes";

type Step = "pick" | "compose";

export default function PostComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const { triggerHaptic, activeProfile, userProfiles } = useStore();
  const username = activeProfile?.username || "you";

  const [step, setStep] = useState<Step>("pick");
  const [localUris, setLocalUris] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const pickerStarted = useRef(false);

  const brandStores: BrandStoreOption[] = useMemo(
    () =>
      (userProfiles || [])
        .filter((p: { type?: string }) => p.type === "BUSINESS")
        .map((p: { id: string; name: string; username: string; maisonId?: string; logo?: string | null }) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          maisonId: p.maisonId || p.username,
          logo: p.logo,
        })),
    [userProfiles]
  );

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

  const buildCaption = (details: NewPostDetails) => {
    let text = details.caption.trim();
    for (const person of details.people) {
      const mention = `@${person.username}`;
      if (!text.includes(mention)) {
        text = `${text} ${mention}`.trim();
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
    const { tags, collabs } = splitPeopleTags(details.people);

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
        location: details.verifiedLocation?.label,
        latitude: details.verifiedLocation?.lat,
        longitude: details.verifiedLocation?.lon,
        aiLabel: details.aiLabel,
        tags,
        collabs,
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

  const handleEditorSave = (finalUri: string, _appliedFilter: string) => {
    const next = [...localUris];
    next[activeIndex] = finalUri;
    setLocalUris(next);
    setEditorVisible(false);
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
      <>
        <NewPostDetailsForm
          mediaUris={localUris}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          username={username}
          brandStores={brandStores}
          defaultStoreId={activeProfile?.type === "BUSINESS" ? activeProfile.id : null}
          publishing={publishing}
          onBack={() => {
            Alert.alert("Discard post?", "Your selected photos will be lost.", [
              { text: "Keep editing", style: "cancel" },
              { text: "Discard", style: "destructive", onPress: () => router.back() },
            ]);
          }}
          onShare={handleShare}
          onEditPhoto={() => localUri && setEditorVisible(true)}
        />

        {localUri ? (
          <ImageEditor
            visible={editorVisible}
            imageUri={localUri}
            onClose={() => setEditorVisible(false)}
            onSave={handleEditorSave}
          />
        ) : null}
      </>
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
});
