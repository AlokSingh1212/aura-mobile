import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadAndPublish } from "@/lib/publishContent";
import { parseCaptionEntities } from "@/lib/postComposerTypes";
import { IS_PRODUCTION_APP } from "@/lib/apiClient";
import type { NewPostAudience } from "@/components/home/homeNewPostConstants";

type UseHomeNewPostOptions = {
  currentUser: any;
  activeProfile: any;
  fetchFeed: () => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

function scheduleFromTimeLabel(label: string): string {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(Date.now() + 3_600_000).toISOString();
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  if (d.getTime() <= Date.now() + 60_000) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

export function useHomeNewPost({
  currentUser,
  activeProfile,
  fetchFeed,
  triggerHaptic,
}: UseHomeNewPostOptions) {
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState("");
  const [newPostLocation, setNewPostLocation] = useState("");
  const [newPostAudio, setNewPostAudio] = useState("");
  const [newPostAI, setNewPostAI] = useState(false);
  const [newPostProduct, setNewPostProduct] = useState("");
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [newPostTaggedPeople, setNewPostTaggedPeople] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<NewPostAudience>("everyone");
  const [newPostShareFeed, setNewPostShareFeed] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [likesHidden, setLikesHidden] = useState(false);
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [promoteReel, setPromoteReel] = useState(false);
  const [crossPostEnabled, setCrossPostEnabled] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("06:00 PM");
  const [allowDownload, setAllowDownload] = useState(true);

  const resetNewPostDraft = useCallback(() => {
    setSelectedMediaUri(null);
    setNewPostCaption("");
    setNewPostLocation("");
    setNewPostAudio("");
    setNewPostAI(false);
    setNewPostProduct("");
  }, []);

  const resetAfterPublish = useCallback(() => {
    setSelectedMediaUri(null);
    setNewPostCaption("");
    setNewPostLocation("");
    setNewPostAudio("");
    setNewPostAI(false);
    setNewPostProduct("");
    setNewPostTaggedPeople("");
    setSelectedAudience("everyone");
    setNewPostShareFeed(true);
    setCommentsEnabled(true);
    setLikesHidden(false);
    setSharingEnabled(true);
    setPromoteReel(false);
    setCrossPostEnabled(false);
    setIsScheduled(false);
    setAllowDownload(true);
  }, []);

  const handleSelectMedia = useCallback(async () => {
    triggerHaptic("light");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "AURA Sovereign core needs gallery access to upload high-fidelity curations."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setSelectedMediaUri(uri);
        const isVideo = uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov");
        if (!isVideo) {
          setShowImageEditor(true);
        }
      } else {
        Alert.alert("No media", "Choose a photo or video to publish.");
      }
    } catch (error) {
      console.warn("Native picker issue:", error);
    }
  }, [triggerHaptic]);

  const handleSharePost = useCallback(async () => {
    if (!selectedMediaUri) return;
    if (!currentUser?.id) {
      Alert.alert("Sign in required", "Please sign in to publish posts.");
      return;
    }
    setIsPublishingPost(true);
    triggerHaptic("success");

    try {
      const lower = selectedMediaUri.toLowerCase();
      const isVideo =
        lower.endsWith(".mp4") ||
        lower.endsWith(".mov") ||
        lower.endsWith(".m4v") ||
        lower.includes("video") ||
        lower.includes(".m3u8");
      const kind = isVideo ? "reel" : "post";
      const { hashtags } = parseCaptionEntities(newPostCaption);
      const scheduledPublishAt = isScheduled ? scheduleFromTimeLabel(scheduledTime) : undefined;

      const result = await uploadAndPublish(selectedMediaUri, kind, {
        userId: currentUser.id,
        profileId: activeProfile?.id,
        profileName: activeProfile?.name || currentUser.username || "Creator",
        caption: newPostCaption || undefined,
        location: newPostLocation || undefined,
        music: newPostAudio || undefined,
        productId: newPostProduct || null,
        aiLabel: newPostAI,
        scheduledPublishAt,
        hashtags,
      });

      if (result.scheduled) {
        Alert.alert(
          "Post scheduled",
          result.scheduledPublishAt
            ? `Your post will go live ${new Date(result.scheduledPublishAt).toLocaleString()}.`
            : "Your post is scheduled and will appear in the feed soon."
        );
      } else {
        Alert.alert(
          "Syndication Success",
          "Your visual masterpiece has been syndicated to the AURA Social Mesh!"
        );
      }
      resetAfterPublish();
      fetchFeed();
    } catch (err) {
      console.error(err);
      Alert.alert(
        "Syndication Interrupted",
        err instanceof Error ? err.message : "Failed to connect to AURA database node."
      );
    } finally {
      setIsPublishingPost(false);
    }
  }, [
    activeProfile?.id,
    activeProfile?.name,
    currentUser?.id,
    currentUser?.username,
    fetchFeed,
    isScheduled,
    newPostAI,
    newPostAudio,
    newPostCaption,
    newPostLocation,
    newPostProduct,
    resetAfterPublish,
    scheduledTime,
    selectedMediaUri,
    triggerHaptic,
  ]);

  return {
    selectedMediaUri,
    setSelectedMediaUri,
    showImageEditor,
    setShowImageEditor,
    newPostCaption,
    setNewPostCaption,
    newPostLocation,
    setNewPostLocation,
    newPostAudio,
    setNewPostAudio,
    newPostAI,
    setNewPostAI,
    newPostProduct,
    setNewPostProduct,
    isPublishingPost,
    newPostTaggedPeople,
    setNewPostTaggedPeople,
    selectedAudience,
    setSelectedAudience,
    newPostShareFeed,
    setNewPostShareFeed,
    commentsEnabled,
    setCommentsEnabled,
    likesHidden,
    setLikesHidden,
    crossPostEnabled,
    setCrossPostEnabled,
    allowDownload,
    setAllowDownload,
    promoteReel,
    setPromoteReel,
    isScheduled,
    setIsScheduled,
    scheduledTime,
    setScheduledTime,
    handleSelectMedia,
    handleSharePost,
    resetNewPostDraft,
  };
}
