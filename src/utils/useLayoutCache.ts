import { useCallback } from "react";
import { getCachedLayoutHeight, cacheLayoutHeight } from "./localDb";

/**
 * Dynamic Layout Calculation & SQLite Cell Height Caching.
 * Pre-computes cell heights on background dataset shifts and persists them to SQLite,
 * avoiding layout frame drops and JS-to-Native bridge thrashing during fast scroll viewport changes.
 */
export function useLayoutCache() {
  const getLayoutHeight = useCallback((itemId: string, text: string, imageRatio: number): number => {
    // 1. Query SQLite layout height cache first
    const cachedHeight = getCachedLayoutHeight(itemId);
    if (cachedHeight !== null) {
      return cachedHeight;
    }

    // 2. Perform layout measurement calculation
    const baseElementHeights = 120; // Header avatar bar (60px) + Engagement icon bar (45px) + paddings
    
    // Viewport width media scaling
    const containerWidth = 390; // Standard mobile viewport reference width
    const mediaHeight = containerWidth / (imageRatio || 1);

    // Approximate text wrapping lines height
    const charCount = text ? text.length : 0;
    const lines = Math.max(1, Math.ceil(charCount / 42)); // 42 characters average per line
    const textLineHeight = lines * 18; // 18px line height

    const calculatedHeight = baseElementHeights + mediaHeight + textLineHeight;

    // 3. Cache height calculation in local database
    cacheLayoutHeight(itemId, calculatedHeight);
    
    return calculatedHeight;
  }, []);

  return { getLayoutHeight };
}
