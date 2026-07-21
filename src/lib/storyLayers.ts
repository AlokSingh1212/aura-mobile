import type { StickerLayer, StickerLayerType } from "@/lib/createDraft";

export type StorySlideMeta = {
  storyLayers?: StickerLayer[];
  musicTrack?: {
    id: string;
    title: string;
    artist?: string;
    url?: string;
    cover?: string;
  } | null;
  partnership?: {
    paidLabel: boolean;
    adCodeEnabled: boolean;
    adCode?: string | null;
  } | null;
  photoTags?: Array<{
    profileId: string;
    username: string;
    name: string;
    logo?: string | null;
  }>;
  productStickers?: Array<{
    productId: string;
    title: string;
    image: string;
    price?: number;
  }>;
};

export type StorySlide = {
  id: string;
  url: string;
  caption?: string;
  isVideo?: boolean;
  addYours?: Record<string, unknown>;
} & StorySlideMeta;

const INTERACTIVE_TYPES = new Set<StickerLayerType>([
  "mention",
  "location",
  "poll",
  "question",
  "add_yours",
  "music",
  "link",
  "countdown",
  "product",
  "notify",
  "partnership",
  "emoji_slider",
  "hashtag",
  "avatar",
]);

export function parseStoryLayers(raw: unknown): StickerLayer[] {
  if (!Array.isArray(raw)) return [];
  const layers: StickerLayer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.type !== "string" || typeof o.text !== "string") {
      continue;
    }
    layers.push({
      id: o.id,
      type: o.type as StickerLayerType,
      text: o.text,
      x: Number(o.x) || 0,
      y: Number(o.y) || 0,
      scale: Number(o.scale) || 1,
      color: typeof o.color === "string" ? o.color : undefined,
      meta: o.meta && typeof o.meta === "object" ? (o.meta as StickerLayer["meta"]) : undefined,
    });
  }
  return layers;
}

export function interactiveLayers(layers: StickerLayer[]): StickerLayer[] {
  return layers.filter((l) => INTERACTIVE_TYPES.has(l.type));
}

export function mapApiStoryToSlide(s: Record<string, unknown>): StorySlide {
  const metaObj =
    s.metadata && typeof s.metadata === "object" ? (s.metadata as Record<string, unknown>) : {};

  const storyLayers = parseStoryLayers(s.storyLayers ?? metaObj.storyLayers);
  const musicTrack =
    (s.musicTrack as StorySlideMeta["musicTrack"]) ||
    (metaObj.musicTrack as StorySlideMeta["musicTrack"]) ||
    null;
  const partnership =
    (s.partnership as StorySlideMeta["partnership"]) ||
    (metaObj.partnership as StorySlideMeta["partnership"]) ||
    null;
  const photoTags =
    (Array.isArray(s.photoTags) ? s.photoTags : Array.isArray(metaObj.photoTags) ? metaObj.photoTags : []) as StorySlideMeta["photoTags"];
  const productStickers =
    (Array.isArray(s.productStickers)
      ? s.productStickers
      : Array.isArray(metaObj.productStickers)
        ? metaObj.productStickers
        : []) as StorySlideMeta["productStickers"];

  return {
    id: String(s.id),
    url: String(s.url),
    caption: typeof s.caption === "string" ? s.caption : undefined,
    isVideo:
      !!s.isVideo ||
      /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(s.url || "")),
    addYours: s.addYours as StorySlide["addYours"],
    storyLayers,
    musicTrack,
    partnership,
    photoTags,
    productStickers,
  };
}

export const STORY_CANVAS_W = 1080;
export const STORY_CANVAS_H = 1920;
