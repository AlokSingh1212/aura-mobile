/**
 * Client-side text moderation before outbound user content (DMs, comments).
 * Mirrors server pipeline in ai-marketplace/src/lib/moderation.ts.
 */

const TOXIC_WORDS = [
  "abuse",
  "scam",
  "phishing",
  "hack",
  "cheat",
  "fraud",
  "exploit",
  "spammer",
  "adultContent",
  "drugs",
  "illegal",
  "weapon",
  "kill",
  "violence",
  "threat",
  "harass",
  "hate",
  "racist",
];

const MILD_PROFANITY: Record<string, string> = {
  damn: "d**n",
  crap: "cr*p",
  hell: "h*ll",
};

export type ModerationResult = {
  success: boolean;
  flagged: boolean;
  reason?: string;
  cleanText: string;
};

export function moderateText(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { success: true, flagged: false, cleanText: "" };
  }

  const cleanTextLower = text.toLowerCase().trim();

  for (const word of TOXIC_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(cleanTextLower)) {
      return {
        success: false,
        flagged: true,
        reason: `This message may violate community guidelines (blocked term: "${word}").`,
        cleanText: text,
      };
    }
  }

  const linksRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = cleanTextLower.match(linksRegex);
  if (matches) {
    for (const match of matches) {
      if (
        !match.includes("aura.luxury") &&
        !match.includes("aura.app") &&
        !match.includes("github.com") &&
        !match.includes("unsplash.com")
      ) {
        return {
          success: false,
          flagged: true,
          reason: "External links are not allowed in messages and comments.",
          cleanText: text,
        };
      }
    }
  }

  let cleanText = text;
  for (const [bad, good] of Object.entries(MILD_PROFANITY)) {
    const regex = new RegExp(`\\b${bad}\\b`, "gi");
    cleanText = cleanText.replace(regex, good);
  }

  return {
    success: true,
    flagged: false,
    cleanText,
  };
}

export function validateOutboundText(text: string): {
  ok: boolean;
  error?: string;
  cleanText: string;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty.", cleanText: "" };
  }
  const result = moderateText(trimmed);
  if (!result.success) {
    return { ok: false, error: result.reason || "Content not allowed.", cleanText: trimmed };
  }
  return { ok: true, cleanText: result.cleanText };
}
