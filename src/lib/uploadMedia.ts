import { readAsStringAsync, getInfoAsync, uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

function isRemoteUrl(uri: string): boolean {
  return (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("data:")
  );
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

/** Upload a gallery/camera URI directly to Vercel Blob using binary streaming. */
export async function uploadMediaFromUri(
  localUri: string,
  purpose: "avatar" | "story" | "post" | "reel" = "post"
): Promise<string> {
  const trimmed = localUri?.trim();
  if (!trimmed) {
    throw new Error("No media selected.");
  }
  if (isRemoteUrl(trimmed)) {
    return trimmed;
  }

  const isVideo = purpose === "reel" || /\.(mp4|mov|m4v)$/i.test(trimmed);
  const contentType = isVideo ? "video/mp4" : "image/jpeg";
  const ext = isVideo ? "mp4" : "jpg";
  const fileName = `aura-${purpose}-${Date.now()}.${ext}`;

  // 1. Get direct client token from Next.js server
  const tokenRes = await fetch(`${API_HOST}/api/mobile/media/upload/token`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      pathname: fileName,
      contentType,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.success) {
    throw new Error(tokenData.error || "Could not retrieve upload token from server.");
  }

  const { clientToken, uploadUrl, publicUrl } = tokenData;

  const isR2 = clientToken === "r2-presigned-put";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  
  if (!isR2) {
    headers["Authorization"] = `Bearer ${clientToken}`;
    headers["x-api-version"] = "12";
  }

  // 2. Upload file directly to destination container
  const uploadResult = await uploadAsync(uploadUrl, trimmed, {
    httpMethod: "PUT",
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers,
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Direct upload failed (${uploadResult.status}): ${uploadResult.body || "no details"}`);
  }

  if (isR2 && publicUrl) {
    return publicUrl;
  }

  try {
    const resData = JSON.parse(uploadResult.body);
    if (resData && resData.url) {
      return resData.url;
    }
  } catch {
    /* fallback if JSON parsing fails but request succeeded */
  }

  return publicUrl || uploadUrl;

}
