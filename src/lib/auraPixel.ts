/**
 * AURAGRAM native pixel SDK — fires standard events to AURA Pixel API.
 */
import { API_HOST } from "@/constants/api";

export type AuraTrackEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Search"
  | "AddToWishlist";

let cachedPixelId: string | null = null;
let consentGranted = true;

export function setAuraPixelConsent(granted: boolean) {
  consentGranted = granted;
}

export function setAuraPixelId(pixelId: string | null) {
  cachedPixelId = pixelId;
}

function generateEventId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function loadAuraPixelConfig(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_HOST}/api/mobile/pixel/config?userId=${userId}`);
    const data = await res.json();
    if (data.success && data.enabled && data.pixelId) {
      cachedPixelId = data.pixelId;
      return data.pixelId;
    }
  } catch (err) {
    console.warn("[AuraPixel] Config load failed:", err);
  }
  return null;
}

export async function trackAuraEvent(
  eventName: AuraTrackEvent,
  options: {
    userId?: string;
    contentId?: string;
    sku?: string;
    val?: number;
    currency?: string;
    pixelId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  if (!consentGranted) return;

  const pixelId = options.pixelId || cachedPixelId;
  if (!pixelId) return;

  const eventId = generateEventId();

  try {
    await fetch(`${API_HOST}/api/v1/pixel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pixelId,
        eventName,
        eventId,
        userId: options.userId || null,
        contentId: options.contentId || options.sku || null,
        sku: options.sku || null,
        val: options.val ?? null,
        currency: options.currency || "USD",
        consentGranted: true,
        platform: "APP",
        customData: options.metadata,
      }),
    });
  } catch (err) {
    console.warn(`[AuraPixel] ${eventName} track failed:`, err);
  }
}

export const AuraPixel = {
  loadConfig: loadAuraPixelConfig,
  setConsent: setAuraPixelConsent,
  setPixelId: setAuraPixelId,
  track: trackAuraEvent,
  viewContent: (opts: Parameters<typeof trackAuraEvent>[1]) =>
    trackAuraEvent("ViewContent", opts),
  addToCart: (opts: Parameters<typeof trackAuraEvent>[1]) =>
    trackAuraEvent("AddToCart", opts),
  initiateCheckout: (opts: Parameters<typeof trackAuraEvent>[1]) =>
    trackAuraEvent("InitiateCheckout", opts),
  purchase: (opts: Parameters<typeof trackAuraEvent>[1]) =>
    trackAuraEvent("Purchase", opts),
};
