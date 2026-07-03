import { Linking, Alert, Platform } from "react-native";

/** Open http(s) URLs from profile fields — adds https:// when missing. */
export async function openExternalUrl(raw: string): Promise<boolean> {
  const trimmed = raw?.trim();
  if (!trimmed) return false;

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }

  try {
    // iOS often returns false from canOpenURL for valid https URLs unless whitelisted in Info.plist
    if (Platform.OS === "ios" && /^https?:\/\//i.test(url)) {
      await Linking.openURL(url);
      return true;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      await Linking.openURL(url);
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert("Link error", "Could not open this link on your device.");
    return false;
  }
}

/** Only the primary website field — not social platform URLs. */
export function normalizeProfileLinks(profile: {
  websiteLink?: string | null;
  website?: string | null;
}): string[] {
  const primary = (profile.websiteLink || profile.website || "").trim();
  return primary ? [primary] : [];
}
