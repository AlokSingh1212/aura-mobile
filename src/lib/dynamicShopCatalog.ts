import { SHOP_CATEGORIES, slugFromCategoryName } from "@/constants/brandCategories";
import {
  getProductCategoryId,
  getProductSubcategoryId,
  findSubcategoryById,
} from "@/lib/shopCategoryMap";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";

export type DynamicSubcategory = {
  id: string;
  label: string;
  count: number;
};

export type DynamicCategory = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  tint: string;
  count: number;
  subcategories: DynamicSubcategory[];
};

/** Title-based sub-types for grocery & lifestyle (oils, ghee, etc.) */
const TITLE_SUB_PATTERNS: { id: string; label: string; keywords: string[] }[] = [
  { id: "ghee", label: "Ghee", keywords: ["ghee", "clarified butter"] },
  { id: "mustard-oil", label: "Mustard Oil", keywords: ["mustard oil"] },
  { id: "sunflower-oil", label: "Sunflower Oil", keywords: ["sunflower oil"] },
  { id: "olive-oil", label: "Olive Oil", keywords: ["olive oil"] },
  { id: "coconut-oil", label: "Coconut Oil", keywords: ["coconut oil"] },
  { id: "groundnut-oil", label: "Groundnut Oil", keywords: ["groundnut oil", "peanut oil"] },
  { id: "sesame-oil", label: "Sesame Oil", keywords: ["sesame oil"] },
  { id: "cooking-oil", label: "Cooking Oil", keywords: [" cooking oil", "refined oil", " edible oil"] },
  { id: "rice", label: "Rice", keywords: [" basmati", " rice", "rice "] },
  { id: "dal", label: "Dal & Pulses", keywords: [" dal", " lentil", " pulse", "moong", "toor", "chana"] },
  { id: "atta", label: "Atta & Flour", keywords: [" atta", " flour", "wheat flour", "maida"] },
  { id: "milk", label: "Milk", keywords: [" milk", "dairy milk"] },
  { id: "bread", label: "Bread", keywords: [" bread", "bun", "pav"] },
  { id: "snacks", label: "Snacks", keywords: [" snack", "chips", "namkeen", "biscuit"] },
  { id: "tea", label: "Tea", keywords: [" tea", "chai"] },
  { id: "coffee", label: "Coffee", keywords: [" coffee"] },
  { id: "skincare", label: "Skincare", keywords: [" serum", "moistur", "cleanser", "sunscreen"] },
  { id: "makeup", label: "Makeup", keywords: [" lipstick", "foundation", "mascara", "kajal"] },
  { id: "phones", label: "Phones", keywords: [" iphone", " phone", "smartphone", "mobile"] },
  { id: "laptops", label: "Laptops", keywords: [" laptop", "macbook", "notebook"] },
  { id: "headphones", label: "Audio", keywords: [" headphone", "earbud", "speaker"] },
  { id: "sneakers", label: "Sneakers", keywords: [" sneaker", " trainer"] },
  { id: "watches", label: "Watches", keywords: [" watch"] },
  { id: "general", label: "More", keywords: [] },
];

