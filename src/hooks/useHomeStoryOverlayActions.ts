import { useCallback } from "react";
import { router } from "expo-router";

type HomeFeedTab = "grid" | "reels" | "live" | "posts";

type UseHomeStoryOverlayActionsOptions = {
  setSelectedStoriesGroup: (group: any) => void;
  setShowStoryTemplateSheet: (show: boolean) => void;
  fetchSearchResults: (query: string) => void | Promise<void>;
  setSelectedCategory: (category: string) => void;
  setActiveFeedTab: (tab: HomeFeedTab) => void;
  navigateToUserProfile: (username: string) => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeStoryOverlayActions({
  setSelectedStoriesGroup,
  setShowStoryTemplateSheet,
  fetchSearchResults,
  setSelectedCategory,
  setActiveFeedTab,
  navigateToUserProfile,
  triggerHaptic,
}: UseHomeStoryOverlayActionsOptions) {
  const onStoryOpenProfile = useCallback(
    (username: string) => {
      if (username.startsWith("#")) {
        setSelectedStoriesGroup(null);
        fetchSearchResults(username.slice(1));
        setSelectedCategory("For You");
        setActiveFeedTab("posts");
        return;
      }
      setSelectedStoriesGroup(null);
      navigateToUserProfile(username);
    },
    [
      fetchSearchResults,
      navigateToUserProfile,
      setActiveFeedTab,
      setSelectedCategory,
      setSelectedStoriesGroup,
    ]
  );

  const onStoryOpenProduct = useCallback(
    (productId: string) => {
      triggerHaptic("light");
      setSelectedStoriesGroup(null);
      router.push(`/shop/all-products?productId=${encodeURIComponent(productId)}` as any);
    },
    [setSelectedStoriesGroup, triggerHaptic]
  );

  const onTemplateParticipantPress = useCallback(
    (_profileId: string, username: string) => {
      setShowStoryTemplateSheet(false);
      setSelectedStoriesGroup(null);
      navigateToUserProfile(username);
    },
    [navigateToUserProfile, setSelectedStoriesGroup, setShowStoryTemplateSheet]
  );

  return {
    onStoryOpenProfile,
    onStoryOpenProduct,
    onTemplateParticipantPress,
  };
}
