import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeUsername } from "@/lib/usernameUtils";
import {
  fetchRemoteSocialGraph,
  mergeSocialGraphs,
  pushRemoteSocialGraph,
} from "@/lib/socialGraphApi";

const STORAGE_KEY = "@aura/social_graph_v1";

export type SocialUser = {
  profileId: string;
  username: string;
  name: string;
  avatar?: string | null;
  addedAt: string;
};

export type ArchivedItem = {
  id: string;
  type: "post" | "story" | "reel" | "product";
  title?: string;
  thumbnail?: string;
  authorUsername?: string;
  archivedAt: string;
};

export type SocialGraph = {
  blocked: SocialUser[];
  muted: SocialUser[];
  closeFriends: SocialUser[];
  favorites: SocialUser[];
  archived: ArchivedItem[];
  hiddenPostIds: string[];
};

const EMPTY: SocialGraph = {
  blocked: [],
  muted: [],
  closeFriends: [],
  favorites: [],
  archived: [],
  hiddenPostIds: [],
};

let cache: SocialGraph | null = null;

export async function loadSocialGraph(): Promise<SocialGraph> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cache = { ...EMPTY, ...parsed, hiddenPostIds: parsed.hiddenPostIds ?? [] };
      return cache!;
    }
  } catch {
    /* empty */
  }
  cache = { ...EMPTY };
  return cache;
}

async function persist(graph: SocialGraph) {
  cache = graph;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  pushRemoteSocialGraph(graph).catch(() => {});
  return graph;
}

function upsertUser(list: SocialUser[], user: Omit<SocialUser, "addedAt">): SocialUser[] {
  const filtered = list.filter((u) => u.profileId !== user.profileId);
  return [{ ...user, addedAt: new Date().toISOString() }, ...filtered];
}

function removeUser(list: SocialUser[], profileId: string): SocialUser[] {
  return list.filter((u) => u.profileId !== profileId);
}

export async function blockUser(user: Omit<SocialUser, "addedAt">) {
  const g = await loadSocialGraph();
  return persist({
    ...g,
    blocked: upsertUser(g.blocked, user),
    muted: removeUser(g.muted, user.profileId),
    closeFriends: removeUser(g.closeFriends, user.profileId),
    favorites: removeUser(g.favorites, user.profileId),
  });
}

export async function unblockUser(profileId: string) {
  const g = await loadSocialGraph();
  return persist({ ...g, blocked: removeUser(g.blocked, profileId) });
}

export async function muteUser(user: Omit<SocialUser, "addedAt">) {
  const g = await loadSocialGraph();
  if (g.blocked.some((u) => u.profileId === user.profileId)) return g;
  return persist({ ...g, muted: upsertUser(g.muted, user) });
}

export async function unmuteUser(profileId: string) {
  const g = await loadSocialGraph();
  return persist({ ...g, muted: removeUser(g.muted, profileId) });
}

export async function addCloseFriend(user: Omit<SocialUser, "addedAt">) {
  const g = await loadSocialGraph();
  if (g.blocked.some((u) => u.profileId === user.profileId)) return g;
  return persist({ ...g, closeFriends: upsertUser(g.closeFriends, user) });
}

export async function removeCloseFriend(profileId: string) {
  const g = await loadSocialGraph();
  return persist({ ...g, closeFriends: removeUser(g.closeFriends, profileId) });
}

export async function addFavoriteAccount(user: Omit<SocialUser, "addedAt">) {
  const g = await loadSocialGraph();
  if (g.blocked.some((u) => u.profileId === user.profileId)) return g;
  return persist({ ...g, favorites: upsertUser(g.favorites, user) });
}

export async function removeFavoriteAccount(profileId: string) {
  const g = await loadSocialGraph();
  return persist({ ...g, favorites: removeUser(g.favorites, profileId) });
}

export async function archiveItem(item: Omit<ArchivedItem, "archivedAt">) {
  const g = await loadSocialGraph();
  const filtered = g.archived.filter((a) => !(a.id === item.id && a.type === item.type));
  return persist({
    ...g,
    archived: [{ ...item, archivedAt: new Date().toISOString() }, ...filtered],
  });
}

export async function unarchiveItem(id: string, type: ArchivedItem["type"]) {
  const g = await loadSocialGraph();
  return persist({
    ...g,
    archived: g.archived.filter((a) => !(a.id === id && a.type === type)),
  });
}

export function invalidateSocialGraphCache() {
  cache = null;
}

export async function hydrateSocialGraphFromRemote(profileId: string) {
  const remote = await fetchRemoteSocialGraph(profileId);
  if (!remote) return loadSocialGraph();
  const local = await loadSocialGraph();
  const merged = mergeSocialGraphs(local, remote);
  return persist(merged);
}

export function isUserBlocked(profileId: string, graph?: SocialGraph, username?: string) {
  const g = graph || cache;
  if (!g) return false;
  const normalized = username ? normalizeUsername(username) : "";
  return g.blocked.some(
    (u) => u.profileId === profileId || (!!normalized && u.username === normalized)
  );
}

export function isUserMuted(profileId: string, graph?: SocialGraph, username?: string) {
  const g = graph || cache;
  if (!g) return false;
  const normalized = username ? normalizeUsername(username) : "";
  return g.muted.some(
    (u) => u.profileId === profileId || (!!normalized && u.username === normalized)
  );
}

export function isPostHidden(postId: string, graph?: SocialGraph) {
  const g = graph || cache;
  if (!g) return false;
  return g.hiddenPostIds.includes(postId);
}

export function isPostArchived(
  id: string,
  graph?: SocialGraph,
  type?: ArchivedItem["type"]
) {
  const g = graph || cache;
  if (!g) return false;
  return g.archived.some((a) => a.id === id && (!type || a.type === type));
}

export async function hidePost(postId: string) {
  const g = await loadSocialGraph();
  if (g.hiddenPostIds.includes(postId)) return g;
  return persist({ ...g, hiddenPostIds: [postId, ...g.hiddenPostIds] });
}

export async function unhidePost(postId: string) {
  const g = await loadSocialGraph();
  return persist({ ...g, hiddenPostIds: g.hiddenPostIds.filter((id) => id !== postId) });
}
