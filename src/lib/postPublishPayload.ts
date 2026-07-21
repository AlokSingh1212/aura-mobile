import type { PostEditState } from "@/lib/postEditState";
import type { StickerLayer } from "@/lib/createDraft";
import { allProductsFromLayers } from "@/lib/productTagUtils";

export type PostPublishExtras = {
  photoTags: {
    profileId: string;
    username: string;
    name: string;
    logo?: string | null;
  }[];
  productStickers: PostEditState["productStickers"];
  storyLayers: StickerLayer[];
  partnership: PostEditState["partnership"];
  musicTrack?: {
    id: string;
    title: string;
    artist?: string;
    url?: string;
    cover?: string;
  } | null;
  location?: string;
  latitude?: number;
  longitude?: number;
};

export function buildPostPublishExtras(edit: PostEditState): PostPublishExtras {
  const layers = [
    ...edit.stickerLayers,
    ...(edit.drawStrokes.length
      ? [
          {
            id: `draw_${Date.now()}`,
            type: "draw" as const,
            text: "",
            x: 0,
            y: 0,
            scale: 1,
            meta: { drawStrokes: edit.drawStrokes },
          },
        ]
      : []),
  ];

  const photoTags = layers
    .filter((s) => s.type === "mention" && s.meta?.profileId)
    .map((s) => ({
      profileId: s.meta!.profileId!,
      username: s.meta!.username || s.text,
      name: s.meta!.name || s.meta!.username || s.text,
      logo: s.meta!.avatar ?? null,
    }));

  const productFromLayers = allProductsFromLayers(layers);
  const productStickers =
    productFromLayers.length > 0 ? productFromLayers : edit.productStickers;

  const locationSticker = layers.find((s) => s.type === "location");
  const musicSticker = layers.find((s) => s.type === "music");

  const musicTrack = edit.audioTrackId
    ? {
        id: edit.audioTrackId,
        title: edit.audioLabel.split(" · ")[0] || edit.audioLabel,
        artist: edit.audioArtist,
        url: edit.audioUrl,
        cover: edit.audioCover,
      }
    : musicSticker?.meta?.musicTrackId
      ? {
          id: musicSticker.meta.musicTrackId,
          title: musicSticker.meta.musicTitle || musicSticker.text,
          artist: musicSticker.meta.musicArtist,
          url: musicSticker.meta.musicUrl,
          cover: musicSticker.meta.musicCover,
        }
      : null;

  return {
    photoTags,
    productStickers,
    storyLayers: layers,
    partnership: edit.partnership,
    musicTrack,
    location: locationSticker?.meta?.locationName || locationSticker?.text,
    latitude: locationSticker?.meta?.locationLat,
    longitude: locationSticker?.meta?.locationLon,
  };
}
