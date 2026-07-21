/** Shared reel studio configuration — single source for camera + server export */

export type ReelEffect = {
  id: string;
  name: string;
  icon: string;
  previewColor: string;
  /** Maps to ffmpeg preset in videoFilters.ts */
  exportId: string;
};

export const REEL_EFFECTS: ReelEffect[] = [
  { id: "none", name: "Normal", icon: "ban-outline", previewColor: "transparent", exportId: "none" },
  { id: "platinum", name: "Platinum", icon: "sparkles", previewColor: "rgba(255,255,255,0.12)", exportId: "platinum" },
  { id: "neon", name: "Neon", icon: "color-palette", previewColor: "rgba(0,245,255,0.08)", exportId: "neon" },
  { id: "obsidian", name: "Obsidian", icon: "moon", previewColor: "rgba(8,4,21,0.55)", exportId: "obsidian" },
  { id: "retro_warm", name: "Retro Warm", icon: "sunny", previewColor: "rgba(235,150,50,0.16)", exportId: "retro_warm" },
  { id: "cool_ice", name: "Cool Ice", icon: "snow", previewColor: "rgba(50,150,255,0.16)", exportId: "cool_ice" },
  { id: "sepia", name: "Sepia", icon: "cafe", previewColor: "rgba(180,130,80,0.22)", exportId: "sepia" },
  { id: "vivid", name: "Vivid", icon: "flower", previewColor: "rgba(255,80,180,0.12)", exportId: "vivid" },
  { id: "fade", name: "Fade", icon: "contrast", previewColor: "rgba(200,200,200,0.15)", exportId: "fade" },
  { id: "dramatic", name: "Dramatic", icon: "thunderstorm", previewColor: "rgba(0,0,0,0.35)", exportId: "dramatic" },
  { id: "golden", name: "Golden Hour", icon: "partly-sunny", previewColor: "rgba(255,200,80,0.18)", exportId: "golden" },
  { id: "noir", name: "Film Noir", icon: "film", previewColor: "rgba(0,0,0,0.45)", exportId: "noir" },
  { id: "pastel", name: "Pastel", icon: "heart", previewColor: "rgba(255,180,220,0.14)", exportId: "pastel" },
  { id: "chrome", name: "Chrome", icon: "diamond", previewColor: "rgba(180,200,255,0.12)", exportId: "chrome" },
  { id: "vintage", name: "Vintage", icon: "camera", previewColor: "rgba(120,90,60,0.2)", exportId: "vintage" },
  { id: "luxury", name: "Quiet Luxury", icon: "star", previewColor: "rgba(255,255,255,0.06)", exportId: "luxury" },
];

export const REEL_LENGTHS = [15, 30, 60, 90] as const;
export type ReelLength = (typeof REEL_LENGTHS)[number];
export const MAX_REEL_TOTAL_SEC = 90;

export const REEL_PLAYBACK_SPEEDS = [0.5, 1, 2] as const;
export type ReelPlaybackSpeed = (typeof REEL_PLAYBACK_SPEEDS)[number];

export const REEL_COUNTDOWN_SECONDS = [0, 3, 5, 10] as const;
export type ReelCountdownSeconds = (typeof REEL_COUNTDOWN_SECONDS)[number];

export type PrompterSettings = {
  text: string;
  fontSize: number;
  scrollSpeed: number;
  position: "top" | "center" | "bottom";
};

export const DEFAULT_PROMPTER: PrompterSettings = {
  text: "Share your story on AURA.\nTell viewers what makes this moment special.\nTag products · mention your handle.",
  fontSize: 17,
  scrollSpeed: 1,
  position: "center",
};

export type AlignSettings = {
  enabled: boolean;
  opacity: number;
  useLastClip: boolean;
};

export const DEFAULT_ALIGN: AlignSettings = {
  enabled: false,
  opacity: 35,
  useLastClip: true,
};

export function formatDurationMs(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatUses(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
