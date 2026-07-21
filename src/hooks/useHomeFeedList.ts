import { useMemo } from "react";
import { filterFeedItems } from "@/lib/feedSocialFilter";
import { filterContentItems } from "@/lib/settingsEnforcement";

type UseHomeFeedListOptions = {
  feedItems: any[];
  socialGraph: any;
  socialGraphVersion: number;
  activeProfileId?: string;
};

export function useHomeFeedList({
  feedItems,
  socialGraph,
  socialGraphVersion,
  activeProfileId,
}: UseHomeFeedListOptions) {
  const filteredFeedItems = useMemo(() => {
    if (!socialGraph) return filterContentItems(feedItems);
    return filterContentItems(filterFeedItems(feedItems, socialGraph, activeProfileId));
  }, [feedItems, socialGraph, socialGraphVersion, activeProfileId]);

  const listData = useMemo(() => {
    const data = [...filteredFeedItems];
    if (data.length > 1) {
      const hasAiBar = data.some((item) => item.id === "ask_aura_ai_bar");
      if (!hasAiBar) {
        data.splice(1, 0, { id: "ask_aura_ai_bar", type: "ASK_AURA_AI" });
      }
    } else if (data.length === 1) {
      const hasAiBar = data.some((item) => item.id === "ask_aura_ai_bar");
      if (!hasAiBar) {
        data.push({ id: "ask_aura_ai_bar", type: "ASK_AURA_AI" });
      }
    }
    return data;
  }, [filteredFeedItems]);

  return { filteredFeedItems, listData };
}
