/**
 * Layout tokens tuned to match Flipkart "All Categories" reference (Image).
 * Spec doc used larger type; reference uses compact marketplace sizing.
 */
export const CATEGORIES_LAYOUT = {
  /** Reference sidebar ~25% of screen */
  sidebarRatio: 0.25,
  sidebarMinWidth: 96,
  sidebarMaxWidth: 110,
  headerHeight: 56,
  headerPaddingH: 16,
  /** Reference title ~18px bold, not 30px */
  titleSize: 18,
  iconSize: 24,
  iconGap: 20,
  sidebarPadding: 8,
  sidebarBg: "#F0F0F0",
  sidebarDivider: "#E0E0E0",
  contentPadding: 12,
  sectionGap: 20,
  /** Reference section headers ~15px */
  sectionTitleSize: 15,
  sectionTitleMarginBottom: 10,
  categoryItemHeight: 88,
  categoryImageSize: 52,
  categoryImageActive: 56,
  categoryImageRadius: 12,
  categoryLabelSize: 10,
  categoryGap: 4,
  activeBg: "#E8F4FD",
  activeIndicatorWidth: 4,
  cardGap: 8,
  storeCardSize: 110,
  storeCardRadius: 12,
  storeCardBg: "#F5F7FB",
  productImageRadius: 10,
  badgeHeight: 24,
  badgeRadius: 4,
  badgeColor: "#00897B",
  badgeTextSize: 9,
  productNameSize: 11,
  viewAllCircle: 52,
  viewAllBg: "#EEF2FF",
  scrollAnimMs: 350,
} as const;

export function getSidebarWidth(screenW: number): number {
  const pct = Math.round(screenW * CATEGORIES_LAYOUT.sidebarRatio);
  return Math.min(
    CATEGORIES_LAYOUT.sidebarMaxWidth,
    Math.max(CATEGORIES_LAYOUT.sidebarMinWidth, pct)
  );
}

export function getContentWidth(screenW: number): number {
  return screenW - getSidebarWidth(screenW);
}

export function getTripleCardSize(contentInnerW: number): number {
  const { cardGap } = CATEGORIES_LAYOUT;
  const available = contentInnerW - cardGap * 2;
  return Math.floor(available / 3);
}
