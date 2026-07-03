import AsyncStorage from "@react-native-async-storage/async-storage";

export type CreateKind = "reel" | "post" | "story";

export type StickerLayer = {
  id: string;
  type: "text" | "emoji" | "mention";
  text: string;
  x: number;
  y: number;
  scale: number;
  color?: string;
};

export type ClipSegment = {
  id: string;
  uri: string;
  inMs: number;
  outMs: number;
};

export type AudioTrackMeta = {
  trackId: string;
  url: string;
  title?: string;
  startMs: number;
  volume: number;
};

export type CreateDraft = {
  id: string;
  kind: CreateKind;
  clips: ClipSegment[];
  stickers: StickerLayer[];
  audio?: AudioTrackMeta;
  filterId?: string;
  caption?: string;
  step: "pick" | "edit" | "preview" | "share";
  status: "draft" | "exporting" | "uploading" | "published";
  updatedAt: string;
};

const STORAGE_KEY = "@aura/create_drafts_v1";

function newId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyDraft(kind: CreateKind): CreateDraft {
  return {
    id: newId(),
    kind,
    clips: [],
    stickers: [],
    step: "pick",
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

async function readAll(): Promise<CreateDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(drafts: CreateDraft[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.slice(0, 20)));
}

export async function saveDraft(draft: CreateDraft): Promise<CreateDraft> {
  const drafts = await readAll();
  const next = { ...draft, updatedAt: new Date().toISOString() };
  const idx = drafts.findIndex((d) => d.id === next.id);
  if (idx >= 0) drafts[idx] = next;
  else drafts.unshift(next);
  await writeAll(drafts);
  return next;
}

export async function loadDraft(id: string): Promise<CreateDraft | null> {
  const drafts = await readAll();
  return drafts.find((d) => d.id === id) ?? null;
}

export async function listDrafts(kind?: CreateKind): Promise<CreateDraft[]> {
  const drafts = await readAll();
  return kind ? drafts.filter((d) => d.kind === kind) : drafts;
}

export async function deleteDraft(id: string): Promise<void> {
  const drafts = await readAll();
  await writeAll(drafts.filter((d) => d.id !== id));
}

export async function upsertDraftClip(
  draftId: string,
  clip: ClipSegment
): Promise<CreateDraft | null> {
  const draft = await loadDraft(draftId);
  if (!draft) return null;
  const clips = [...draft.clips.filter((c) => c.id !== clip.id), clip];
  return saveDraft({ ...draft, clips });
}
