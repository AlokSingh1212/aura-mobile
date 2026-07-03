import * as ImageManipulator from "expo-image-manipulator";

async function compressImage(
  uri: string,
  maxWidth: number,
  quality: number
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    const fallback = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.75,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return fallback.uri;
  }
}

export function compressImageForPost(uri: string) {
  return compressImage(uri, 1080, 0.72);
}

export function compressImageForStory(uri: string) {
  return compressImage(uri, 1080, 0.72);
}
