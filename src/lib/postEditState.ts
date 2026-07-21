/** Live-edit state for a single post image (Instagram-style composer). */

import type { DrawStroke, StickerLayer } from "@/lib/createDraft";
import type { PartnershipSettings } from "@/components/stories/editor/StoryPartnershipSheet";

export type AdjustKey =
  | "lux"
  | "brightness"
  | "contrast"
  | "structure"
  | "warmth"
  | "saturation"
  | "color"
  | "fade"
  | "highlights"
  | "shadows"
  | "vignette"
  | "tiltShift"
  | "sharpness";

export const ADJUST_CONTROLS: { key: AdjustKey; label: string }[] = [
  { key: "lux", label: "Lux" },
  { key: "brightness", label: "Brightness" },
  { key: "contrast", label: "Contrast" },
  { key: "structure", label: "Structure" },
  { key: "warmth", label: "Warmth" },
  { key: "saturation", label: "Saturation" },
  { key: "color", label: "Color" },
  { key: "fade", label: "Fade" },
  { key: "highlights", label: "Highlights" },
  { key: "shadows", label: "Shadows" },
  { key: "vignette", label: "Vignette" },
  { key: "tiltShift", label: "Tilt shift" },
  { key: "sharpness", label: "Sharpness" },
];

export type ImageAdjustments = Record<AdjustKey, number>;

export function defaultAdjustments(): ImageAdjustments {
  return {
    lux: 0,
    brightness: 0,
    contrast: 0,
    structure: 0,
    warmth: 0,
    saturation: 0,
    color: 0,
    fade: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    tiltShift: 0,
    sharpness: 0,
  };
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  bgColor?: string;
}

export interface ProductSticker {
  productId: string;
  title: string;
  image: string;
  price?: number;
}

export interface PostEditState {
  filterId: string;
  adjustments: ImageAdjustments;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  drawStrokes: DrawStroke[];
  productStickers: ProductSticker[];
  audioTrackId: string;
  audioLabel: string;
  audioUrl?: string;
  audioArtist?: string;
  audioCover?: string;
  partnership: PartnershipSettings;
}

export function defaultPostEditState(): PostEditState {
  return {
    filterId: "normal",
    adjustments: defaultAdjustments(),
    textLayers: [],
    stickerLayers: [],
    drawStrokes: [],
    productStickers: [],
    audioTrackId: "",
    audioLabel: "",
    partnership: {
      paidPartnershipLabel: false,
      partnershipAdCode: false,
      partnershipAdCodeValue: null,
    },
  };
}

export const FILTER_PRESETS = [
  { id: "normal", name: "Normal", overlayColor: "transparent" },
  { id: "fade", name: "Fade", overlayColor: "rgba(200,200,200,0.18)" },
  { id: "fade_warm", name: "Fade warm", overlayColor: "rgba(255,180,80,0.22)" },
  { id: "fade_cool", name: "Fade cool", overlayColor: "rgba(80,160,255,0.2)" },
  { id: "retro_warm", name: "Warm", overlayColor: "rgba(235,150,50,0.16)" },
  { id: "cool_ice", name: "Cool", overlayColor: "rgba(50,150,255,0.16)" },
  { id: "sepia", name: "Vintage", overlayColor: "rgba(180,130,80,0.22)" },
  { id: "obsidian_noir", name: "Noir", overlayColor: "rgba(0,0,0,0.45)" },
];
