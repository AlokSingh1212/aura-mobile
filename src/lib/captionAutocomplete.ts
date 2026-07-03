export type CaptionTokenType = "hashtag" | "mention";

export interface CaptionToken {
  type: CaptionTokenType;
  query: string;
  start: number;
  end: number;
}

/** Active # or @ token at the cursor (Instagram-style). */
export function getActiveCaptionToken(text: string, cursor: number): CaptionToken | null {
  const upto = text.slice(0, cursor);
  let i = upto.length - 1;
  while (i >= 0 && /[\w.]/.test(upto[i])) i--;
  if (i < 0 || (upto[i] !== "#" && upto[i] !== "@")) return null;
  if (i > 0 && !/\s/.test(upto[i - 1])) return null;
  const trigger = upto[i];
  const query = upto.slice(i + 1);
  return {
    type: trigger === "#" ? "hashtag" : "mention",
    query,
    start: i,
    end: cursor,
  };
}

export function applyCaptionSuggestion(
  text: string,
  token: CaptionToken,
  value: string
): { text: string; cursor: number } {
  const before = text.slice(0, token.start);
  const after = text.slice(token.end);
  const clean = value.replace(/^[@#]/, "");
  const insertion = token.type === "hashtag" ? `#${clean} ` : `@${clean} `;
  const newText = before + insertion + after;
  return { text: newText, cursor: before.length + insertion.length };
}

export type CaptionSegment =
  | { kind: "text"; value: string }
  | { kind: "hashtag"; value: string }
  | { kind: "mention"; value: string };

export function segmentCaptionForInput(caption: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const re = /(#([\w\u00C0-\u024F\u0900-\u097F]+)|@([\w.]+))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(caption)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: caption.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith("#")) {
      segments.push({ kind: "hashtag", value: match[0] });
    } else {
      segments.push({ kind: "mention", value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < caption.length) {
    segments.push({ kind: "text", value: caption.slice(lastIndex) });
  }

  return segments.length ? segments : [{ kind: "text", value: caption }];
}
