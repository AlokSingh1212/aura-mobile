/**
 * Operational wiring for ecosystem settings — every helper here should affect real app behavior.
 */
import { Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as MediaLibrary from "expo-media-library";
import {
  canReplyToStory,
  canTagActor,
  canMentionActor,
  getEnforcedSettings,
  isPersonalizedAdsEnabled,
  isStoreVacationMode,
  getStoreVacationMessage,
  shouldShowFollowersList,
  shouldShowActivityStatus,
  shouldShowOnlineStatus,
  shouldShowReadReceipts,
  showShopActivity,
} from "@/lib/settingsEnforcement";
import { loadSocialGraph, type SocialGraph } from "@/lib/socialGraph";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export {
  shouldShowReadReceipts,
  shouldShowOnlineStatus,
  shouldShowActivityStatus,
  shouldShowFollowersList,
  isPersonalizedAdsEnabled,
  showShopActivity,
  canReplyToStory,
  canTagActor,
  canMentionActor,
};

/** Block cellular uploads when creator Wi‑Fi-only is enabled. */
export async function assertUploadNetworkAllowed(): Promise<void> {
  const creator = getEnforcedSettings()?.creator;
  if (!creator?.uploadOnWifiOnly) return;
  const state = await NetInfo.fetch();
  if (state.type !== "wifi") {
    throw new Error(
      "Uploads are set to Wi‑Fi only. Connect to Wi‑Fi or change this in Settings → Creator tools."
    );
  }
}

/** JPEG compression hint for image manipulator / export (0–1). */
export function getUploadCompressionQuality(): number {
  const hq = getEnforcedSettings()?.creator.highQualityUpload !== false;
  return hq ? 0.92 : 0.72;
}

/** Save local media to camera roll when creator settings allow. */
export async function savePublishedMediaToGallery(
  localUri: string,
  kind: "reel" | "photo" | "story"
): Promise<void> {
  const creator = getEnforcedSettings()?.creator;
  const shouldSave =
    kind === "reel"
      ? creator?.saveReelsToGallery
      : creator?.saveOriginalPhotos;
  if (!shouldSave) return;
  const uri = localUri?.trim();
  if (!uri || uri.startsWith("http")) return;

  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow photo library access to save media after posting.");
    return;
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}

export function canStartVideoCall(): boolean {
  return getEnforcedSettings()?.messages.allowVideoCalls !== false;
}

export function canStartAudioCall(): boolean {
  return getEnforcedSettings()?.messages.allowAudioCalls !== false;
}

export function shouldFilterMessageRequests(): boolean {
  return getEnforcedSettings()?.messages.requestFiltering === true;
}

export function getCheckoutBlockReason(): string | null {
  if (isStoreVacationMode()) {
    return getStoreVacationMessage();
  }
  return null;
}

export function getStoreProcessingDays(): number {
  return getEnforcedSettings()?.store?.processingDays ?? 2;
}

export function shouldShowLowStockAlert(stock: number): boolean {
  const store = getEnforcedSettings()?.store;
  if (!store?.lowStockAlert) return false;
  return stock <= (store.lowStockThreshold ?? 5);
}

export function getFreeShippingMinimum(): number {
  return getEnforcedSettings()?.store?.freeShippingMinOrder ?? 999;
}

export function shouldShowInventoryOnProduct(): boolean {
  return getEnforcedSettings()?.store?.showInventoryCount !== false;
}

/** Auto-apply best known coupon when shop preference enabled. */
export async function tryAutoApplyCheckoutCoupon(
  applyCoupon: (payload: { code: string; maisonId?: string }) => Promise<{ success: boolean; coupon?: any; error?: string }>,
  maisonId?: string
): Promise<{ code: string; coupon: any } | null> {
  if (!getEnforcedSettings()?.shop.autoApplyCoupons) return null;
  const candidates = ["AURA10", "WELCOME10", "FIRST15", "FLAT100"];
  for (const code of candidates) {
    try {
      const res = await applyCoupon({ code, maisonId });
      if (res.success && res.coupon) {
        return { code, coupon: res.coupon };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

export function canViewFollowersOnProfile(isOwnProfile: boolean): boolean {
  if (isOwnProfile) return true;
  return shouldShowFollowersList();
}

export function isCloseFriendProfile(profileId: string, graph?: SocialGraph | null): boolean {
  const g = graph;
  if (!g) return false;
  return g.closeFriends.some((u) => u.profileId === profileId);
}

export function isFavoriteProfile(profileId: string, graph?: SocialGraph | null): boolean {
  if (!graph) return false;
  return graph.favorites.some((u) => u.profileId === profileId);
}

/** Story visible only to close friends when author marked story as close-friends-only. */
export function canViewStorySlide(
  story: {
    closeFriendsOnly?: boolean;
    audience?: string;
    userId?: string;
    profileId?: string;
  },
  viewerProfileId: string | undefined,
  graph: SocialGraph | null | undefined,
  isOwnStory: boolean
): boolean {
  if (isOwnStory) return true;
  const closeOnly =
    story.closeFriendsOnly === true ||
    story.audience === "close_friends";
  if (!closeOnly) return true;
  if (!viewerProfileId || !graph) return false;
  return isCloseFriendProfile(story.profileId || story.userId || "", graph);
}

export async function sendStoryReplyDm(params: {
  userId: string;
  userName: string;
  peerProfileId: string;
  message: string;
  storyOwnerIsFollowing?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  if (
    !canReplyToStory({
      isFollowing: params.storyOwnerIsFollowing === true,
    })
  ) {
    return { success: false, error: "This creator does not allow story replies from you." };
  }

  try {
    const res = await fetch(`${API_HOST}/api/mobile/chat/initiate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        userId: params.userId,
        userName: params.userName,
        peerProfileId: params.peerProfileId,
        type: "PRIVATE",
        initialMessage: params.message,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      return { success: false, error: data.error || "Could not send reply." };
    }
    return { success: true };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error sending story reply.",
    };
  }
}

export function assertCanTagUser(from: { isFollowing?: boolean }, username: string): boolean {
  if (!canTagActor(from)) {
    Alert.alert("Tagging restricted", `@${username} cannot tag you based on your tag settings.`);
    return false;
  }
  return true;
}

export function assertCanMentionUser(from: { isFollowing?: boolean }, username: string): boolean {
  if (!canMentionActor(from)) {
    Alert.alert("Mention restricted", `@${username} cannot mention you based on your mention settings.`);
    return false;
  }
  return true;
}

/** Check whether the current user may tag a target profile (server + local fallback). */
export async function validateCanTagTarget(params: {
  targetProfileId: string;
  targetUsername: string;
  taggerProfileId?: string;
  taggerFollowsTarget?: boolean;
}): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const res = await fetch(`${API_HOST}/api/mobile/social/tag-permission`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        targetProfileId: params.targetProfileId,
        taggerProfileId: params.taggerProfileId,
      }),
    });
    const data = await res.json();
    if (res.ok && typeof data.allowed === "boolean") {
      return { allowed: data.allowed, reason: data.reason };
    }
  } catch {
    /* fall through */
  }
  if (params.taggerFollowsTarget === false) {
    return {
      allowed: false,
      reason: `@${params.targetUsername} only allows tags from accounts they follow.`,
    };
  }
  return { allowed: true };
}

export async function loadSocialGraphCached(): Promise<SocialGraph> {
  return loadSocialGraph();
}

/** Sync ecosystem message prefs → camera story reply audience. */
export async function syncCameraFromEcosystemSettings(): Promise<void> {
  const all = getEnforcedSettings();
  if (!all) return;
  try {
    const { loadCameraSettings, patchCameraSettings } = await import("@/lib/cameraSettings");
    const current = await loadCameraSettings();
    const replyMap = {
      everyone: "everyone",
      following: "following",
      off: "off",
    } as const;
    await patchCameraSettings({
      story: {
        ...current.story,
        allowMessageReplies: replyMap[all.messages.storyRepliesFrom] || "following",
        saveToCameraRoll: all.creator.saveReelsToGallery || all.creator.saveOriginalPhotos,
      },
      reels: {
        ...current.reels,
        saveToCameraRoll: all.creator.saveReelsToGallery,
      },
    });
  } catch {
    /* non-fatal */
  }
}
