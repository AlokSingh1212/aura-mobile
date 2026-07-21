/** Instagram-style story ring gradient used across AURA (feed, account, threads). */
export const STORY_GRADIENT = {
  colors: ["#fb923c", "#d946ef", "#8b5cf6"] as const,
  start: { x: 0, y: 1 } as const,
  end: { x: 1, y: 0 } as const,
};

/** Extended ring for richer multicolor accents (mentions, links). */
export const STORY_GRADIENT_EXTENDED = {
  colors: ["#f09433", "#e6683c", "#dc2743", "#cc2366", "#bc1888", "#8b5cf6"] as const,
  start: { x: 0, y: 1 } as const,
  end: { x: 1, y: 0 } as const,
};

/** Solid accent when a flat color is required (spinners, icons). */
export const STORY_ACCENT = "#d946ef";
export const STORY_ACCENT_ORANGE = "#fb923c";
export const STORY_ACCENT_PURPLE = "#8b5cf6";

export const THREADS_THEME = {
  bg: "#080415",
  surface: "#0b071e",
  surfaceElevated: "#120a28",
  border: "rgba(217, 70, 239, 0.2)",
  borderSubtle: "rgba(255,255,255,0.06)",
  primary: STORY_ACCENT,
  primaryMuted: "rgba(217, 70, 239, 0.18)",
  text: "#ffffff",
  textSecondary: "#a8b2c1",
  textMuted: "#6b7280",
  danger: "#ff4d6d",
  like: "#ff4d6d",
  mention: STORY_ACCENT_ORANGE,
  elite: STORY_ACCENT_PURPLE,
} as const;
