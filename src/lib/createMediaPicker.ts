import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type MediaPickMode = "story" | "avatar" | "reel" | "post";

export type ProductMediaItem = { uri: string; type: "image" | "video" };

export async function ensureMediaLibraryAccess(): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status === "granted" || perm.accessPrivileges === "limited") {
    return true;
  }
  Alert.alert(
    "Photos access needed",
    "Allow photo library access in Settings to pick images and videos for posts, stories, and reels."
  );
  return false;
}

/** Pick photos and videos for product listings */
export async function pickProductMediaFromLibrary(maxItems = 6): Promise<ProductMediaItem[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: maxItems,
      quality: 0.85,
      videoMaxDuration: 120,
    });
    if (result.canceled || !result.assets?.length) return [];

    return result.assets.map((asset) => ({
      uri: asset.uri,
      type: asset.type === "video" ? "video" : "image",
    }));
  } catch (error) {
    console.warn("pickProductMediaFromLibrary failed:", error);
    return [];
  }
}

/** Pick multiple images for carousel posts */
export async function pickMultipleImages(max = 10): Promise<ImagePicker.ImagePickerAsset[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: max,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return [];
    return result.assets;
  } catch (error) {
    console.warn("pickMultipleImages failed:", error);
    return [];
  }
}

/** Opens the system gallery. Call only after any RN Modal has fully dismissed. */
export async function pickMediaFromLibrary(
  mode: MediaPickMode
): Promise<ImagePicker.ImagePickerAsset | null> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return null;

  const isVideo = mode === "reel";
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo ? ["videos"] : ["images"],
      allowsEditing: mode === "story" || mode === "avatar" || mode === "post",
      aspect: mode === "story" ? [9, 16] : mode === "avatar" || mode === "post" ? [1, 1] : undefined,
      quality: 0.85,
      videoMaxDuration: 90,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }
    return result.assets[0];
  } catch (error) {
    console.warn("pickMediaFromLibrary failed:", error);
    Alert.alert(
      "Could not open gallery",
      error instanceof Error ? error.message : "Try again after closing other screens."
    );
    return null;
  }
}

/** Delay after closing a Modal before launching the native picker (iOS requirement). */
export function delayAfterModalClose(): number {
  return Platform.OS === "ios" ? 550 : 280;
}
