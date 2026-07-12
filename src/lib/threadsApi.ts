import { apiFetchJson } from "@/lib/apiClient";

export type ThreadAuthor = {
  profileId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isElite: boolean;
  isVerified: boolean;
  type: string;
};

export type ThreadProduct = {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  image: string | null;
};

export type ThreadPostDto = {
  id: string;
  content: string;
  parentId: string | null;
  rootId: string | null;
  mediaUrls: string[];
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  createdAt: string;
  timestamp: string;
  author: ThreadAuthor;
  product: ThreadProduct | null;
  repostOf: {
    id: string;
    content: string;
    author: ThreadAuthor;
    product: ThreadProduct | null;
  } | null;
  liked: boolean;
  reposted: boolean;
  repliers: string[];
};

type FeedResponse = {
  success: boolean;
  threads?: ThreadPostDto[];
  nextCursor?: string | null;
  error?: string;
};

type DetailResponse = {
  success: boolean;
  thread?: ThreadPostDto;
  replies?: ThreadPostDto[];
  chain?: ThreadPostDto[];
  rootId?: string;
  reposted?: boolean;
  error?: string;
};

export async function fetchThreadsFeed(opts: {
  userId: string;
  profileId?: string;
  tab?: "forYou" | "following";
  cursor?: string | null;
}) {
  const params = new URLSearchParams({ userId: opts.userId });
  if (opts.profileId) params.set("profileId", opts.profileId);
  if (opts.tab) params.set("tab", opts.tab);
  if (opts.cursor) params.set("cursor", opts.cursor);

  const { ok, data } = await apiFetchJson<FeedResponse>(`/threads?${params.toString()}`);
  return { ok, ...(data || { success: false }) };
}

export async function fetchThreadDetail(opts: {
  threadId: string;
  userId: string;
  profileId?: string;
}) {
  const params = new URLSearchParams({ userId: opts.userId });
  if (opts.profileId) params.set("profileId", opts.profileId);

  const { ok, data } = await apiFetchJson<DetailResponse>(
    `/threads/${opts.threadId}?${params.toString()}`
  );
  return { ok, ...(data || { success: false }) };
}

export async function createThread(opts: {
  userId: string;
  profileId?: string;
  content: string;
  productId?: string;
  mediaUrls?: string[];
  parentId?: string;
}) {
  const { ok, data } = await apiFetchJson<{ success: boolean; post?: ThreadPostDto; error?: string }>(
    "/threads",
    {
      method: "POST",
      body: JSON.stringify(opts),
    }
  );
  return { ok, ...(data || { success: false }) };
}

export async function toggleThreadLike(opts: {
  userId: string;
  profileId?: string;
  threadId: string;
}) {
  const { ok, data } = await apiFetchJson<{
    success: boolean;
    liked?: boolean;
    likesCount?: number;
    error?: string;
  }>(`/threads/${opts.threadId}/like`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return { ok, ...(data || { success: false }) };
}

export async function repostThread(opts: {
  userId: string;
  profileId?: string;
  threadId: string;
  quoteContent?: string;
}) {
  const { ok, data } = await apiFetchJson<{
    success: boolean;
    reposted?: boolean;
    repostsCount?: number;
    post?: ThreadPostDto;
    error?: string;
  }>(`/threads/${opts.threadId}/repost`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return { ok, ...(data || { success: false }) };
}
