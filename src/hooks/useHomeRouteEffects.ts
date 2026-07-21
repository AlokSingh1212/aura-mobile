import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

type HomeFeedTab = "grid" | "reels" | "live" | "posts";

type RouteParams = {
  openDMs?: string;
  openInbox?: string;
  openSearch?: string;
  activeTab?: string;
  openCamera?: string;
  conversationId?: string;
};

type UseHomeRouteEffectsOptions = {
  params: RouteParams;
  activeProfile?: any;
  fetchNotifications: (profileId: string) => void;
  setShowActivityDrawer: (show: boolean) => void;
  setShowExploreGrid: (show: boolean) => void;
  setActiveFeedTab: (tab: HomeFeedTab) => void;
  setIsReelsFullScreen: (full: boolean) => void;
  setShowReelCamera: (show: boolean) => void;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useHomeRouteEffects({
  params,
  activeProfile,
  fetchNotifications,
  setShowActivityDrawer,
  setShowExploreGrid,
  setActiveFeedTab,
  setIsReelsFullScreen,
  setShowReelCamera,
  triggerHaptic,
}: UseHomeRouteEffectsOptions) {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      if (!data?.type) return;

      triggerHaptic("medium");

      switch (data.type) {
        case "FOLLOW":
          if (data.followerId) {
            router.push(`/profile/${data.followerId}`);
          }
          break;
        case "BRAND_DEAL":
        case "BRAND_DEAL_ACCEPTED":
        case "BRAND_DEAL_DECLINED":
        case "BRAND_DEAL_COMPLETED":
          router.push("/sponsorships" as any);
          break;
        case "LIKE":
        case "COMMENT":
          if (activeProfile?.id) {
            fetchNotifications(activeProfile.id);
          }
          setShowActivityDrawer(true);
          break;
        case "COLLAB_INVITE":
          if (activeProfile?.id) {
            fetchNotifications(activeProfile.id);
          }
          setShowActivityDrawer(true);
          break;
        case "COLLAB_ACCEPTED":
        case "COLLAB_POST":
          if (data.postId) {
            router.push(`/post/${data.postId}` as any);
          }
          break;
        case "MESSAGE":
          if (data.conversationId) {
            router.push({
              pathname: "/messages",
              params: { conversationId: data.conversationId },
            } as any);
          } else {
            router.push("/messages" as any);
          }
          break;
        default:
          break;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeProfile, fetchNotifications, setShowActivityDrawer, triggerHaptic]);

  useEffect(() => {
    let changed = false;
    const cleanParams: Record<string, string | undefined> = {};

    if (
      params?.openDMs === "true" ||
      params?.openInbox === "true" ||
      params?.openInbox === "1"
    ) {
      router.replace("/messages" as any);
      return;
    }
    if (params?.conversationId) {
      router.replace({
        pathname: "/messages",
        params: { conversationId: params.conversationId },
      } as any);
      return;
    }
    if (params?.openSearch === "true") {
      setShowExploreGrid(true);
      cleanParams.openSearch = undefined;
      changed = true;
    }
    if (params?.activeTab === "reels") {
      setActiveFeedTab("reels");
      setIsReelsFullScreen(true);
      cleanParams.activeTab = undefined;
      changed = true;
    }
    if (params?.openCamera === "true") {
      setActiveFeedTab("reels");
      setIsReelsFullScreen(true);
      setShowReelCamera(true);
      cleanParams.openCamera = undefined;
      changed = true;
    }

    if (changed) {
      router.setParams(cleanParams as any);
    }
  }, [
    params,
    setActiveFeedTab,
    setIsReelsFullScreen,
    setShowExploreGrid,
    setShowReelCamera,
  ]);
}
