import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  archiveItem,
  blockUser,
  hidePost,
  invalidateSocialGraphCache,
  loadSocialGraph,
  muteUser,
  type ArchivedItem,
  type SocialGraph,
  type SocialUser,
} from "@/lib/socialGraph";

export function useSocialGraph() {
  const [graph, setGraph] = useState<SocialGraph | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const g = await loadSocialGraph();
    setGraph(g);
    return g;
  }, []);

  const refresh = useCallback(async () => {
    invalidateSocialGraphCache();
    const g = await reload();
    setVersion((v) => v + 1);
    return g;
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const blockAccount = useCallback(
    async (user: Omit<SocialUser, "addedAt">) => {
      await blockUser(user);
      return refresh();
    },
    [refresh]
  );

  const muteAccount = useCallback(
    async (user: Omit<SocialUser, "addedAt">) => {
      await muteUser(user);
      return refresh();
    },
    [refresh]
  );

  const hideFeedPost = useCallback(
    async (postId: string) => {
      await hidePost(postId);
      return refresh();
    },
    [refresh]
  );

  const archiveFeedPost = useCallback(
    async (item: Omit<ArchivedItem, "archivedAt">) => {
      await archiveItem(item);
      return refresh();
    },
    [refresh]
  );

  return {
    graph,
    version,
    refresh,
    blockAccount,
    muteAccount,
    hideFeedPost,
    archiveFeedPost,
  };
}
