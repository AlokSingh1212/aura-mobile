import { normalizeUsername } from "@/lib/postNavigation";
import type { ProfilePost } from "@/lib/profileApi";
import type { SocialGraph, SocialUser } from "@/lib/socialGraph";
import {
  isPostArchived,
  isPostHidden,
  isUserBlocked,
  isUserMuted,
} from "@/lib/socialGraph";

export function resolveAuthorProfileId(item: any): string {
  return (
    item?.creator?.id ||
    item?.profile?.id ||
    item?.profileId ||
    item?.user?.id ||
    normalizeUsername(
      item?.creator?.username ||
        item?.profile?.username ||
        item?.user?.username ||
        item?.user?.name ||
        ""
    )
  );
}

export function resolveAuthorFromItem(item: any): Omit<SocialUser, "addedAt"> {
  const profileId = resolveAuthorProfileId(item);
  const username = normalizeUsername(
    item?.creator?.username ||
      item?.profile?.username ||
      item?.user?.username ||
      item?.user?.name ||
      profileId
  );
  const name =
    item?.creator?.name ||
    item?.profile?.name ||
    item?.user?.name ||
    username;
  const avatar =
    item?.creator?.avatar ||
    item?.profile?.logo ||
    item?.user?.avatar ||
    null;
  return { profileId, username, name, avatar };
}

function isSpecialFeedItem(item: any): boolean {
  return (
    item?.type === "ASK_AURA_AI" ||
    item?.isAd === true ||
    item?.type === "SPONSORED_AD" ||
    item?.type === "AURA_SUITE_AD"
  );
}

export function shouldShowFeedItem(
  item: any,
  graph: SocialGraph,
  ownProfileId?: string | null
): boolean {
  if (isSpecialFeedItem(item)) return true;

  const postId = item?.id;
  if (postId && isPostHidden(postId, graph)) return false;

  const authorId = resolveAuthorProfileId(item);
  const authorUsername = normalizeUsername(
    item?.creator?.username ||
      item?.profile?.username ||
      item?.user?.username ||
      item?.user?.name ||
      ""
  );
  if (authorId) {
    if (isUserBlocked(authorId, graph, authorUsername)) return false;
    if (isUserMuted(authorId, graph, authorUsername)) return false;
  }

  if (ownProfileId && authorId === ownProfileId && postId) {
    const archiveType = item?.type === "CREATOR_COMMERCE" || item?.content?.videoUrl ? "reel" : "post";
    if (isPostArchived(postId, graph, archiveType)) return false;
  }

  return true;
}

export function filterFeedItems(
  items: any[],
  graph: SocialGraph,
  ownProfileId?: string | null
): any[] {
  return items.filter((item) => shouldShowFeedItem(item, graph, ownProfileId));
}

export function filterProfilePosts(
  posts: ProfilePost[],
  graph: SocialGraph,
  isOwnProfile?: boolean
): ProfilePost[] {
  if (!isOwnProfile) return posts;
  return posts.filter((post) => {
    const archiveType = post.isVideo ? "reel" : "post";
    return !isPostArchived(post.id, graph, archiveType);
  });
}

export function isConversationBlocked(conversation: any, graph: SocialGraph): boolean {
  const profileId =
    conversation?.profileId ||
    conversation?.peerProfileId ||
    conversation?.maisonId ||
    conversation?.peerId ||
    "";
  const username = normalizeUsername(
    conversation?.username ||
      conversation?.peerUsername ||
      conversation?.maisonId ||
      conversation?.name ||
      ""
  );
  if (!profileId && !username) return false;
  return isUserBlocked(profileId, graph, username) || isUserMuted(profileId, graph, username);
}

export function filterConversations(conversations: any[], graph: SocialGraph): any[] {
  return conversations.filter((c) => !isConversationBlocked(c, graph));
}

export function filterSocialMediaItems(
  items: any[],
  graph: SocialGraph,
  ownProfileId?: string | null
): any[] {
  return items.filter((item) => shouldShowFeedItem(item, graph, ownProfileId));
}
