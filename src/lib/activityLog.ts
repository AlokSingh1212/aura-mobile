import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_HOST } from "@/constants/api";

const LOCAL_KEY = "@aura/activity_log_v1";
const MAX_LOCAL = 200;

export type ActivityEntry = {
  id: string;
  type: "like" | "comment" | "save" | "view" | "shop_view" | "purchase" | "search";
  title: string;
  subtitle?: string;
  thumbnail?: string;
  targetId?: string;
  createdAt: string;
};

export async function appendActivity(entry: Omit<ActivityEntry, "id" | "createdAt">) {
  const list = await loadLocalActivity();
  const next: ActivityEntry = {
    ...entry,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const merged = [next, ...list].slice(0, MAX_LOCAL);
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
  return merged;
}

export async function loadLocalActivity(): Promise<ActivityEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearLocalActivity() {
  await AsyncStorage.removeItem(LOCAL_KEY);
}

export async function fetchRemoteActivity(userId: string): Promise<ActivityEntry[]> {
  try {
    const res = await fetch(
      `${API_HOST}/api/mobile/profile/activity?userId=${encodeURIComponent(userId)}`
    );
    const data = await res.json();
    if (data.success && Array.isArray(data.activities)) {
      return data.activities;
    }
  } catch {
    /* fallback local */
  }
  return loadLocalActivity();
}

export async function loadMergedActivity(userId?: string): Promise<ActivityEntry[]> {
  const local = await loadLocalActivity();
  if (!userId) return local;
  const remote = await fetchRemoteActivity(userId);
  const seen = new Set<string>();
  const merged: ActivityEntry[] = [];
  for (const item of [...remote, ...local]) {
    const key = `${item.type}-${item.targetId || item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
