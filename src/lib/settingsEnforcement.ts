import type { EcosystemSettings } from "@/lib/ecosystemSettings";
import { DEFAULT_ECOSYSTEM_SETTINGS } from "@/lib/ecosystemSettings";

export type NotificationCategory =
  | "orderUpdates"
  | "priceDrops"
  | "newArrivals"
  | "liveShows"
  | "messages"
  | "posts"
  | "stories"
  | "reels"
  | "mentions"
  | "emailDigest";

const SENSITIVE_KEYWORDS = [
  "explicit",
  "nsfw",
  "violence",
  "gore",
  "nude",
  "adult",
  "18+",
  "disturbing",
];

const POLITICAL_KEYWORDS = [
  "election",
  "politic",
  "campaign",
  "vote",
  "government",
  "protest",
  "parliament",
  "minister",
];

let settings: EcosystemSettings | null = null;
let sessionMinutesToday = 0;
let sessionDayKey = "";

const listeners = new Set<() => void>();

export function subscribeSettingsEnforcement(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySettingsEnforcementChanged() {
  listeners.forEach((fn) => fn());
}

export function setEnforcedSettings(
  next: EcosystemSettings,
  options?: { notify?: boolean }
) {
  settings = next;
  if (options?.notify !== false) {
    notifySettingsEnforcementChanged();
  }
}

export function getEnforcedSettings(): EcosystemSettings | null {
  return settings;
}

function getSettings(): EcosystemSettings {
  return settings ?? DEFAULT_ECOSYSTEM_SETTINGS;
}

function s(): EcosystemSettings {
  return getSettings();
}

function parseHour(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const match = value.match(/(\d{1,2})/);
  return match ? Number(match[1]) : fallback;
}

function isWithinQuietHours(now = new Date()) {
  const t = s().time;
  if (!t.quietHoursEnabled) return false;
  const start = parseHour(t.quietStart, 22);
  const end = parseHour(t.quietEnd, 8);
  const hour = now.getHours();
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function shouldDeliverPushNotification(category?: NotificationCategory) {
  const n = s().notifications;
  if (!n.pushEnabled) return false;
  if (isWithinQuietHours()) return false;
  if (!category) return true;
  if (category === "emailDigest") return n.emailDigest;
  return n[category] !== false;
}

export function shouldSendSms(category: NotificationCategory) {
  const n = s().notifications;
  if (!n.smsEnabled) return false;
  return category === "orderUpdates" && n.orderUpdates !== false;
}

export function shouldShowActivityStatus() {
  return s().privacy.showActivityStatus !== false;
}

export function shouldShowOnlineStatus() {
  return s().messages.showOnlineStatus !== false && shouldShowActivityStatus();
}

export function shouldShowReadReceipts() {
  return s().messages.showReadReceipts !== false;
}

export function shouldShowFollowersList() {
  return s().privacy.showFollowersList !== false;
}

export function shouldSuggestAccount() {
  return s().privacy.suggestAccountToOthers !== false;
}

export function isPersonalizedAdsEnabled() {
  return s().privacy.personalizedAds !== false;
}

export function allowStorySharing() {
  return s().privacy.allowStorySharing !== false;
}

export function showShopActivity() {
  return s().privacy.showShopActivity === true;
}

export function canReceiveDm(from: {
  profileId?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
}): boolean {
  const rule = s().messages.dmFrom;
  if (rule === "none") return false;
  if (rule === "everyone") return true;
  if (rule === "following") {
    return from.isFollowing === true || from.isFollower === true;
  }
  return true;
}

export function canReplyToStory(from: { isFollowing?: boolean }) {
  const rule = s().messages.storyRepliesFrom;
  if (rule === "off") return false;
  if (rule === "everyone") return true;
  return from.isFollowing === true;
}

export function canTagActor(from: { isFollowing?: boolean }) {
  const rule = s().tags.allowTagsFrom;
  if (rule === "none") return false;
  if (rule === "everyone") return true;
  return from.isFollowing === true;
}

export function canMentionActor(from: { isFollowing?: boolean }) {
  const rule = s().tags.allowMentionsFrom;
  if (rule === "none") return false;
  if (rule === "everyone") return true;
  return from.isFollowing === true;
}

export function requiresTagApproval() {
  return s().tags.manualTagApproval === true;
}

export function allowTaggingOnProfile() {
  return s().privacy.allowTagging !== false;
}

function textBlob(item: any): string {
  return [
    item?.caption,
    item?.title,
    item?.description,
    item?.content?.caption,
    item?.content?.text,
    item?.vibe,
    item?.tags?.join?.(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesMutedWords(text: string) {
  const words = s().content.mutedWords || [];
  const lower = text.toLowerCase();
  return words.some((w) => w && lower.includes(w.toLowerCase()));
}

function sensitivityScore(text: string): number {
  let score = 0;
  for (const kw of SENSITIVE_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  if (itemFlaggedSensitive(text)) score += 2;
  return score;
}

function itemFlaggedSensitive(text: string) {
  return text.includes("[sensitive]") || text.includes("sensitive_content");
}

function politicalScore(text: string): number {
  let score = 0;
  for (const kw of POLITICAL_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  return score;
}

export function shouldShowContentItem(item: any): boolean {
  const c = s().content;
  const text = textBlob(item);

  if (matchesMutedWords(text)) return false;

  const sens = sensitivityScore(text);
  if (c.sensitiveContent === "less" && sens >= 1) return false;
  if (c.sensitiveContent === "standard" && sens >= 3) return false;

  const pol = politicalScore(text);
  if (c.politicalContent === "reduce" && pol >= 1) return false;

  const isShop =
    item?.type === "CREATOR_COMMERCE" ||
    item?.isProduct === true ||
    item?.artifactId ||
    item?.productId;
  const isLive = item?.type === "LIVE" || item?.isLive === true;

  if (isShop && !c.shopRecommendations) return false;
  if (isLive && !c.liveRecommendations) return false;

  return true;
}

export function filterContentItems<T>(items: T[]): T[] {
  if (!settings) return items;
  return items.filter((item) => shouldShowContentItem(item));
}

export function getAccessibilityTokens() {
  const a = s().accessibility;
  return {
    reduceMotion: a.reduceMotion === true,
    highContrast: a.highContrast === true,
    largerText: a.largerText === true,
    autoCaptions: a.autoCaptions !== false,
    screenReaderHints: a.screenReaderHints !== false,
    fontScale: a.largerText ? 1.15 : 1,
  };
}

export function shouldUploadOnWifiOnly() {
  return s().creator.uploadOnWifiOnly === true;
}

export function useHighQualityUpload() {
  return s().creator.highQualityUpload !== false;
}

export function isStoreVacationMode() {
  return s().store?.vacationMode === true;
}

export function getStoreVacationMessage() {
  return s().store?.vacationMessage || "Our shop is temporarily closed. Check back soon.";
}

export function shouldShowInventoryCount() {
  return s().store?.showInventoryCount !== false;
}

export function getDailyLimitMinutes() {
  return s().time.dailyLimitMinutes || 60;
}

export function isDailyLimitEnabled() {
  return s().time.limitEnabled === true;
}

export function setSessionUsageMinutes(minutes: number, dayKey: string) {
  sessionMinutesToday = minutes;
  sessionDayKey = dayKey;
}

export function getSessionUsageMinutes() {
  return { minutes: sessionMinutesToday, dayKey: sessionDayKey };
}

export function isDailyLimitReached(extraMinutes = 0) {
  if (!isDailyLimitEnabled()) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (sessionDayKey !== today) return false;
  return sessionMinutesToday + extraMinutes >= getDailyLimitMinutes();
}

export function mapFeedItemToNotificationCategory(item: any): NotificationCategory | null {
  if (item?.type === "LIVE" || item?.isLive) return "liveShows";
  if (item?.content?.videoUrl || item?.isVideo) return "reels";
  if (item?.isStory) return "stories";
  if (item?.mention) return "mentions";
  return "posts";
}
