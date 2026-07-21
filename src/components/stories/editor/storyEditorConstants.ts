import type { StickerLayerType } from "@/lib/createDraft";

export type StoryStickerDef = {
  id: StickerLayerType | "frames" | "food";
  label: string;
  icon: string;
  iconColor: string;
  mapsTo: StickerLayerType;
};

export const STORY_STICKER_CATALOG: StoryStickerDef[] = [
  { id: "location", label: "Location", icon: "location", iconColor: "#7c4dff", mapsTo: "location" },
  { id: "mention", label: "Mention", icon: "at", iconColor: "#ff9800", mapsTo: "mention" },
  { id: "music", label: "Music", icon: "musical-notes", iconColor: "#e91e63", mapsTo: "music" },
  { id: "photo", label: "Photo", icon: "image", iconColor: "#4caf50", mapsTo: "photo" },
  { id: "gif", label: "GIF", icon: "search", iconColor: "#4caf50", mapsTo: "gif" },
  { id: "add_yours", label: "Add Yours", icon: "add-circle", iconColor: "#e53935", mapsTo: "add_yours" },
  { id: "frame", label: "Photostrip", icon: "albums", iconColor: "#9e9e9e", mapsTo: "frame" },
  { id: "question", label: "Questions", icon: "help-circle", iconColor: "#e91e63", mapsTo: "question" },
  { id: "cutout", label: "Cutouts", icon: "cut", iconColor: "#4caf50", mapsTo: "cutout" },
  { id: "notify", label: "Notify", icon: "notifications", iconColor: "#2196f3", mapsTo: "notify" },
  { id: "avatar", label: "Avatar", icon: "person-circle", iconColor: "#673ab7", mapsTo: "avatar" },
  { id: "emoji", label: "Emoji", icon: "happy", iconColor: "#ffc107", mapsTo: "emoji" },
  { id: "poll", label: "Poll", icon: "stats-chart", iconColor: "#e91e63", mapsTo: "poll" },
  { id: "emoji_slider", label: "Emoji slider", icon: "heart", iconColor: "#e91e63", mapsTo: "emoji_slider" },
  { id: "link", label: "Link", icon: "link", iconColor: "#2196f3", mapsTo: "link" },
  { id: "hashtag", label: "#hashtag", icon: "pound", iconColor: "#e91e63", mapsTo: "hashtag" },
  { id: "countdown", label: "Countdown", icon: "timer", iconColor: "#e91e63", mapsTo: "countdown" },
  { id: "product", label: "Food Orders", icon: "cart", iconColor: "#f44336", mapsTo: "product" },
];

export const STORY_TEXT_FONTS = [
  { id: "modern", label: "Modern", fontFamily: undefined, fontWeight: "700" as const },
  { id: "classic", label: "Classic", fontFamily: undefined, fontStyle: "normal" as const, fontWeight: "400" as const },
  { id: "signature", label: "Signature", fontFamily: undefined, fontStyle: "italic" as const, fontWeight: "600" as const },
  { id: "strong", label: "Strong", fontFamily: undefined, fontWeight: "900" as const },
];

export const STORY_DRAW_COLORS = [
  "#ffffff",
  "#000000",
  "#2196f3",
  "#4caf50",
  "#ffeb3b",
  "#ff9800",
  "#f44336",
  "#e91e63",
  "#9c27b0",
];

export const STORY_TEXT_COLORS = [
  "#ffffff",
  "#000000",
  "#ff5252",
  "#ff9800",
  "#ffeb3b",
  "#4caf50",
  "#00bcd4",
  "#2196f3",
  "#e91e63",
];

export const STORY_EMOJI_OPTIONS = ["😍", "🔥", "💯", "✨", "😂", "🥺", "💎", "🖤", "👀", "🎉"];
