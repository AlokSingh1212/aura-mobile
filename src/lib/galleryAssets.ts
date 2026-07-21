import * as MediaLibrary from "expo-media-library";
import { ensureMediaLibraryAccess } from "@/lib/createMediaPicker";

export interface GalleryAsset {
  id: string;
  uri: string;
  width: number;
  height: number;
  mediaType: "photo" | "video";
  duration?: number;
}

export type GalleryAlbum = {
  id: string;
  title: string;
  assetCount: number;
};

export async function loadGalleryAlbums(): Promise<GalleryAlbum[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  return albums
    .filter((a) => a.assetCount > 0)
    .map((a) => ({
      id: a.id,
      title: a.title,
      assetCount: a.assetCount,
    }))
    .sort((a, b) => {
      if (a.title === "Recents") return -1;
      if (b.title === "Recents") return 1;
      return a.title.localeCompare(b.title);
    });
}

export async function loadRecentGalleryAssets(
  first = 80,
  albumId?: string
): Promise<GalleryAsset[]> {
  const allowed = await ensureMediaLibraryAccess();
  if (!allowed) return [];

  const query: MediaLibrary.AssetsOptions = {
    first,
    mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  };

  if (albumId) {
    query.album = albumId;
  }

  const page = await MediaLibrary.getAssetsAsync(query);

  return page.assets.map((a) => ({
    id: a.id,
    uri: a.uri,
    width: a.width,
    height: a.height,
    mediaType: a.mediaType === MediaLibrary.MediaType.video ? "video" : "photo",
    duration: a.duration,
  }));
}

export async function resolveGalleryUri(asset: GalleryAsset): Promise<string> {
  if (asset.uri.startsWith("file://") || asset.uri.startsWith("content://")) {
    return asset.uri;
  }
  const info = await MediaLibrary.getAssetInfoAsync(asset.id);
  return info.localUri || info.uri || asset.uri;
}
