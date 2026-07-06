import type { BrandCategory } from "@/constants/brandCategories";
import { productMatchesCategory } from "@/constants/brandCategories";
import {
  PRODUCT_CATEGORIES,
  type ProductCategoryDef,
  type ProductSubcategoryDef,
} from "@/lib/productCategories";

export type ShopSubcategory = {
  id: string;
  label: string;
  productCategoryId: string;
};

/** Brand sidebar categories → product taxonomy used when brands add items. */
const BRAND_TO_PRODUCT_CATEGORY_IDS: Record<BrandCategory, string[]> = {
  Fashion: ["fashion", "footwear"],
  Beauty: ["beauty"],
  Luxury: ["jewelry", "fashion"],
  Jewelry: ["jewelry"],
  Lifestyle: ["home", "other"],
  Food: ["food"],
  Art: ["home", "books"],
  Technology: ["electronics"],
  Health: ["beauty", "other"],
  Travel: ["other", "fashion"],
  Fitness: ["sports"],
  "Home & Decor": ["home"],
};

const FOR_YOU_PRODUCT_CATEGORY_IDS = [
  "fashion",
  "beauty",
  "jewelry",
  "electronics",
  "home",
  "food",
  "sports",
];

const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  tops: ["top", "tee", "shirt", "blouse", "tank", "polo"],
  bottoms: ["pant", "jean", "trouser", "short", "skirt", "legging"],
  dresses: ["dress", "jumpsuit", "gown", "maxi", "midi"],
  outerwear: ["jacket", "coat", "blazer", "vestment", "trench", "hoodie"],
  ethnic: ["kurta", "saree", "lehenga", "ethnic", "traditional"],
  sneakers: ["sneaker", "trainer", "casual shoe"],
  heels: ["heel", "formal shoe", "pump"],
  boots: ["boot"],
  skincare: ["serum", "moistur", "cleanser", "sunscreen", "skincare"],
  makeup: ["lipstick", "foundation", "mascara", "makeup", "blush"],
  haircare: ["shampoo", "conditioner", "hair"],
  fragrance: ["perfume", "fragrance", "cologne", "eau de"],
  necklaces: ["necklace", "pendant", "chain"],
  rings: ["ring", "cuff"],
  earrings: ["earring", "stud", "hoop"],
  watches: ["watch"],
  phones: ["phone", "tablet", "ipad", "iphone"],
  audio: ["headphone", "earbud", "speaker", "audio"],
  laptops: ["laptop", "macbook", "notebook", "computer"],
  furniture: ["sofa", "chair", "table", "bed", "furniture"],
  decor: ["decor", "vase", "lamp", "art", "sculpture", "canvas"],
  kitchen: ["kitchen", "dining", "cookware", "utensil"],
  packaged: ["snack", "packaged", "gourmet", "food"],
  beverages: ["tea", "coffee", "juice", "wine", "beverage"],
  apparel: ["gym", "sport", "yoga", "fitness", "athletic"],
  equipment: ["dumbbell", "equipment", "gear", "mat"],
  books: ["book", "novel", "paperback"],
  general: ["carryall", "bag", "tote", "luggage", "travel"],
};

function subcategoriesForProductCategoryIds(ids: string[]): ShopSubcategory[] {
  const out: ShopSubcategory[] = [];
  for (const id of ids) {
    const cat = PRODUCT_CATEGORIES.find((c) => c.id === id);
    if (!cat) continue;
    for (const sub of cat.subcategories) {
      out.push({
        id: sub.id,
        label: sub.label,
        productCategoryId: cat.id,
      });
    }
  }
  return out;
}

export function getSubcategoriesForShopCategory(
  categoryName: string
): ShopSubcategory[] {
  if (categoryName === "For You") {
    return subcategoriesForProductCategoryIds(FOR_YOU_PRODUCT_CATEGORY_IDS);
  }

  const brand = categoryName as BrandCategory;
  const ids = BRAND_TO_PRODUCT_CATEGORY_IDS[brand];
  if (!ids) return [];
  return subcategoriesForProductCategoryIds(ids);
}

export function getSubcategoryDef(
  productCategoryId: string,
  subcategoryId: string
): ProductSubcategoryDef | undefined {
  const cat = PRODUCT_CATEGORIES.find((c) => c.id === productCategoryId);
  return cat?.subcategories.find((s) => s.id === subcategoryId);
}

export function getProductCategoryDef(
  productCategoryId: string
): ProductCategoryDef | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.id === productCategoryId);
}

export function getProductCategoryId(product: any): string | null {
  const meta = product?.arMetadata || {};
  if (meta.categoryId) return String(meta.categoryId);

  const type = String(product?.type || product?.category || "").toLowerCase();
  const map: Record<string, string> = {
    fashion: "fashion",
    apparel: "fashion",
    clothing: "fashion",
    bags: "fashion",
    beauty: "beauty",
    luxury: "jewelry",
    jewelry: "jewelry",
    jewellery: "jewelry",
    electronics: "electronics",
    technology: "electronics",
    tech: "electronics",
    home: "home",
    food: "food",
    sports: "sports",
    fitness: "sports",
    books: "books",
    art: "home",
    health: "beauty",
    travel: "other",
    lifestyle: "other",
  };

  for (const [key, id] of Object.entries(map)) {
    if (type.includes(key)) return id;
  }
  return null;
}

export function getProductSubcategoryId(product: any): string | null {
  const meta = product?.arMetadata || {};
  if (meta.subcategoryId) return String(meta.subcategoryId);
  if (meta.subcategory) return String(meta.subcategory);
  return null;
}

function titleMatchesSubcategory(title: string, subcategoryId: string): boolean {
  const keywords = SUBCATEGORY_KEYWORDS[subcategoryId];
  if (!keywords?.length) return false;
  const lower = title.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function productMatchesSubcategory(
  product: any,
  sub: ShopSubcategory,
  shopCategoryName?: string
): boolean {
  if (shopCategoryName && shopCategoryName !== "For You") {
    if (!productMatchesCategory(product, shopCategoryName)) return false;
  }

  const metaId = getProductSubcategoryId(product);
  if (metaId) return metaId === sub.id;

  const categoryId = getProductCategoryId(product);
  if (categoryId && categoryId !== sub.productCategoryId) return false;

  const title = String(product?.title || "");
  if (titleMatchesSubcategory(title, sub.id)) return true;

  if (categoryId === sub.productCategoryId && !metaId) {
    return sub.id === "general" || sub.id === "tops";
  }

  return false;
}

export function productsForSubcategory(
  all: any[],
  sub: ShopSubcategory,
  shopCategoryName?: string
): any[] {
  return all.filter((p) => productMatchesSubcategory(p, sub, shopCategoryName));
}

export function findSubcategoryById(
  subcategoryId: string,
  categoryName?: string
): ShopSubcategory | undefined {
  const pool = categoryName
    ? getSubcategoriesForShopCategory(categoryName)
    : PRODUCT_CATEGORIES.flatMap((cat) =>
        cat.subcategories.map((sub) => ({
          id: sub.id,
          label: sub.label,
          productCategoryId: cat.id,
        }))
      );
  return pool.find((s) => s.id === subcategoryId);
}
