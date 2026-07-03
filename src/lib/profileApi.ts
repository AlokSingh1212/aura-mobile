import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import type { CollabPartner, PhotoTag } from "@/lib/postComposerTypes";

export interface ProfilePost {
  id: string;
  url: string;
  thumbnail?: string;
  mediaUrls?: string[];
  caption?: string;
  isVideo: boolean;
  createdAt?: string;
  artifactId?: string | null;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    maisonId?: string;
  } | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  music?: string | null;
  aiLabel?: boolean;
  photoTags?: PhotoTag[];
  collab?: CollabPartner | null;
}

export interface NetworkProfile {
  id: string;
  userId?: string;
  username: string;
  name: string;
  avatar: string | null;
  followed: boolean;
}

export interface FollowedByPreview {
  username: string;
  name: string;
  logo: string | null;
}

export interface ProfileCatalogProduct {
  id: string;
  title: string;
  price: number;
  vibe?: string;
  type?: string;
  images: string[];
  description?: string | null;
  maisonId: string;
  storeName: string;
  storeUsername: string;
  storeProfileId: string | null;
  storeLogo?: string | null;
  variants?: { id: string; title: string; stock: number; price: number | null }[];
  createdAt?: string;
}

export async function fetchProfileProducts(opts: {
  userId?: string;
  profileId?: string;
}): Promise<{ products: ProfileCatalogProduct[]; mode: string }> {
  const params = new URLSearchParams();
  if (opts.userId) params.set("userId", opts.userId);
  if (opts.profileId) params.set("profileId", opts.profileId);

  const res = await fetch(`${API_HOST}/api/mobile/profile/products?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (data.success && Array.isArray(data.products)) {
    return { products: data.products, mode: data.mode || "store" };
  }
  return { products: [], mode: "empty" };
}

export async function fetchProfilePosts(opts: {
  userId?: string;
  username?: string;
  profileId?: string;
}): Promise<ProfilePost[]> {
  const params = new URLSearchParams();
  if (opts.userId) params.set("userId", opts.userId);
  if (opts.username) params.set("username", opts.username);
  if (opts.profileId) params.set("profileId", opts.profileId);

  const res = await fetch(`${API_HOST}/api/mobile/profile/posts?${params}`, {
    headers: opts.userId ? authHeaders() : {},
  });
  const data = await res.json();
  if (data.success && Array.isArray(data.posts)) {
    return data.posts.map(
      (p: {
        id: string;
        url: string;
        thumbnail?: string;
        mediaUrls?: string[];
        caption?: string;
        isVideo?: boolean;
        createdAt?: string;
        artifactId?: string | null;
        product?: ProfilePost["product"];
        location?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        music?: string | null;
        aiLabel?: boolean;
        photoTags?: ProfilePost["photoTags"];
        collab?: ProfilePost["collab"];
      }) => ({
        id: p.id,
        url: p.url,
        thumbnail: p.thumbnail,
        mediaUrls: p.mediaUrls,
        caption: p.caption,
        isVideo: !!p.isVideo,
        createdAt: p.createdAt,
        artifactId: p.artifactId ?? null,
        product: p.product ?? null,
        location: p.location ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        music: p.music ?? null,
        aiLabel: !!p.aiLabel,
        photoTags: p.photoTags || [],
        collab: p.collab ?? null,
      })
    );
  }
  return [];
}

export async function fetchProfileNetwork(
  profileId: string,
  type: "followers" | "following",
  viewerProfileId?: string
): Promise<NetworkProfile[]> {
  const params = new URLSearchParams({ profileId, type });
  if (viewerProfileId) params.set("viewerProfileId", viewerProfileId);

  const res = await fetch(`${API_HOST}/api/mobile/profile/network?${params}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.profiles)) {
    return data.profiles.map(
      (p: {
        id: string;
        userId?: string;
        username: string;
        name: string;
        logo?: string | null;
        isFollowing?: boolean;
      }) => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        name: p.name,
        avatar: p.logo || null,
        followed: !!p.isFollowing,
      })
    );
  }
  return [];
}

