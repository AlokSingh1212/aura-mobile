/** Instagram-style username rules: 3–30 chars, lowercase letters, numbers, . _ - */
export function normalizeProfileUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+/, "")
    .slice(0, 30);
}

export function validateProfileUsername(username: string): string | null {
  if (!username) return "Username is required.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 30) return "Username must be 30 characters or less.";
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(username)) {
    return "Use lowercase letters, numbers, periods, underscores, or hyphens.";
  }
  if (/[._-]{2,}/.test(username)) return "Username cannot have consecutive special characters.";
  return null;
}

export { BRAND_CATEGORIES } from "@/constants/brandCategories";
export type { BrandCategory } from "@/constants/brandCategories";

export const MAX_PROFILES_PER_ACCOUNT = 5;
