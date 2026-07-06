/**
 * Canonical categories for brand profiles and the Products shop sidebar.
 * Keep in sync: CreateBrandProfileSheet + shop hub + product filtering.
 */
export const BRAND_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Luxury",
  "Jewelry",
  "Lifestyle",
  "Food",
  "Art",
  "Technology",
  "Health",
  "Travel",
  "Fitness",
  "Home & Decor",
] as const;

export type BrandCategory = (typeof BRAND_CATEGORIES)[number];

export type ShopCategory = {
  slug: string;
  name: string;
  icon: string;
  tint: string;
  /** Matches BRAND_CATEGORIES entry; undefined for hub-only rows like For You */
  brandCategory?: BrandCategory;
};

const BRAND_CATEGORY_META: Record<
  BrandCategory,
  { icon: string; tint: string; slug: string }
> = {
  Fashion: { icon: "shirt", tint: "#FCE4EC", slug: "fashion" },
  Beauty: { icon: "flower", tint: "#FFF8E1", slug: "beauty" },
  Luxury: { icon: "diamond", tint: "#EDE7F6", slug: "luxury" },
  Jewelry: { icon: "watch", tint: "#FFF3E0", slug: "jewelry" },
  Lifestyle: { icon: "heart", tint: "#E8F5E9", slug: "lifestyle" },
  Food: { icon: "restaurant", tint: "#FFEBEE", slug: "food" },
  Art: { icon: "color-palette", tint: "#F3E5F5", slug: "art" },
  Technology: { icon: "laptop", tint: "#E3F2FD", slug: "technology" },
  Health: { icon: "medkit", tint: "#E0F2F1", slug: "health" },
  Travel: { icon: "airplane", tint: "#E1F5FE", slug: "travel" },
  Fitness: { icon: "barbell", tint: "#F1F8E9", slug: "fitness" },
  "Home & Decor": { icon: "home", tint: "#E0F7FA", slug: "home-and-decor" },
};

/** Shop sidebar: For You + every brand profile category */
export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    slug: "for-you",
    name: "For You",
    icon: "bag-handle",
    tint: "#EDE7F6",
  },
  ...BRAND_CATEGORIES.map((name) => {
    const meta = BRAND_CATEGORY_META[name];
    return {
      slug: meta.slug,
      name,
      icon: meta.icon,
      tint: meta.tint,
      brandCategory: name,
    };
  }),
];

export const POPULAR_STORES = [
  {
    id: "aura-drop",
    title: "AURA DROP",
    subtitle: "Live now",
    colors: ["#2D2D2D", "#1A1A2E"] as const,
    accent: "#00f5ff",
  },
  {
    id: "aura-minutes",
    title: "Get in Mins",
    subtitle: "AURA Minutes",
    colors: ["#1565C0", "#0D47A1"] as const,
    accent: "#FFFFFF",
  },
  {
    id: "style-fest",
    title: "STYLE FEST",
    subtitle: "Sale coming soon!",
    colors: ["#F9A825", "#F57F17"] as const,
    accent: "#FFFFFF",
  },
];

/** AURA discovery tiles — not third-party marketplace brands */
export const AURA_DISCOVERY_TILES = [
  { id: "live", label: "Live Shows", bg: "#6C3FC5", short: "Live" },
  { id: "maison", label: "Maison", bg: "#1A1A2E", short: "M" },
  { id: "reels", label: "Shop Reels", bg: "#00897B", short: "Reel" },
] as const;

export function categoryFromSlug(slug: string): ShopCategory | undefined {
  return SHOP_CATEGORIES.find((c) => c.slug === slug);
}

export function slugFromCategoryName(name: string): string {
  const found = SHOP_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (found) return found.slug;
  return name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
}

/** Match products to a shop sidebar category (brand type / category field). */
export function productMatchesCategory(product: any, categoryName: string): boolean {
  if (categoryName === "For You") return true;

  const productCat = String(product.type || product.category || "Fashion").trim();
  if (productCat.toLowerCase() === categoryName.toLowerCase()) return true;

  const aliases: Record<string, string[]> = {
    Fashion: ["fashion", "apparel", "clothing", "bags"],
    Beauty: ["beauty", "care", "cosmetic", "skincare"],
    Luxury: ["luxury", "premium", "designer"],
    Jewelry: ["jewelry", "jewellery", "accessories"],
    Lifestyle: ["lifestyle", "living"],
    Food: ["food", "gourmet", "beverage"],
    Art: ["art", "collectible", "gallery"],
    Technology: ["technology", "tech", "electronics", "gadget", "mobile"],
    Health: ["health", "wellness", "medical"],
    Travel: ["travel", "luggage"],
    Fitness: ["fitness", "sports", "athletic"],
    "Home & Decor": ["home", "decor", "furniture", "interior"],
  };

  const keys = aliases[categoryName as BrandCategory];
  if (!keys) return productCat.toLowerCase().includes(categoryName.toLowerCase().split(" ")[0]);

  const normalized = productCat.toLowerCase();
  return keys.some((k) => normalized.includes(k));
}

export function productsForShopCategory(all: any[], categoryName: string): any[] {
  return all.filter((p) => productMatchesCategory(p, categoryName));
}
