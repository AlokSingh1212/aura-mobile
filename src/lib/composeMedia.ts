import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import type { ClipSegment } from "@/lib/createDraft";
import { setExportJob } from "@/lib/exportJob";

export type ComposeReelOptions = {
  videoUrl?: string;
  clips?: ClipSegment[];
  uploadedClipUrls?: { id: string; url: string; inMs: number; outMs: number }[];
  audioUrl?: string;
  audioStartMs?: number;
  audioVolume?: number;
  filterId?: string;
  trackId?: string;
};

export type ComposeResult = {
  url: string;
  composed: boolean;
  muxApplied: boolean;
  filterApplied: boolean;
  clipsConcatenated: number;
};

const POLL_MS = 1500;
const POLL_MAX_MS = 120000;

async function pollComposeJob(jobId: string): Promise<ComposeResult> {
  const started = Date.now();

  while (Date.now() - started < POLL_MAX_MS) {
    const res = await fetch(`${API_HOST}/api/mobile/media/compose/${jobId}`, {
      headers: authHeaders(),
    });
    const data = await res.json();

    if (data.label) {
      setExportJob({
        phase: "composing",
        label: data.label,
        progress: Math.min(95, 30 + (data.progress || 0) * 0.65),
      });
    }

    if (data.status === "completed" && data.url) {
      return {
        url: String(data.url),
        composed: Boolean(data.composed),
        muxApplied: Boolean(data.muxApplied),
        filterApplied: Boolean(data.filterApplied),
        clipsConcatenated: Number(data.clipsConcatenated) || 0,
      };
    }

    if (data.status === "failed") {
      throw new Error(data.error || "Reel compose failed on worker.");
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  throw new Error("Reel compose timed out — try again.");
}

export async function composeReelAdvanced(opts: ComposeReelOptions): Promise<ComposeResult> {
  const clips =
    opts.uploadedClipUrls?.map((c) => ({
      url: c.url,
      inMs: c.inMs,
      outMs: c.outMs > 0 ? c.outMs : undefined,
    })) ??
    (opts.videoUrl ? [{ url: opts.videoUrl }] : []);

  const res = await fetch(`${API_HOST}/api/mobile/media/compose`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      videoUrl: opts.videoUrl,
      clips,
      audioUrl: opts.audioUrl,
      audioStartMs: opts.audioStartMs ?? 0,
      audioVolume: opts.audioVolume ?? 1,
      filterId: opts.filterId ?? "none",
      async: true,
    }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Could not compose reel.");
  }

  if (data.async && data.jobId) {
    const result = await pollComposeJob(data.jobId);
    if (opts.trackId) {
      fetch(`${API_HOST}/api/mobile/media/audio`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ trackId: opts.trackId }),
      }).catch(() => {});
    }
    return result;
  }

  if (!data.url) {
    throw new Error("Compose returned no URL.");
  }

  return {
    url: String(data.url),
    composed: Boolean(data.composed),
    muxApplied: Boolean(data.muxApplied),
    filterApplied: Boolean(data.filterApplied),
    clipsConcatenated: Number(data.clipsConcatenated) || clips.length,
  };
}

/** @deprecated use composeReelAdvanced */
export async function composeReelWithMusic(opts: {
  videoUrl: string;
  audioUrl: string;
  audioStartMs?: number;
  audioVolume?: number;
}): Promise<{ url: string; muxApplied: boolean }> {
  const result = await composeReelAdvanced(opts);
  return { url: result.url, muxApplied: result.muxApplied };
}
