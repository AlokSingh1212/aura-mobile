import { useCallback } from "react";

type UseHomeCategoryFeedOptions = {
  setSelectedCategory: (category: string) => void;
  fetchFeedItems: (category?: string, tab?: "For You" | "Following", reset?: boolean) => void | Promise<void>;
};

export function useHomeCategoryFeed({ setSelectedCategory, fetchFeedItems }: UseHomeCategoryFeedOptions) {
  const handleCategorySelect = useCallback(
    (chip: string) => {
      setSelectedCategory(chip);
      if (chip === "For You") {
        fetchFeedItems("", "For You", true);
      } else if (chip === "Following") {
        fetchFeedItems("", "Following", true);
      } else {
        fetchFeedItems(chip, "For You", true);
      }
    },
    [fetchFeedItems, setSelectedCategory]
  );

  return { handleCategorySelect };
}
