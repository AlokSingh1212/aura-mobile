/** Shared username normalization — keep free of store/navigation imports. */
export function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/\s+/g, "_")
    .replace(/['']/g, "");
}
