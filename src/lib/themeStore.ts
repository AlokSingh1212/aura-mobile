import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "aura_theme_preference_v1";

let cached: ThemePreference = "system";

export function getThemePreference(): ThemePreference {
  return cached;
}

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") {
      cached = raw;
      return raw;
    }
  } catch {
    /* ignore */
  }
  cached = "system";
  return "system";
}

export async function saveThemePreference(pref: ThemePreference): Promise<void> {
  cached = pref;
  await AsyncStorage.setItem(STORAGE_KEY, pref);
}

export function resolveIsDark(pref: ThemePreference, systemScheme: "light" | "dark" | null | undefined): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return systemScheme === "dark";
}
