import { router } from "expo-router";
import { normalizeUsername } from "@/lib/usernameUtils";
import { readPostMetadata } from "@/lib/postComposerTypes";
import { readRepostOf, resolveReshareSourceId } from "@/lib/postRepost";
import type { RepostOfRef } from "@/lib/postRepost";

export { normalizeUsername } from "@/lib/usernameUtils";

function getStoreState() {
  // Lazy require breaks useStore -> cloudSync -> socialGraph -> postNavigation cycle.
  const { useStore } = require("@/store/useStore") as typeof import("@/store/useStore");
  return useStore.getState();
}

export function openProfile(raw: string) {
  const username = normalizeUsername(raw);
  if (!username) return;

  const { activeProfile, activeMaisonId, triggerHaptic } = getStoreState();
  triggerHaptic?.("medium");

  const isOwn =
    activeProfile?.username?.toLowerCase() === username ||
    activeMaisonId?.toLowerCase() === username;

  if (isOwn) {
    router.push("/account");
    return;
  }
  router.push(`/profile/${username}` as any);
}

export function openHashtag(tag: string) {
  const clean = tag.replace(/^#/, "").toLowerCase().trim();
  if (!clean) return;
  getStoreState().triggerHaptic?.("light");
  router.push({ pathname: "/shop/all-products", params: { q: clean } } as any);
}

export function openProduct(productId: string) {
  if (!productId) return;
  getStoreState().triggerHaptic?.("light");
  router.push(`/product/${productId}` as any);
}

/** Normalize feed / profile post metadata from API + legacy fields. */
export function resolveFeedPostMeta(item: any) {
  const content = item?.content || {};
  const legacy = readPostMetadata({
    photoTags: item?.photoTags ?? content.photoTags,
    tags: item?.tags,
    collab: item?.collab ?? content.collab,
    collabs: item?.collabs ?? content.collabs,
  });

  const repostOf: RepostOfRef | null =
    item?.repostOf ??
    item?.content?.repostOf ??
    readRepostOf(item?.metadata) ??
    null;

  const authorUsername = normalizeUsername(
    item?.profile?.username ||
      item?.creator?.username ||
      item?.user?.username ||
      item?.user?.name ||
      item?.profile?.name ||
      item?.creator?.name ||
      "aura_curator"
  );

  const authorProfileId =
    item?.creator?.id ||
    item?.profile?.id ||
    item?.profileId ||
    item?.user?.id ||
    authorUsername;

  return {
    photoTags: legacy.photoTags,
    collab: legacy.collab,
    collabs: legacy.collabs,
    storyLayers:
      item?.storyLayers ??
      item?.content?.storyLayers ??
      (item?.metadata && typeof item.metadata === "object"
        ? (item.metadata as { storyLayers?: unknown }).storyLayers
        : undefined) ??
      [],
    caption: item?.caption || content.caption || "",
    repostOf,
    isRepost: !!item?.isRepost || !!content.isRepost || !!repostOf,
    reshareSourceId: resolveReshareSourceId({ id: item?.id, repostOf, content }),
    authorUsername,
    authorProfileId,
    authorName:
      item?.profile?.name ||
      item?.creator?.name ||
      item?.user?.name ||
      authorUsername,
    authorAvatar:
      item?.profile?.logo ||
      item?.creator?.avatar ||
      item?.user?.avatar ||
      null,
  };
}
