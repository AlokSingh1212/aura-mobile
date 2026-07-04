import { router } from "expo-router";
import { useStore } from "@/store/useStore";
import { readPostMetadata } from "@/lib/postComposerTypes";
import { readRepostOf, resolveReshareSourceId } from "@/lib/postRepost";
import type { RepostOfRef } from "@/lib/postRepost";

export function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/\s+/g, "_")
    .replace(/['']/g, "");
}

export function openProfile(raw: string) {
  const username = normalizeUsername(raw);
  if (!username) return;

  const { activeProfile, activeMaisonId, triggerHaptic } = useStore.getState();
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
  useStore.getState().triggerHaptic?.("light");
  router.push({ pathname: "/shop", params: { search: clean } } as any);
}

export function openProduct(productId: string) {
  if (!productId) return;
  useStore.getState().triggerHaptic?.("light");
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

  return {
    photoTags: legacy.photoTags,
    collab: legacy.collab,
    collabs: legacy.collabs,
    caption: item?.caption || content.caption || "",
    repostOf,
    isRepost: !!item?.isRepost || !!content.isRepost || !!repostOf,
    reshareSourceId: resolveReshareSourceId({ id: item?.id, repostOf, content }),
    authorUsername,
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