export async function fetchSuggestedProfiles(
  viewerProfileId: string,
  limit = 6
): Promise<NetworkProfile[]> {
  const params = new URLSearchParams({
    viewerProfileId,
    limit: String(limit),
  });
  const res = await fetch(`${API_HOST}/api/mobile/profile/suggested?${params}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.profiles)) {
    return data.profiles.map(
      (p: {
        id: string;
        userId?: string;
        username: string;
        name: string;
        logo?: string | null;
        isFollowing?: boolean;
      }) => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        name: p.name,
        avatar: p.logo || null,
        followed: !!p.isFollowing,
      })
    );
  }
  return [];
}

export async function toggleFollowProfile(
  followerProfileId: string,
  followingProfileId: string
): Promise<{ success: boolean; isFollowing?: boolean; followersCount?: number; followingCount?: number }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ followerProfileId, followingProfileId }),
  });
  const data = await res.json();
  return data;
}

export async function deleteProfilePost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/posts`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ postId, userId }),
  });
  const data = await res.json();
  return data;
}

export interface PostComment {
  id: string;
  username: string;
  text: string;
  time: string;
  userId?: string;
}

export async function fetchPostComments(postId: string): Promise<PostComment[]> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/posts/comments?postId=${encodeURIComponent(postId)}`);
  const data = await res.json();
  if (data.success && Array.isArray(data.comments)) return data.comments;
  return [];
}

export async function addPostComment(
  postId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; comment?: PostComment; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/posts/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ postId, userId, content }),
  });
  const data = await res.json();
  if (res.status === 401) {
    return {
      success: false,
      error: data.message || "Session expired. Please sign in again.",
    };
  }
  return data;
}

export async function fetchPostEngagement(
  postId: string,
  userId?: string
): Promise<{
  likeCount: number;
  commentCount: number;
  shareCount: number;
  liked: boolean;
  saved: boolean;
}> {
  const params = new URLSearchParams({ postId });
  if (userId) params.set("userId", userId);
  const res = await fetch(`${API_HOST}/api/mobile/profile/posts/engagement?${params}`);
  const data = await res.json();
  if (data.success) {
    return {
      likeCount: data.likeCount ?? 0,
      commentCount: data.commentCount ?? 0,
      shareCount: data.shareCount ?? 0,
      liked: !!data.liked,
      saved: !!data.saved,
    };
  }
  return { likeCount: 0, commentCount: 0, shareCount: 0, liked: false, saved: false };
}

export async function sharePostToUser(opts: {
  senderId: string;
  receiverUserId: string;
  postId: string;
  postUrl?: string;
  caption?: string;
}): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/chat/share-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export interface ProfileHighlight {
  id: string;
  title: string;
  avatar: string;
  storyIds?: string[];
}

export async function fetchProfileHighlights(profileId: string): Promise<ProfileHighlight[]> {
  const res = await fetch(
    `${API_HOST}/api/mobile/profile/highlights?profileId=${encodeURIComponent(profileId)}`
  );
  const data = await res.json();
  if (data.success && Array.isArray(data.highlights)) return data.highlights;
  return [];
}

export async function createProfileHighlight(opts: {
  profileId: string;
  userId: string;
  title: string;
  coverUrl?: string;
  storyIds?: string[];
}): Promise<{ success: boolean; highlight?: ProfileHighlight; error?: string }> {
  const res = await fetch(`${API_HOST}/api/mobile/profile/highlights`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(opts),
  });
  return res.json();
}

export async function fetchProductById(id: string): Promise<any | null> {
  const res = await fetch(`${API_HOST}/api/mobile/products?id=${encodeURIComponent(id)}`);
  const data = await res.json();
  if (data.success && data.product) return data.product;
  return null;
}
