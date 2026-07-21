import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { compressImageForPost } from "@/lib/compressMedia";
import { uploadAndPublish, uploadCarouselImages } from "@/lib/publishContent";
import { resetExportJob } from "@/lib/exportJob";
import { useCreateAuth, syncAfterPublish } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import {
  NewPostDetailsForm,
  type NewPostDetails,
} from "@/components/create/NewPostDetailsForm";
import { PostGalleryStep } from "@/components/create/PostGalleryStep";
import { PostEditStep } from "@/components/create/PostEditStep";
import { buildPostPublishExtras } from "@/lib/postPublishPayload";
import { uploadStoryStickerAssets } from "@/lib/uploadStoryStickers";
import { defaultPostEditState, type PostEditState } from "@/lib/postEditState";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";

type Step = "gallery" | "edit" | "details";

export default function PostComposerScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const { triggerHaptic, activeProfile, userProfiles } = useStore();
  const username = activeProfile?.username || "you";

  const [step, setStep] = useState<Step>("gallery");
  const [localUris, setLocalUris] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editState, setEditState] = useState<PostEditState>(defaultPostEditState());
  const [publishing, setPublishing] = useState(false);

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

  const buildCaption = (details: NewPostDetails) => {
    let text = details.caption.trim();
    if (details.aiLabel && !text.toLowerCase().includes("#ai")) {
      text = `${text}\n\n#AI`.trim();
    }
    return text;
  };

  const handleGalleryNext = async (uris: string[]) => {
    setPublishing(true);
    try {
      const compressed: string[] = [];
      for (const uri of uris) {
        compressed.push(await compressImageForPost(uri));
      }
      setLocalUris(compressed);
      setActiveIndex(0);
      setEditState(defaultPostEditState());
      setStep("edit");
      triggerHaptic("success");
    } catch (e) {
      Alert.alert("Photo error", e instanceof Error ? e.message : "Could not process photos.");
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async (details: NewPostDetails) => {
    if (!localUris.length) return;
    if (!useStore.getState().authToken) {
      Alert.alert("Session expired", "Please sign out and sign in again to publish.");
      return;
    }

    const caption = buildCaption(details) || `✨ ${profileName || "Your"} on AURA`;
    const productFromEdit = editState.productStickers[0];

    setPublishing(true);
    resetExportJob();
    try {
      triggerHaptic("medium");
      const uploadedStickers = await uploadStoryStickerAssets(editState.stickerLayers);
      const editWithUploaded = { ...editState, stickerLayers: uploadedStickers };
      const extras = buildPostPublishExtras(editWithUploaded);
      const mergedPhotoTags = [
        ...extras.photoTags,
        ...details.photoTags.filter(
          (t) => !extras.photoTags.some((p) => p.profileId === t.profileId)
        ),
      ];

      const uploaded = await uploadCarouselImages(localUris);
      const result = await uploadAndPublish(uploaded[0], "post", {
        userId,
        profileId,
        profileName,
        caption,
        productId: details.productId || productFromEdit?.productId || extras.productStickers[0]?.productId || null,
        location: details.verifiedLocation?.label || extras.location,
        latitude: details.verifiedLocation?.lat ?? extras.latitude,
        longitude: details.verifiedLocation?.lon ?? extras.longitude,
        aiLabel: details.aiLabel,
        photoTags: mergedPhotoTags,
        collabs: details.collabPartners,
        productStickers: extras.productStickers,
        music: editState.audioLabel || details.audio || extras.musicTrack?.title || undefined,
        musicTrack: extras.musicTrack,
        storyLayers: extras.storyLayers,
        partnership: extras.partnership.paidPartnershipLabel || extras.partnership.partnershipAdCode
          ? {
              paidLabel: extras.partnership.paidPartnershipLabel,
              adCodeEnabled: extras.partnership.partnershipAdCode,
              adCode: extras.partnership.partnershipAdCodeValue,
            }
          : null,
        filterId: editState.filterId !== "normal" ? editState.filterId : undefined,
        mediaUrls: uploaded.length > 1 ? uploaded : undefined,
      });
      syncAfterPublish("post", result, caption);
      triggerHaptic("success");
      Alert.alert("Post shared", "Your post is live.", [
        { text: "OK", onPress: () => router.replace("/account") },
      ]);
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
        <ActivityIndicator size="large" color="#0095f6" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (step === "gallery") {
    return (
      <>
        <PostGalleryStep
          onClose={() => router.back()}
          onNext={handleGalleryNext}
        />
        {publishing ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator size="large" color="#0095f6" />
          </View>
        ) : null}
      </>
    );
  }

  if (step === "edit" && localUris.length > 0) {
    return (
      <PostEditStep
        mediaUris={localUris}
        activeIndex={activeIndex}
        editState={editState}
        brandStores={brandStores}
        userId={userId}
        profileId={profileId}
        profileAvatar={activeProfile?.logo}
        profileUsername={activeProfile?.username}
        onBack={() => setStep("gallery")}
        onNext={() => setStep("details")}
        onEditChange={setEditState}
        onActiveIndexChange={setActiveIndex}
      />
    );
  }

  if (step === "details" && localUris.length > 0) {
    return (
      <NewPostDetailsForm
        mediaUris={localUris}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        username={username}
        brandStores={brandStores}
        defaultStoreId={activeProfile?.type === "BUSINESS" ? activeProfile.id : null}
        publishing={publishing}
        editState={editState}
        initialAudio={editState.audioLabel}
        initialProductId={editState.productStickers[0]?.productId}
        initialProductTitle={editState.productStickers[0]?.title}
        onBack={() => setStep("edit")}
        onShare={handleShare}
      />
    );
  }

  return (
    <View style={styles.loading}>
      <Lucide name="images-outline" size={48} color="rgba(255,255,255,0.3)" />
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep("gallery")}>
        <Text style={styles.primaryBtnText}>Select photos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 12, fontSize: 14 },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#0095f6",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
