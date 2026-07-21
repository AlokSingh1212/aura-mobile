import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { createProfileHighlight } from "@/lib/profileApi";
import { delayAfterModalClose, type MediaPickMode } from "@/lib/createMediaPicker";

export type ProfileCreateMode = "reel" | "product" | "post" | "story" | "highlight" | "live" | "ai";

type UseProfileCreateActionsOptions = {
  routeParams: { openCreate?: string };
  authHydrated: boolean;
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  setShowLiveModal: (v: boolean) => void;
  hasActiveStory: boolean;
  setStoryViewerIndex: (v: number) => void;
  setShowStoryViewer: (v: boolean) => void;
  yourStorySlides: any[];
  displayLogo: string | null;
  setHighlights: React.Dispatch<React.SetStateAction<{ id: string; title: string; avatar: string }[]>>;
  showCustomPrompt: (title: string, desc: string, placeholder: string, onSubmit: (val: string) => void) => void;
  handleOpenAddProduct: () => void;
  handleLaunchMediaPicker: (mode: MediaPickMode) => void;
};

export function useProfileCreateActions({
  routeParams,
  authHydrated,
  currentUser,
  activeProfile,
  triggerHaptic,
  showCreateModal,
  setShowCreateModal,
  setShowLiveModal,
  hasActiveStory,
  setStoryViewerIndex,
  setShowStoryViewer,
  yourStorySlides,
  displayLogo,
  setHighlights,
  showCustomPrompt,
  handleOpenAddProduct,
  handleLaunchMediaPicker,
}: UseProfileCreateActionsOptions) {
  const pendingCreateRef = useRef<ProfileCreateMode | null>(null);
  const openCreateHandled = useRef(false);

  const handleAddHighlight = () => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Sign in required", "Sign in to create highlights.");
      return;
    }
    triggerHaptic("medium");
    showCustomPrompt(
      "New Highlight",
      "Enter title for your new highlight folder:",
      "e.g. Milan Curation",
      async (title: string) => {
        if (!title || !title.trim()) return;
        triggerHaptic("success");
        const storyIds = yourStorySlides.map((s: any) => s.id).filter(Boolean);
        const result = await createProfileHighlight({
          profileId: activeProfile.id,
          userId: currentUser.id,
          title: title.trim(),
          coverUrl: yourStorySlides[0]?.url || displayLogo || undefined,
          storyIds,
        });
        if (result.success && result.highlight) {
          setHighlights((prev) => [result.highlight!, ...prev]);
        } else {
          Alert.alert("Could not create highlight", result.error || "Try again.");
        }
      }
    );
  };

  const executeCreateAction = (mode: ProfileCreateMode) => {
    switch (mode) {
      case "reel":
        router.push("/create/reel");
        break;
      case "post":
        router.push("/create/post");
        break;
      case "story":
        router.push("/create/story");
        break;
      case "product":
        handleOpenAddProduct();
        break;
      case "highlight":
        handleAddHighlight();
        break;
      case "live":
        setShowLiveModal(true);
        break;
      case "ai":
        router.push("/create/ai");
        break;
      default:
        break;
    }
  };

  const queueCreateAction = (mode: ProfileCreateMode) => {
    triggerHaptic("medium");
    if (showCreateModal) {
      pendingCreateRef.current = mode;
      setShowCreateModal(false);
      return;
    }
    setTimeout(() => executeCreateAction(mode), delayAfterModalClose());
  };

  useEffect(() => {
    if (showCreateModal) return;
    const mode = pendingCreateRef.current;
    if (!mode) return;
    pendingCreateRef.current = null;
    const timer = setTimeout(() => executeCreateAction(mode), delayAfterModalClose());
    return () => clearTimeout(timer);
  }, [showCreateModal]);

  useEffect(() => {
    const mode = routeParams.openCreate;
    if (!mode || !authHydrated || !currentUser?.id || openCreateHandled.current) return;
    openCreateHandled.current = true;
    if (mode === "post" || mode === "story") {
      router.push(`/create/${mode}` as "/create/post");
    } else if (mode === "reel") {
      router.push("/create/reel");
    } else {
      queueCreateAction(mode as ProfileCreateMode);
    }
  }, [routeParams.openCreate, authHydrated, currentUser?.id]);

  const handleAvatarPress = () => {
    triggerHaptic("medium");
    Alert.alert("Profile photo & stories", "What do you want to do?", [
      {
        text: "Change profile photo",
        onPress: () => handleLaunchMediaPicker("avatar"),
      },
      {
        text: "Add story from gallery",
        onPress: () => router.push("/create/story"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleProfileAvatarTap = () => {
    if (hasActiveStory) {
      triggerHaptic("light");
      setStoryViewerIndex(0);
      setShowStoryViewer(true);
    } else {
      handleAvatarPress();
    }
  };

  return {
    queueCreateAction,
    handleAddHighlight,
    handleAvatarPress,
    handleProfileAvatarTap,
  };
}
