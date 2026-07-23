import { useState } from "react";
import { Alert, Platform, InteractionManager } from "react-native";
import { useStore } from "@/store/useStore";
import { uploadMediaFromUri } from "@/lib/uploadMedia";
import { pickMediaFromLibrary, type MediaPickMode } from "@/lib/createMediaPicker";
import * as ImageManipulator from "expo-image-manipulator";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { resolveMaisonId } from "@/lib/sessionIdentity";
import { synthesizeProductFromPrompt } from "@/lib/aiProduct";
import { uploadAndPublish } from "@/lib/publishContent";
import { router } from "expo-router";

type UseProfileMediaOptions = {
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  addInstaStorySlide: (slide: any) => void;
  loadUserStories: (userId: string) => void;
  loadProfilePosts: () => Promise<void>;
  createProduct: (payload: any) => Promise<any>;
  fetchProducts: () => void;
  patchActiveProfile: (patch: any) => void;
  applyProfilePayload: (p: any) => void;
  mediaUploadInFlight: React.MutableRefObject<boolean>;
  setIsUploadingMedia: (v: boolean) => void;
  setPresetPosts: React.Dispatch<React.SetStateAction<any[]>>;
  setPostsCount: React.Dispatch<React.SetStateAction<number>>;
  setLogo: (v: string | null) => void;
  setEditLogo: (v: string | null) => void;
  username: string;
  profileName: string;
  category: string;
  bioText: string;
  websiteLink: string;
  logo: string | null;
  tags: string[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  setShowPostModal: (v: boolean) => void;
  setShowAIModal: (v: boolean) => void;
};

export function useProfileMedia({
  currentUser,
  activeProfile,
  triggerHaptic,
  addInstaStorySlide,
  loadUserStories,
  loadProfilePosts,
  createProduct,
  fetchProducts,
  patchActiveProfile,
  applyProfilePayload,
  mediaUploadInFlight,
  setIsUploadingMedia,
  setPresetPosts,
  setPostsCount,
  setLogo,
  setEditLogo,
  username,
  profileName,
  category,
  bioText,
  websiteLink,
  logo,
  tags,
  postsCount,
  followersCount,
  followingCount,
  setShowPostModal,
  setShowAIModal,
}: UseProfileMediaOptions) {
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);

  // Post form states
  const [postTitle, setPostTitle] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postImage, setPostImage] = useState("https://auragram.com/logo.png");
  const [postVibe, setPostVibe] = useState("Quiet Luxury");
  const [isPublishingStoryAndPost, setIsPublishingStoryAndPost] = useState(false);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState("");
  const [generatedProduct, setGeneratedProduct] = useState<any>(null);
  const [aiTitle, setAiTitle] = useState("");
  const [aiPrice, setAiPrice] = useState("");


  const buildProfileSaveBody = (overrides: Record<string, unknown> = {}) => {
    const maisonKey = resolveMaisonId(activeProfile, currentUser, username);
    return {
      userId: currentUser?.id,
      profileId: activeProfile?.id,
      maisonId: maisonKey,
      profileName,
      category,
      bioText,
      websiteLink,
      logo,
      tags,
      postsCount,
      followersCount,
      followingCount,
      ...overrides,
    };
  };

  const addLookToGrid = (url: string, isVideo = false) => {
    const newPost = {
      id: `post_${Date.now()}`,
      url,
      isVideo,
    };
    setPresetPosts((prev) => [newPost, ...prev]);
    setPostsCount((prev) => prev + 1);
  };

  const publishStoryWithUrl = async (
    publicUrl: string,
    storyOnly: boolean,
    customCaption?: string,
    isVideo = false
  ) => {
    const storyCaption =
      customCaption ||
      `✨ ${activeProfile?.name || profileName || "Your"} Design Story uploaded dynamically!`;

    const res = await fetch(`${API_HOST}/api/mobile/feed`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        userId: currentUser!.id,
        profileId: activeProfile?.id || null,
        url: publicUrl,
        thumbnail: publicUrl,
        caption: storyCaption,
        location: "Atelier Flagship",
        music: storyOnly ? "STORY_ONLY" : isVideo ? "AURA Original Sound" : "Cinematic Luxury Waves",
        type: storyOnly ? "STORY" : isVideo ? "CREATOR_COMMERCE" : "CREATOR_POST",
      }),
    });
    const data = await res.json();
    if (res.status === 401) {
      throw new Error(data.message || "Session expired. Please sign in again.");
    }
    if (!data.success) {
      throw new Error(data.error || "Could not save story to the server.");
    }

    if (storyOnly) {
      addInstaStorySlide({
        id: `story_${Date.now()}`,
        url: publicUrl,
        caption: storyCaption,
        isVideo,
      });
    } else if (!storyOnly) {
      addLookToGrid(publicUrl, isVideo);
    }

    useStore.getState().fetchFeed(true);
    useStore.getState().fetchFeedItems("", "For You", true);
    loadProfilePosts();
    if (currentUser?.id) {
      await loadUserStories(currentUser.id);
    }
  };

  const handlePublishReel = async (localUri: string) => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }
    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(localUri, "reel");
      await publishStoryWithUrl(publicUrl, false, "New reel", true);
      Alert.alert("Reel published", "Your reel is live on your profile and feed.");
    } catch (e) {
      console.warn("Could not publish reel.", e);
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your reel."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  const handleAddStory = async (url: string, storyOnly: boolean = false, customCaption?: string) => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }

    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(url, "story");
      const isVideo = /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(publicUrl);
      await publishStoryWithUrl(publicUrl, storyOnly, customCaption, isVideo);
      Alert.alert(
        storyOnly ? "Story published" : "Story + post published",
        storyOnly
          ? "Your story is live. Tap your profile photo to view it."
          : "Your story and feed post are live."
      );
    } catch (e) {
      console.warn("Could not save story to database.", e);
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your story."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  const handleUpdateLogo = async (url: string) => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }

    mediaUploadInFlight.current = true;
    setLogo(url);
    setEditLogo(url);
    setIsUploadingMedia(true);
    try {
      const publicUrl = await uploadMediaFromUri(url, "avatar");
      setLogo(publicUrl);
      setEditLogo(publicUrl);
      patchActiveProfile({ logo: publicUrl });

      const res = await fetch(`${API_HOST}/api/mobile/profile`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(buildProfileSaveBody({ logo: publicUrl })),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        applyProfilePayload(data.profile);
        Alert.alert("Photo updated", "Profile photo saved. It will show on your tab bar too.");
      } else {
        Alert.alert("Update failed", data.message || data.error || "Could not save photo.");
      }
    } catch (e) {
      console.warn("Failed to synchronize avatar update.", e);
      Alert.alert(
        "Update failed",
        e instanceof Error ? e.message : "Could not upload your photo."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };


  const compressAndTranscodeImage = async (uri: string, mode: "story" | "avatar") => {
    const actions =
      mode === "story" ? [{ resize: { width: 1080 } as const }] : [{ resize: { width: 320 } as const }];
    try {
      const manipulateResult = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: mode === "story" ? 0.72 : 0.62,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return manipulateResult.uri;
    } catch (e) {
      console.warn("Primary compression failed, retrying copy to cache.", e);
      try {
        const fallback = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        return fallback.uri;
      } catch (e2) {
        console.warn("Image compression failed completely.", e2);
        throw new Error("Could not process the selected photo.");
      }
    }
  };


  const handleLaunchMediaPicker = async (mode: MediaPickMode) => {
    triggerHaptic("medium");
    if ((mode as string) === "remove_avatar") {
      setLogo(null);
      setEditLogo(null);
      patchActiveProfile({ logo: null });
      return;
    }
    setIsOpeningPicker(true);
    try {
      const asset = await pickMediaFromLibrary(mode);
      if (!asset?.uri) return;

      const selectedUri = asset.uri;
      triggerHaptic("success");

      if (mode === "reel") {
        await handlePublishReel(selectedUri);
        return;
      }

      let compressedUri: string;
      try {
        compressedUri = await compressAndTranscodeImage(
          selectedUri,
          mode === "avatar" ? "avatar" : "story"
        );
      } catch (compressError) {
        Alert.alert(
          "Photo error",
          compressError instanceof Error
            ? compressError.message
            : "Could not process the selected photo."
        );
        return;
      }

      if (mode === "post") {
        setPostImage(compressedUri);
        setIsPublishingStoryAndPost(false);
        setPostTitle("");
        setPostPrice("");
        setPostDescription("");
        setShowPostModal(true);
        return;
      }

      if (mode === "story") {
        const showPublishChoice = () => {
          Alert.alert(
            "Publishing Destination",
            "Publish as story only, or story + grid post?",
            [
              {
                text: "Story Only",
                onPress: async () => {
                  triggerHaptic("medium");
                  await handleAddStory(compressedUri, true);
                },
              },
              {
                text: "Both (Story + Post)",
                onPress: () => {
                  triggerHaptic("medium");
                  setPostImage(compressedUri);
                  setIsPublishingStoryAndPost(true);
                  setPostTitle("");
                  setPostPrice("");
                  setPostDescription("");
                  setShowPostModal(true);
                },
              },
              { text: "Cancel", style: "cancel" },
            ]
          );
        };

        if (Platform.OS === "ios") {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(showPublishChoice, 300);
          });
        } else {
          showPublishChoice();
        }
        return;
      }

      await handleUpdateLogo(compressedUri);
    } finally {
      setIsOpeningPicker(false);
    }
  };

  // 📸 Product/Post publishing handler
  const handlePublishPost = async () => {
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }
    if (!useStore.getState().authToken) {
      Alert.alert("Session expired", "Please sign out and sign in again to publish.");
      return;
    }
    if (!postImage?.trim()) {
      Alert.alert("Missing photo", "Choose a photo before publishing.");
      return;
    }

    // 👥 PERSONAL PROFILE — validate caption before upload
    if (category === "Personal Profile" && !postTitle.trim()) {
      Alert.alert("Missing Caption", "Please enter a caption for your look.");
      return;
    }

    setIsUploadingMedia(true);
    mediaUploadInFlight.current = true;
    try {
      const publicUrl = await uploadMediaFromUri(postImage, "post");

      if (category === "Personal Profile") {
        triggerHaptic("success");
        const wasStoryAndPost = isPublishingStoryAndPost;
        const isVideo = /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(publicUrl);
        if (wasStoryAndPost) {
          await publishStoryWithUrl(publicUrl, true, postTitle, isVideo);
          await publishStoryWithUrl(publicUrl, false, postTitle, isVideo);
          setIsPublishingStoryAndPost(false);
        } else {
          await publishStoryWithUrl(publicUrl, false, postTitle, isVideo);
        }

        Alert.alert(
          "Look posted",
          wasStoryAndPost
            ? "Your story and grid post are live."
            : "Your look is on your profile grid and feed."
        );

        setPostTitle("");
        setShowPostModal(false);
        return;
      }

      // 🏛️ BUSINESS / BRAND MAISON PRODUCT PUBLISHING LOGIC
      if (!postTitle.trim() || !postPrice.trim()) {
        Alert.alert("Missing Parameters", "Please enter title and price for curating your AURA artifact.");
        return;
      }
      triggerHaptic("success");
      const parsedPrice = parseFloat(postPrice) || 0;

      const newProduct = {
        id: `p_${Date.now()}`,
        title: postTitle.trim(),
        price: parsedPrice,
        vibe: postVibe,
        images: [publicUrl],
        description: postDescription.trim() || "Dynamic high-fidelity physical design artifact.",
        maisonId: username,
        maison: { id: username, name: profileName },
        auraScore: 9.8,
        rating: 5.0,
        createdAt: new Date().toISOString(),
      };

      await createProduct({
        title: postTitle.trim(),
        price: parsedPrice,
        vibe: postVibe,
        images: [publicUrl],
        description: postDescription.trim(),
        maisonId: username,
      });

      useStore.setState((state) => ({ products: [newProduct, ...state.products] }));
      setPostsCount((prev) => prev + 1);

      if (isPublishingStoryAndPost) {
        await publishStoryWithUrl(
          publicUrl,
          false,
          `${postTitle} - ₹${parsedPrice.toLocaleString()}`
        );
        setIsPublishingStoryAndPost(false);
      }

      Alert.alert("Artifact curated", "Your product is saved and visible in your catalog.");

      setPostTitle("");
      setPostPrice("");
      setPostDescription("");
      setShowPostModal(false);
    } catch (e) {
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or publish your post."
      );
    } finally {
      mediaUploadInFlight.current = false;
      setIsUploadingMedia(false);
    }
  };

  // 🌌 AI generative product pipeline (real API)
  const handleStartAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Design Intent Missing", "Type a prompt describing your fashion blueprint.");
      return;
    }

    triggerHaptic("medium");
    setAiGenerating(true);
    setAiProgress(10);
    setAiStep("Connecting to AURA synthesis engine…");
    setGeneratedProduct(null);

    try {
      setAiProgress(40);
      setAiStep("Generating product blueprint and render…");
      const product = await synthesizeProductFromPrompt(aiPrompt.trim());
      setAiProgress(100);
      setAiStep("Synthesis complete!");
      triggerHaptic("success");
      setGeneratedProduct({
        title: product.title,
        price: product.price,
        image: product.imageUrl,
        vibe: product.vibe,
        description: product.description,
      });
      setAiTitle(product.title);
      setAiPrice(String(product.price));
    } catch (e) {
      Alert.alert(
        "Synthesis failed",
        e instanceof Error ? e.message : "Could not generate product."
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleMintGeneratedProduct = async () => {
    if (!generatedProduct || !aiTitle.trim() || !aiPrice.trim()) return;
    if (!currentUser?.id) {
      Alert.alert("Not signed in", "Sign in to continue.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/(auth)" as any) }
      ]);
      return;
    }

    triggerHaptic("success");
    setAiGenerating(true);
    setAiStep("Saving to catalog…");

    const parsedPrice = parseFloat(aiPrice) || generatedProduct.price || 125000;

    try {
      const res = await fetch(`${API_HOST}/api/mobile/products/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          maisonId: username,
          userId: currentUser.id,
          title: aiTitle.trim(),
          price: parsedPrice,
          vibe: generatedProduct.vibe || "Quiet Luxury",
          type: "Fashion",
          images: [generatedProduct.image],
          videoUrl: "",
        }),
      });
      const data = await res.json();

      if (!data.success || !data.artifact) {
        throw new Error(data.error || "Could not save product.");
      }

      const artifact = data.artifact;
      const newProduct = {
        id: artifact.id,
        title: aiTitle.trim(),
        price: parsedPrice,
        vibe: generatedProduct.vibe,
        images: [generatedProduct.image],
        description: generatedProduct.description,
        maisonId: username,
        maison: { id: username, name: profileName },
        auraScore: 9.5,
        rating: 5.0,
        createdAt: new Date().toISOString(),
      };

      useStore.setState((state) => ({ products: [newProduct, ...state.products] }));
      fetchProducts();

      await uploadAndPublish(generatedProduct.image, "post", {
        userId: currentUser.id,
        profileId: activeProfile?.id ?? null,
        profileName,
        caption: `${aiTitle.trim()} · AI curated on AURA`,
        productId: artifact.id,
      });

      Alert.alert(
        "Product live",
        `'${aiTitle.trim()}' is in your shop and posted to your grid.`
      );

      setAiPrompt("");
      setGeneratedProduct(null);
      setShowAIModal(false);
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof Error ? e.message : "Could not save AI product."
      );
    } finally {
      setAiGenerating(false);
      setAiStep("");
    }
  };

  return {
    postTitle,
    setPostTitle,
    postPrice,
    setPostPrice,
    postDescription,
    setPostDescription,
    postImage,
    setPostImage,
    postVibe,
    setPostVibe,
    isPublishingStoryAndPost,
    setIsPublishingStoryAndPost,
    aiPrompt,
    setAiPrompt,
    aiProgress,
    setAiProgress,
    aiGenerating,
    setAiGenerating,
    aiStep,
    setAiStep,
    generatedProduct,
    setGeneratedProduct,
    aiTitle,
    setAiTitle,
    aiPrice,
    setAiPrice,
    isOpeningPicker,
    buildProfileSaveBody,
    handleLaunchMediaPicker,
    handlePublishPost,
    handleStartAIGeneration,
    handleMintGeneratedProduct,
  };
}
