import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import { composeReelAdvanced } from "@/lib/composeMedia";
import { runExportJob } from "@/lib/exportJob";
import { uploadMediaFromUri } from "@/lib/uploadMedia";
import type { ClipSegment } from "@/lib/createDraft";

export type PublishKind = "story" | "post" | "reel";

export type ReelAudioTrack = {
  url: string;
  trackId?: string;
  startMs?: number;
  volume?: number;
};

export interface PublishOptions {
  userId: string;
  profileId: string | null;
  profileName?: string;
  caption?: string;
  productId?: string | null;
  location?: string;
  latitude?: number;
  longitude?: number;
  aiLabel?: boolean;
  photoTags?: { profileId: string; username: string; name: string; logo?: string | null }[];
  collab?: {
    profileId: string;
    username: string;
    name: string;
    logo?: string | null;
    status?: string;
  } | null;
  music?: string;
  alsoPostToGrid?: boolean;
  audioTrack?: ReelAudioTrack | null;
  /** Server ffmpeg filter bake (reel) */
  filterId?: string;
  /** Multi-clip reel timeline */
  clips?: ClipSegment[];
  /** Carousel post URLs (already uploaded) */
  mediaUrls?: string[];
}

export interface PublishResult {
  publicUrl: string;
  contentId?: string;
  mediaUrls?: string[];
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url) || url.includes("video");
}

async function postToFeedApi(
  publicUrl: string,
  opts: PublishOptions & { storyOnly: boolean; isVideo?: boolean }
): Promise<string | undefined> {
  const caption =
    opts.caption?.trim() ||
    `✨ ${opts.profileName || "Your"} on AURA`;

  const isVideo = opts.isVideo ?? isVideoUrl(publicUrl);
  const feedType = opts.storyOnly
    ? undefined
    : isVideo
      ? "CREATOR_COMMERCE"
      : "CREATOR_POST";

  const carousel = opts.mediaUrls && opts.mediaUrls.length > 1 ? opts.mediaUrls : undefined;

  const res = await fetch(`${API_HOST}/api/mobile/feed`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      profileId: opts.profileId,
      productId: opts.productId || null,
      type: feedType,
      url: publicUrl,
      thumbnail: carousel ? JSON.stringify(carousel) : publicUrl,
      caption,
      location: opts.location || undefined,
      latitude: opts.latitude,
      longitude: opts.longitude,
      aiLabel: !!opts.aiLabel,
      photoTags: opts.photoTags || [],
      collab: opts.collab || null,
      music: opts.storyOnly ? "STORY_ONLY" : opts.music || undefined,
      mediaUrls: carousel,
    }),
  });

  const data = await res.json();
  if (res.status === 401) {
    throw new Error(data.message || "Session expired. Please sign in again.");
  }
  if (!data.success) {
    throw new Error(data.error || "Could not publish to server.");
  }
  return data.id as string | undefined;
}

async function uploadClips(clips: ClipSegment[]): Promise<{ id: string; url: string; inMs: number; outMs: number }[]> {
  const uploaded: { id: string; url: string; inMs: number; outMs: number }[] = [];
  for (const clip of clips) {
    const url = await uploadMediaFromUri(clip.uri, "reel");
    uploaded.push({ id: clip.id, url, inMs: clip.inMs, outMs: clip.outMs });
  }
  return uploaded;
}

/** Upload local media and publish with Instagram-style semantics per kind. */
export async function uploadAndPublish(
  localUri: string,
  kind: PublishKind,
  opts: PublishOptions
): Promise<PublishResult> {
  return runExportJob<PublishResult>([
    {
      label: "Uploading media…",
      progress: 15,
      run: async () => {
        if (kind === "post" && opts.mediaUrls?.length) {
          return opts.mediaUrls[0];
        }
        if (kind === "reel" && opts.clips && opts.clips.length > 1) {
          return uploadClips(opts.clips);
        }
        const purpose = kind === "reel" ? "reel" : kind === "story" ? "story" : "post";
        return uploadMediaFromUri(localUri, purpose);
      },
    },
    {
      label: kind === "reel" ? "Composing reel…" : "Preparing…",
      progress: 45,
      run: async (prev) => {
        if (kind !== "reel") {
          return { url: String(prev), mediaUrls: opts.mediaUrls };
        }

        const needsCompose =
          (opts.audioTrack?.url) ||
          (opts.filterId && opts.filterId !== "none") ||
          (Array.isArray(prev) && prev.length > 1);

        let videoUrl = typeof prev === "string" ? prev : localUri;

        if (Array.isArray(prev)) {
          if (!needsCompose && prev.length === 1) {
            return { url: prev[0].url, mediaUrls: opts.mediaUrls };
          }
          const composed = await composeReelAdvanced({
            uploadedClipUrls: prev,
            audioUrl: opts.audioTrack?.url,
            audioStartMs: opts.audioTrack?.startMs ?? 0,
            audioVolume: opts.audioTrack?.volume ?? 1,
            filterId: opts.filterId,
            trackId: opts.audioTrack?.trackId,
          });
          return { url: composed.url, mediaUrls: opts.mediaUrls };
        }

        if (needsCompose) {
          const composed = await composeReelAdvanced({
            videoUrl,
            audioUrl: opts.audioTrack?.url,
            audioStartMs: opts.audioTrack?.startMs ?? 0,
            audioVolume: opts.audioTrack?.volume ?? 1,
            filterId: opts.filterId,
            trackId: opts.audioTrack?.trackId,
          });
          return { url: composed.url, mediaUrls: opts.mediaUrls };
        }

        return { url: videoUrl, mediaUrls: opts.mediaUrls };
      },
    },
    {
      label: "Publishing…",
      progress: 80,
      run: async (prev) => {
        const payload = prev as { url: string; mediaUrls?: string[] };
        const url = payload.url;
        const carousel = payload.mediaUrls;
        const isVideo = kind === "reel" || isVideoUrl(url);
        let contentId: string | undefined;

        if (kind === "story") {
          contentId = await postToFeedApi(url, { ...opts, storyOnly: true, isVideo: false });
          if (opts.alsoPostToGrid) {
            await postToFeedApi(url, { ...opts, storyOnly: false, isVideo: false });
          }
        } else {
          contentId = await postToFeedApi(url, { ...opts, storyOnly: false, isVideo, mediaUrls: carousel });
        }

        return { publicUrl: url, contentId, mediaUrls: carousel };
      },
    },
  ]);
}

/** Upload multiple local images for carousel post */
export async function uploadCarouselImages(localUris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of localUris) {
    urls.push(await uploadMediaFromUri(uri, "post"));
  }
  return urls;
}
