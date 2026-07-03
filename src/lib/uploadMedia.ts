import { readAsStringAsync, getInfoAsync } from "expo-file-system/legacy";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

function isRemoteUrl(uri: string): boolean {
  return (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("data:")
  );
}

async function parseUploadResponse(res: Response): Promise<{ success?: boolean; url?: string; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? "Server returned an invalid response."
        : `Upload failed (${res.status}): ${text.slice(0, 120) || "no details"}`
    );
  }
}

/** Read a local device URI as base64 (works with Expo Go + gallery paths). */
export async function readLocalImageBase64(localUri: string): Promise<string> {
  const trimmed = localUri?.trim();
  if (!trimmed) {
    throw new Error("No image selected.");
  }

  const info = await getInfoAsync(trimmed);
  if (!info.exists) {
    throw new Error("Could not read the selected photo. Try choosing the photo again.");
  }

  const base64 = await readAsStringAsync(trimmed, { encoding: "base64" });
  if (!base64) {
    throw new Error("Selected photo has no readable image data.");
  }
  return base64;
}

/** Upload a gallery/camera URI to the API CDN. Returns a public https or data URL. */
export async function uploadMediaFromUri(
  localUri: string,
  purpose: "avatar" | "story" | "post" | "reel" = "post"
): Promise<string> {
  const trimmed = localUri?.trim();
  if (!trimmed) {
    throw new Error("No image selected.");
  }
  if (isRemoteUrl(trimmed)) {
    return trimmed;
  }

  const isVideo = purpose === "reel" || /\.(mp4|mov|m4v)$/i.test(trimmed);
  const base64 = await readAsStringAsync(trimmed, { encoding: "base64" });
  if (!base64) {
    throw new Error("Selected media has no readable data.");
  }
  const contentType = isVideo ? "video/mp4" : "image/jpeg";
  const ext = isVideo ? "mp4" : "jpg";
  const fileName = `aura-${purpose}-${Date.now()}.${ext}`;

  const res = await fetch(`${API_HOST}/api/mobile/media/upload`, {
    method: "POST",
    headers: authHeaders({ Accept: "application/json" }),
    body: JSON.stringify({
      base64,
      contentType,
      fileName,
    }),
  });

  const data = await parseUploadResponse(res);
  if (res.status === 401) {
    throw new Error(data.error || "Session expired. Please sign in again.");
  }
  if (!data.success || !data.url) {
    throw new Error(data.error || "Could not upload media to server.");
  }
  return String(data.url);
}
