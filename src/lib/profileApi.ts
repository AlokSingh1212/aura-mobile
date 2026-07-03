import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export interface ProfilePost {
  id: string;
  url: string;
  thumbnail?: string;
  mediaUrls?: string[];
  caption?: string;
  isVideo: boolean;
  createdAt?: string;
}

export interface NetworkProfile {
  id: string;
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
      }) => ({
        id: p.id,
        url: p.url,
        thumbnail: p.thumbnail,
        mediaUrls: p.mediaUrls,
        caption: p.caption,
        isVideo: !!p.isVideo,
        createdAt: p.createdAt,
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
      (p: { id: string; username: string; name: string; logo?: string | null; isFollowing?: boolean }) => ({
        id: p.id,
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
      (p: { id: string; username: string; name: string; logo?: string | null; isFollowing?: boolean }) => ({
        id: p.id,
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