const CATEGORY_ICONS: Record<string, { icon: string; tint: string }> = {
  "for-you": { icon: "bag-handle", tint: "#EDE7F6" },
  food: { icon: "restaurant", tint: "#FFEBEE" },
  fashion: { icon: "shirt", tint: "#FCE4EC" },
  beauty: { icon: "flower", tint: "#FFF8E1" },
  luxury: { icon: "diamond", tint: "#EDE7F6" },
  jewelry: { icon: "watch", tint: "#FFF3E0" },
  lifestyle: { icon: "heart", tint: "#E8F5E9" },
  art: { icon: "color-palette", tint: "#F3E5F5" },
  technology: { icon: "laptop", tint: "#E3F2FD" },
  health: { icon: "medkit", tint: "#E0F2F1" },
  travel: { icon: "airplane", tint: "#E1F5FE" },
  fitness: { icon: "barbell", tint: "#F1F8E9" },
  "home-and-decor": { icon: "home", tint: "#E0F7FA" },
  electronics: { icon: "hardware-chip", tint: "#E8EAF6" },
  sports: { icon: "football", tint: "#F1F8E9" },
  home: { icon: "home", tint: "#E0F7FA" },
  other: { icon: "grid", tint: "#ECEFF1" },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferSubFromTitle(title: string): { id: string; label: string } | null {
  const lower = ` ${title.toLowerCase()} `;
  for (const row of TITLE_SUB_PATTERNS) {
    if (row.id === "general") continue;
    if (row.keywords.some((k) => lower.includes(k))) {
      return { id: row.id, label: row.label };
    }
  }
  return null;
}

export function getProductMainCategoryLabel(product: any): string {
  const meta = product?.arMetadata || {};
  if (meta.shopCategory) return String(meta.shopCategory).trim();

  const raw = String(
    product?.type || product?.category || product?.artifactType || ""
  ).trim();
  if (raw) return raw;

  const catId = getProductCategoryId(product);
  if (catId) {
    const def = PRODUCT_CATEGORIES.find((c) => c.id === catId);
    if (def) return def.label;
  }

  return "General";
}

export function getProductSubcategory(product: any, mainLabel?: string): DynamicSubcategory {
  const meta = product?.arMetadata || {};
  if (meta.subcategoryLabel) {
    const label = String(meta.subcategoryLabel).trim();
    return { id: slugify(label), label, count: 0 };
  }

  const subId = getProductSubcategoryId(product);
  if (subId) {
    const def = findSubcategoryById(subId, mainLabel);
    if (def) return { id: def.id, label: def.label, count: 0 };
  }

  const titleHit = inferSubFromTitle(String(product?.title || ""));
  if (titleHit) return { ...titleHit, count: 0 };

  const catId = getProductCategoryId(product);
  if (catId) {
    const def = PRODUCT_CATEGORIES.find((c) => c.id === catId);
    const first = def?.subcategories?.[0];
    if (first) return { id: first.id, label: first.label, count: 0 };
  }

  return { id: "general", label: "All", count: 0 };
}

function iconForSlug(slug: string) {
  return CATEGORY_ICONS[slug] || CATEGORY_ICONS.other;
}

export function buildDynamicShopCatalog(products: any[]): DynamicCategory[] {
  const rootMap = new Map<
    string,
    { label: string; slug: string; subs: Map<string, DynamicSubcategory>; count: number }
  >();

  const ensureRoot = (label: string) => {
    const slug =
      SHOP_CATEGORIES.find((c) => c.name.toLowerCase() === label.toLowerCase())?.slug ||
      slugFromCategoryName(label);
    const key = slug;
    if (!rootMap.has(key)) {
      rootMap.set(key, { label, slug, subs: new Map(), count: 0 });
    }
    return rootMap.get(key)!;
  };

  for (const product of products) {
    const mainLabel = getProductMainCategoryLabel(product);
    const root = ensureRoot(mainLabel);
    root.count += 1;

    const sub = getProductSubcategory(product, mainLabel);
    const existing = root.subs.get(sub.id);
    if (existing) existing.count += 1;
    else root.subs.set(sub.id, { ...sub, count: 1 });
  }

  const dynamic: DynamicCategory[] = [
    {
      id: "for-you",
      slug: "for-you",
      label: "For You",
      ...iconForSlug("for-you"),
      count: products.length,
      subcategories: [{ id: "all", label: "All", count: products.length }],
    },
  ];

  const sortedRoots = [...rootMap.values()].sort((a, b) => b.count - a.count);
  for (const root of sortedRoots) {
    const meta = iconForSlug(root.slug);
    const subs = [...root.subs.values()].sort((a, b) => b.count - a.count);
    if (subs.length === 0) subs.push({ id: "all", label: "All", count: root.count });
    dynamic.push({
      id: root.slug,
      slug: root.slug,
      label: root.label,
      icon: meta.icon,
      tint: meta.tint,
      count: root.count,
      subcategories: subs,
    });
  }

  return dynamic;
}

export function filterProductsByDynamicCategory(
  products: any[],
  categorySlug: string,
  subcategoryId?: string
): any[] {
  if (categorySlug === "for-you" && (!subcategoryId || subcategoryId === "all")) {
    return products;
  }

  let list = products.filter((p) => {
    const label = getProductMainCategoryLabel(p);
    const slug = slugFromCategoryName(label);
    return slug === categorySlug || label.toLowerCase() === categorySlug.replace(/-/g, " ");
  });

  if (subcategoryId && subcategoryId !== "all") {
    list = list.filter((p) => getProductSubcategory(p).id === subcategoryId);
  }

  return list;
}

export function resolveCategoryFromProduct(product: any, catalog: DynamicCategory[]) {
  const mainLabel = getProductMainCategoryLabel(product);
  const slug = slugFromCategoryName(mainLabel);
  const sub = getProductSubcategory(product, mainLabel);
  const category =
    catalog.find((c) => c.slug === slug) ||
    catalog.find((c) => c.label.toLowerCase() === mainLabel.toLowerCase()) ||
    catalog[0];
  return { categorySlug: category.slug, subcategoryId: sub.id };
}

export function getHorizontalChipCategories(catalog: DynamicCategory[]): DynamicCategory[] {
  return catalog.filter((c) => c.slug !== "for-you" || c.count > 0).slice(0, 12);
}
