import type { StickerLayer } from "@/lib/createDraft";
import type { PartnershipSettings } from "@/components/stories/editor/StoryPartnershipSheet";
import { allProductsFromLayers } from "@/lib/productTagUtils";

export type StoryPublishExtras = {
  photoTags: {
    profileId: string;
    username: string;
    name: string;
    logo?: string | null;
  }[];
  productStickers: {
    productId: string;
    title: string;
    image: string;
    price?: number;
  }[];
  location?: string;
  latitude?: number;
  longitude?: number;
  music?: string;
  musicTrack?: {
    id: string;
    title: string;
    artist?: string;
    url?: string;
    cover?: string;
  } | null;
  storyLayers: StickerLayer[];
  partnership?: {
    paidLabel: boolean;
    adCodeEnabled: boolean;
    adCode?: string | null;
  } | null;
  addYoursPrompt?: string;
};

export function buildStoryPublishExtras(
  stickers: StickerLayer[],
  partnership: PartnershipSettings,
  partnershipAdCode?: string | null
): StoryPublishExtras {
  const photoTags = stickers
    .filter((s) => s.type === "mention" && s.meta?.profileId)
    .map((s) => ({
      profileId: s.meta!.profileId!,
      username: s.meta!.username || s.text,
      name: s.meta!.name || s.meta!.username || s.text,
      logo: s.meta!.avatar ?? null,
    }));

  const productStickers = allProductsFromLayers(stickers);

  const locationSticker = stickers.find((s) => s.type === "location");
  const musicSticker = stickers.find((s) => s.type === "music");
  const addYoursSticker = stickers.find((s) => s.type === "add_yours");

  const musicTrack = musicSticker?.meta?.musicTrackId
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
    location: locationSticker?.meta?.locationName || locationSticker?.text,
    latitude: locationSticker?.meta?.locationLat,
    longitude: locationSticker?.meta?.locationLon,
    music: musicTrack?.title || musicSticker?.meta?.musicTitle,
    musicTrack,
    storyLayers: stickers,
    partnership: {
      paidLabel: partnership.paidPartnershipLabel,
      adCodeEnabled: partnership.partnershipAdCode,
      adCode: partnership.partnershipAdCode ? partnershipAdCode || null : null,
    },
    addYoursPrompt: addYoursSticker?.meta?.addYoursPrompt || addYoursSticker?.text,
  };
}
