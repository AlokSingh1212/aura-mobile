/** Shared identity helpers — one logged-in profile across feed, stories, inbox, account. */

export type ProfileLike = {
  id?: string;
  username?: string;
  name?: string;
  logo?: string | null;
  maisonId?: string | null;
  type?: string;
  category?: string | null;
  website?: string | null;
  websiteLink?: string | null;
  bioText?: string | null;
  tags?: string[];
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
};

export type UserLike = {
  id?: string;
  maisonId?: string | null;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80";

export function resolveMaisonId(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined,
  fallback = ""
): string {
  return (
    activeProfile?.maisonId ||
    activeProfile?.username ||
    currentUser?.maisonId ||
    fallback
  );
}

export function resolveUserId(currentUser: UserLike | null | undefined): string | null {
  return currentUser?.id ?? null;
}

export function getProfileDisplayName(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined
): string {
  return (
    activeProfile?.name ||
    currentUser?.name ||
    activeProfile?.username ||
    "AURA User"
  );
}

export function getProfileUsername(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined
): string {
  return activeProfile?.username || currentUser?.maisonId || currentUser?.name || "user";
}

export function getProfileAvatar(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined
): string | null {
  const uri = activeProfile?.logo || currentUser?.avatar || null;
  if (!uri || uri === DEFAULT_AVATAR) return null;
  return uri;
}

/** Legacy fallback for places that require a string URI */
export function getProfileAvatarOrDefault(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined
): string {
  return getProfileAvatar(activeProfile, currentUser) || DEFAULT_AVATAR;
}

export function buildYourStoryNode(
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined,
  existingSlides?: { id: string; url: string; caption?: string }[]
) {
  const username = getProfileUsername(activeProfile, currentUser);
  return {
    id: "ys",
    username: username === "user" ? "Your story" : username,
  avatar: getProfileAvatar(activeProfile, currentUser) || "",
    isYourStory: true,
    slides: existingSlides?.length ? existingSlides : [],
  };
}

export function syncInstaStoriesWithProfile(
  instaStories: any[],
  activeProfile: ProfileLike | null | undefined,
  currentUser: UserLike | null | undefined
) {
  const existingYour = instaStories.find((s) => s.isYourStory);
  const yourStory = buildYourStoryNode(
    activeProfile,
    currentUser,
    existingYour?.slides
  );
  const others = instaStories.filter((s) => !s.isYourStory);
  return [yourStory, ...others];
}

export const AUTH_BUNDLE_KEY = "aura_auth_bundle_v1";

export interface AuthBundle {
  currentUser: UserLike & Record<string, unknown>;
  activeProfile: ProfileLike | null;
  userProfiles: ProfileLike[];
  activeMaisonId: string;
  authToken?: string | null;
}

export async function loadAuthBundle(
  storage: { getItem: (k: string) => Promise<string | null> }
): Promise<AuthBundle | null> {
  const raw = await storage.getItem(AUTH_BUNDLE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthBundle;
  } catch {
    return null;
  }
}

export async function saveAuthBundle(
  storage: {
    setItem: (k: string, v: string) => Promise<void>;
    removeItem: (k: string) => Promise<void>;
  },
  bundle: AuthBundle | null
) {
  if (!bundle?.currentUser?.id) {
    await storage.removeItem(AUTH_BUNDLE_KEY);
    return;
  }
  await storage.setItem(AUTH_BUNDLE_KEY, JSON.stringify(bundle));
}
