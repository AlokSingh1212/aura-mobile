import type { StickerLayer } from "@/lib/createDraft";
import { uploadMediaFromUri } from "@/lib/uploadMedia";

async function remoteUri(uri: string, purpose: "story" | "post"): Promise<string> {
  if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
    return uri;
  }
  return uploadMediaFromUri(uri, purpose);
}

/** Upload local overlay images so story layer metadata is valid after publish. */
export async function uploadStoryStickerAssets(stickers: StickerLayer[]): Promise<StickerLayer[]> {
  const uploaded: StickerLayer[] = [];
  for (const sticker of stickers) {
    const meta = sticker.meta ? { ...sticker.meta } : undefined;
    if (!meta) {
      uploaded.push(sticker);
      continue;
    }
    if (meta.imageUri) {
      meta.imageUri = await remoteUri(meta.imageUri, "story");
    }
    if (meta.frameUris?.length) {
      meta.frameUris = await Promise.all(meta.frameUris.map((u) => remoteUri(u, "story")));
    }
    uploaded.push({ ...sticker, meta });
  }
  return uploaded;
}
