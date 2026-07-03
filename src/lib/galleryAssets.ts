import * as MediaLibrary from "expo-media-library";
import { ensureMediaLibraryAccess } from "@/lib/createMediaPicker";

export interface GalleryAsset {
  id: string;
  uri: string;
  width: number;
  height: number;
  mediaType: "photo" | "video";
}

export async function loadRecentGalleryAssets(first = 80): Promise<GalleryAsset[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  const page = await MediaLibrary.getAssetsAsync({
    first,
    mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return page.assets.map((a) => ({
    id: a.id,
    uri: a.uri,
    width: a.width,
    height: a.height,
    mediaType: a.mediaType === MediaLibrary.MediaType.video ? "video" : "photo",
  }));
}

export async function resolveGalleryUri(asset: GalleryAsset): Promise<string> {
  if (asset.uri.startsWith("file://") || asset.uri.startsWith("content://")) {
    return asset.uri;
  }
  const info = await MediaLibrary.getAssetInfoAsync(asset.id);
  return info.localUri || info.uri || asset.uri;
}
