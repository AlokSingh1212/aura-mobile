import { Alert, InteractionManager, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type MediaPickMode = "story" | "avatar" | "reel" | "post";

export type ProductMediaItem = { uri: string; type: "image" | "video" };

/** Delay after closing a Modal before launching the native picker (iOS requirement). */
export function delayAfterModalClose(): number {
  return Platform.OS === "ios" ? 550 : 280;
}

/** Wait for navigation/modal transitions to finish before presenting the system picker. */
export function waitForNativePickerReady(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, delayAfterModalClose());
    });
  });
}

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

  await waitForNativePickerReady();

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
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
    Alert.alert(
      "Could not open gallery",
      error instanceof Error ? error.message : "Try again after closing other screens."
    );
    return [];
  }
}

/** Pick multiple images for carousel posts */
export async function pickMultipleImages(max = 10): Promise<ImagePicker.ImagePickerAsset[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  await waitForNativePickerReady();

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: max,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return [];
    return result.assets;
  } catch (error) {
    console.warn("pickMultipleImages failed:", error);
    Alert.alert(
      "Could not open gallery",
      error instanceof Error ? error.message : "Try again after closing other screens."
    );
    return [];
  }
}

/** Opens the system gallery. Call after any RN Modal has fully dismissed. */
export async function pickMediaFromLibrary(
  mode: MediaPickMode
): Promise<ImagePicker.ImagePickerAsset | null> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return null;

  await waitForNativePickerReady();

  const isVideo = mode === "reel";
  const isStory = mode === "story";
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isVideo
        ? ImagePicker.MediaTypeOptions.Videos
        : isStory
          ? ImagePicker.MediaTypeOptions.All
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: mode === "story" || mode === "avatar",
      aspect:
        mode === "story" ? [9, 16] : mode === "avatar" ? [1, 1] : undefined,
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
