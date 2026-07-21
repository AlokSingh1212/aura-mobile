import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type PollStats = {
  option0: number;
  option1: number;
  total: number;
  userVote: 0 | 1 | null;
};

export async function fetchStoryPollStats(
  storyId: string,
  stickerId: string,
  userId: string
): Promise<PollStats> {
  const params = new URLSearchParams({
    storyId,
    stickerId,
    userId,
    type: "poll",
  });
  const res = await fetch(`${API_HOST}/api/mobile/stories/interact?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) {
    return { option0: 0, option1: 0, total: 0, userVote: null };
  }
  return data.stats as PollStats;
}

export async function voteStoryPoll(opts: {
  storyId: string;
  stickerId: string;
  userId: string;
  optionIndex: 0 | 1;
  question?: string;
}): Promise<PollStats | null> {
  const res = await fetch(`${API_HOST}/api/mobile/stories/interact`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      storyId: opts.storyId,
      stickerId: opts.stickerId,
      userId: opts.userId,
      action: "poll_vote",
      optionIndex: opts.optionIndex,
      question: opts.question,
    }),
  });
  const data = await res.json();
  if (!data.success) return null;
  return data.stats as PollStats;
}

export async function logStoryLinkOpen(opts: {
  storyId: string;
  stickerId: string;
  userId: string;
  url: string;
}): Promise<void> {
  await fetch(`${API_HOST}/api/mobile/stories/interact`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      storyId: opts.storyId,
      stickerId: opts.stickerId,
      userId: opts.userId,
      action: "link_open",
      url: opts.url,
    }),
  }).catch(() => {});
}

export type EmojiSliderStats = {
  average: number;
  total: number;
  userValue: number | null;
};

export async function fetchEmojiSliderStats(
  storyId: string,
  stickerId: string,
  userId: string
): Promise<EmojiSliderStats> {
  const params = new URLSearchParams({
    storyId,
    stickerId,
    userId,
    type: "emoji_slider",
  });
  const res = await fetch(`${API_HOST}/api/mobile/stories/interact?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) {
    return { average: 0, total: 0, userValue: null };
  }
  return data.stats as EmojiSliderStats;
}

export async function submitEmojiSliderVote(opts: {
  storyId: string;
  stickerId: string;
  userId: string;
  value: number;
  emoji?: string;
}): Promise<EmojiSliderStats | null> {
  const res = await fetch(`${API_HOST}/api/mobile/stories/interact`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      storyId: opts.storyId,
      stickerId: opts.stickerId,
      userId: opts.userId,
      action: "emoji_slider_vote",
      value: opts.value,
      emoji: opts.emoji,
    }),
  });
  const data = await res.json();
  if (!data.success) return null;
  return data.stats as EmojiSliderStats;
}
