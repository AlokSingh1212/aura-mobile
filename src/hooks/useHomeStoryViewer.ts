import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { getProfileDisplayName } from "@/lib/sessionIdentity";
import { sendStoryReplyDm } from "@/lib/settingsRuntime";
import {
  fetchAddYoursForStory,
  fetchStoryTemplateDetail,
  type AddYoursMeta,
  type StoryTemplateDetail,
} from "@/lib/storyTemplateApi";

type UseHomeStoryViewerOptions = {
  activeInstaStories: any[];
  currentUser: any;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeStoryViewer({
  activeInstaStories,
  currentUser,
  activeProfile,
  triggerHaptic,
}: UseHomeStoryViewerOptions) {
  const [selectedStoriesGroup, setSelectedStoriesGroup] = useState<any>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [storyPaused, setStoryPaused] = useState(false);
  const [activeSlideAddYours, setActiveSlideAddYours] = useState<AddYoursMeta | null>(null);
  const [showStoryTemplateSheet, setShowStoryTemplateSheet] = useState(false);
  const [storyTemplateDetail, setStoryTemplateDetail] = useState<StoryTemplateDetail | null>(null);
  const [storyTemplateLoading, setStoryTemplateLoading] = useState(false);

  const handleStoryNext = useCallback(() => {
    if (!selectedStoriesGroup) return;
    const slidesCount = selectedStoriesGroup.slides?.length || 0;
    if (activeSlideIndex < slidesCount - 1) {
      setActiveSlideIndex((prev) => prev + 1);
      setStoryProgress(0);
    } else {
      const currentIdx = activeInstaStories.findIndex((s) => s.id === selectedStoriesGroup.id);
      if (currentIdx !== -1 && currentIdx < activeInstaStories.length - 1) {
        setSelectedStoriesGroup(activeInstaStories[currentIdx + 1]);
        setActiveSlideIndex(0);
        setStoryProgress(0);
      } else {
        setSelectedStoriesGroup(null);
      }
    }
  }, [activeInstaStories, activeSlideIndex, selectedStoriesGroup]);

  const handleStoryPrev = useCallback(() => {
    if (!selectedStoriesGroup) return;
    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
      setStoryProgress(0);
      return;
    }
    const currentIdx = activeInstaStories.findIndex((s) => s.id === selectedStoriesGroup.id);
    if (currentIdx > 0) {
      setSelectedStoriesGroup(activeInstaStories[currentIdx - 1]);
      setActiveSlideIndex(0);
      setStoryProgress(0);
    } else {
      setStoryProgress(0);
    }
  }, [activeInstaStories, activeSlideIndex, selectedStoriesGroup]);

  const handleStoryNextRef = useRef(handleStoryNext);
  handleStoryNextRef.current = handleStoryNext;

  useEffect(() => {
    let storyTimer: ReturnType<typeof setInterval> | undefined;
    if (selectedStoriesGroup && !storyPaused) {
      storyTimer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            handleStoryNextRef.current();
            return 0;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => {
      if (storyTimer) clearInterval(storyTimer);
    };
  }, [selectedStoriesGroup, activeSlideIndex, storyPaused]);

  useEffect(() => {
    if (!selectedStoriesGroup) {
      setActiveSlideAddYours(null);
      setShowStoryTemplateSheet(false);
      setStoryTemplateDetail(null);
      return;
    }

    const slide = selectedStoriesGroup.slides?.[activeSlideIndex];
    if (!slide?.id) {
      setActiveSlideAddYours(null);
      return;
    }

    if (slide.addYours?.templateId) {
      setActiveSlideAddYours(slide.addYours as AddYoursMeta);
      return;
    }

    let cancelled = false;
    fetchAddYoursForStory(slide.id)
      .then((meta) => {
        if (!cancelled) setActiveSlideAddYours(meta);
      })
      .catch(() => {
        if (!cancelled) setActiveSlideAddYours(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStoriesGroup, activeSlideIndex]);

  const openStoryTemplateSheet = useCallback(async () => {
    if (!activeSlideAddYours?.templateId) return;
    setShowStoryTemplateSheet(true);
    setStoryTemplateLoading(true);
    setStoryTemplateDetail(null);
    try {
      const detail = await fetchStoryTemplateDetail(activeSlideAddYours.templateId, currentUser?.id);
      setStoryTemplateDetail(detail);
    } finally {
      setStoryTemplateLoading(false);
    }
  }, [activeSlideAddYours?.templateId, currentUser?.id]);

  const handleStoryAddYours = useCallback(() => {
    if (!activeSlideAddYours?.templateId) return;
    triggerHaptic("medium");
    setShowStoryTemplateSheet(false);
    setSelectedStoriesGroup(null);
    router.push({
      pathname: "/create/story",
      params: {
        templateId: activeSlideAddYours.templateId,
        prompt: encodeURIComponent(activeSlideAddYours.promptText || ""),
      },
    });
  }, [activeSlideAddYours, triggerHaptic]);

  const handleSendStoryReply = useCallback(async () => {
    if (!storyReplyText.trim() || !selectedStoriesGroup) return;
    triggerHaptic("medium");
    const result = await sendStoryReplyDm({
      userId: currentUser?.id || "",
      userName: getProfileDisplayName(activeProfile, currentUser),
      peerProfileId: selectedStoriesGroup.profileId || selectedStoriesGroup.id,
      message: storyReplyText.trim(),
      storyOwnerIsFollowing: selectedStoriesGroup.isFollowing === true,
    });
    if (!result.success) {
      Alert.alert("Couldn't send reply", result.error || "Try again.");
      return;
    }
    setStoryReplyText("");
    setSelectedStoriesGroup(null);
  }, [activeProfile, currentUser, selectedStoriesGroup, storyReplyText, triggerHaptic]);

  const openStoriesGroup = useCallback((story: any) => {
    setSelectedStoriesGroup(story);
    setActiveSlideIndex(0);
    setStoryProgress(0);
  }, []);

  const closeStoriesGroup = useCallback(() => {
    setSelectedStoriesGroup(null);
  }, []);

  return {
    selectedStoriesGroup,
    setSelectedStoriesGroup,
    activeSlideIndex,
    storyProgress,
    storyPaused,
    setStoryPaused,
    storyReplyText,
    setStoryReplyText,
    activeSlideAddYours,
    showStoryTemplateSheet,
    setShowStoryTemplateSheet,
    storyTemplateDetail,
    storyTemplateLoading,
    openStoriesGroup,
    closeStoriesGroup,
    handleStoryNext,
    handleStoryPrev,
    handleSendStoryReply,
    handleStoryAddYours,
    openStoryTemplateSheet,
  };
}
