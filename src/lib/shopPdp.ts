import {
  getProductCategoryId,
  getProductSubcategoryId,
  productMatchesSubcategory,
  findSubcategoryById,
} from "@/lib/shopCategoryMap";
import { productMatchesCategory, slugFromCategoryName } from "@/constants/brandCategories";
import { getBankOfferPrice, getEmiPerMonth } from "@/lib/shopPricing";

export type CategorySectionMeta = {
  title: string;
  slug: string;
  subcategoryId?: string;
};

export type BankOffer = {
  id: string;
  bankName: string;
  discountPercent: number;
  discountAmount: number;
  isBest?: boolean;
};

export type DeliveryEstimate = {
  serviceable: boolean;
  label: string;
  minDays: number;
  maxDays: number;
};

export type ProductHighlight = {
  label: string;
  value: string;
};

export type ProductReviewItem = {
  id: string;
  rating: number;
  title?: string;
  body: string;
  author: string;
  createdAt?: string;
};

const BANK_TEMPLATES = [
  { id: "axis", bankName: "Axis Bank", pct: 8 },
  { id: "paytm", bankName: "Paytm UPI", pct: 5 },
  { id: "icici", bankName: "ICICI Bank", pct: 6 },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDeliveryDay(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}, ${DAY_NAMES[date.getDay()]}`;
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function getBankOffers(product: any): BankOffer[] {
  const price = product?.price ?? 0;
  if (price < 500) return [];

  if (Array.isArray(product?.activeBankOffers) && product.activeBankOffers.length > 0) {
    const offers: BankOffer[] = product.activeBankOffers.map((o: any) => {
      const isPct = String(o.type).toUpperCase() === "PERCENTAGE";
      const pct = isPct ? Number(o.discount) : Math.round((Number(o.discount) / Math.max(1, price)) * 100);
      const amt = isPct ? Math.round(price * (Number(o.discount) / 100)) : Math.round(Number(o.discount));
      const rawCode = String(o.code || "").toUpperCase();
      const bankName = rawCode.includes("BANK") || rawCode.includes("UPI") ? rawCode : `${rawCode} Bank`;
      
      return {
        id: o.id || String(o.code).toLowerCase(),
        bankName,
        discountPercent: pct,
        discountAmount: amt,
      };
    }).sort((a: any, b: any) => b.discountAmount - a.discountAmount);

    if (offers[0]) offers[0].isBest = true;
    return offers;
  }

  return [];
}

export function priceAfterBankOffer(price: number, offer?: BankOffer | null): number {
  if (!offer) return price;
  return Math.max(1, price - offer.discountAmount);
}

export function getEffectivePdpPrice(
  product: any,
  appliedBankOffer?: BankOffer | null,
  appliedCoupon?: { type?: string; discount?: number } | null
): number {
  let price = product?.price ?? 0;
  if (appliedBankOffer) {
    price = priceAfterBankOffer(price, appliedBankOffer);
  } else {
    price = getBankOfferPrice(product);
  }

  if (appliedCoupon?.discount) {
    if (appliedCoupon.type === "PERCENTAGE") {
      price = Math.max(1, price - price * (appliedCoupon.discount / 100));
    } else {
      price = Math.max(1, price - Math.min(appliedCoupon.discount, price));
    }
  }
  return Math.round(price);
}

export function getEmiBreakdown(price: number, months = 36) {
  const monthly = getEmiPerMonth(price, months);
  const total = monthly * months;
  return { monthly, months, total };
}

export function estimateDelivery(
  postalCode?: string,
  opts?: { express?: boolean; inStock?: boolean }
): DeliveryEstimate {
  const pin = String(postalCode || "").replace(/\D/g, "");
  const express = opts?.express ?? false;
  const inStock = opts?.inStock ?? true;

  if (pin.length < 6) {
    return {
      serviceable: false,
      label: "Enter pincode to check delivery",
      minDays: 0,
      maxDays: 0,
    };
  }

  const regionDigit = parseInt(pin.charAt(0), 10);
  const serviceable = regionDigit >= 1 && regionDigit <= 9;

  if (!serviceable) {
    return {
      serviceable: false,
      label: "Delivery not available to this pincode",
      minDays: 0,
      maxDays: 0,
    };
  }

  if (!inStock) {
    return {
      serviceable: true,
      label: "Ships in 7–10 days after restock",
      minDays: 7,
      maxDays: 10,
    };
  }

  const tail = parseInt(pin.slice(-2), 10) || 0;
  const minDays = express ? 1 : 3 + (tail % 3);
  const maxDays = express ? 2 : minDays + 2;
  const eta = new Date();
  eta.setDate(eta.getDate() + maxDays);

  return {
    serviceable: true,
    label: express
      ? `Express delivery by ${formatDeliveryDay(eta)}`
      : `Delivery by ${formatDeliveryDay(eta)}`,
    minDays,
    maxDays,
  };
}

export function getProductColorOptions(product: any): string[] {
  const meta = product?.arMetadata || {};
  if (Array.isArray(meta.colors) && meta.colors.length) {
    return meta.colors.map(String);
  }

  const fromVariants = new Set<string>();
  if (Array.isArray(product?.variants)) {
    for (const v of product.variants) {
      const title = String(v?.title || "");
      const colorPart = title.split("/")[0]?.trim();
      if (colorPart && colorPart !== "One Size" && colorPart !== "Standard") {
        fromVariants.add(colorPart);
      }
    }
  }
  if (fromVariants.size) return [...fromVariants];
  return [];
}

export function getProductSizeOptions(product: any): string[] {
  const meta = product?.arMetadata || {};
  if (Array.isArray(meta.sizes) && meta.sizes.length) {
    return meta.sizes.map(String);
  }

  if (Array.isArray(product?.variants) && product.variants.length) {
    const sizes = product.variants
      .map((v: { title?: string }) => {
        const title = String(v?.title || "");
        if (title.includes("/")) return title.split("/").pop()?.trim() || title;
        if (title === "Standard" || title === "One Size") return null;
        return title;
      })
      .filter(Boolean) as string[];
    if (sizes.length) return [...new Set(sizes)];
  }
  return [];
}

export function getProductHighlights(product: any): ProductHighlight[] {
  const meta = product?.arMetadata || {};
  const attrs = meta.attributes || {};
  const rows: ProductHighlight[] = [];

  for (const [key, val] of Object.entries(attrs)) {
    if (val == null || val === "") continue;
    rows.push({
      label: humanizeKey(key),
      value: Array.isArray(val) ? val.join(", ") : String(val),
    });
  }

  if (meta.subcategoryLabel) {
    rows.unshift({ label: "Category", value: String(meta.subcategoryLabel) });
  } else if (meta.categoryLabel) {
    rows.unshift({ label: "Category", value: String(meta.categoryLabel) });
  }

  if (product?.type) rows.push({ label: "Type", value: String(product.type) });
  if (product?.vibe) rows.push({ label: "Vibe", value: String(product.vibe) });
  if (product?.description) {
    rows.push({
      label: "Description",
      value: String(product.description).slice(0, 120),
    });
  }

  if (!rows.length) {
    return [
      { label: "Type", value: product?.type || "Fashion" },
      { label: "Vibe", value: product?.vibe || "Quiet Luxury" },
      { label: "Seller", value: product?.maison?.name || "AURA" },
    ];
  }

  return rows.slice(0, 8);
}

export function getProductReviews(product: any): ProductReviewItem[] {
  if (Array.isArray(product?.reviewItems) && product.reviewItems.length) {
    return product.reviewItems.map((r: any, i: number) => ({
      id: r.id || `review-${i}`,
      rating: r.rating ?? 5,
      title: r.title,
      body: r.body || r.comment || "",
      author: r.author || r.userName || "Verified Buyer",
      createdAt: r.createdAt,
    }));
  }

  if (Array.isArray(product?.reviews) && product.reviews.length) {
    const first = product.reviews[0];
    if (typeof first === "object") {
      return product.reviews.map((r: any, i: number) => ({
        id: r.id || `review-${i}`,
        rating: r.rating ?? 5,
        title: r.title,
        body: r.body || r.comment || "",
        author: r.author || "Verified Buyer",
        createdAt: r.createdAt,
      }));
    }
  }

  return [];
}

export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4) return "Very Good";
  if (rating >= 3.5) return "Good";
  if (rating >= 3) return "Average";
  return "Below Average";
}

export function getSellerMeta(product: any): {
  name: string;
  rating: number;
  tenureLabel: string;
  maisonId?: string;
} {
  const name = product?.maison?.name || product?.brand || "AURA Seller";
  const rating = product?.maison?.rating ?? product?.rating ?? 4.5;
  const years =
    product?.maison?.yearsOnPlatform ??
    (product?.maison?.id ? 3 + (String(product.maison.id).length % 8) : 5);
  return {
    name,
    rating,
    tenureLabel: `${years} years with AURA`,
    maisonId: product?.maison?.id,
  };
}

export function getProductStock(product: any): number {
  if (typeof product?.stock === "number") return product.stock;
  if (Array.isArray(product?.variants)) {
    return product.variants.reduce(
      (sum: number, v: { stock?: number }) => sum + (v.stock ?? 0),
      0
    );
  }
  return 10;
}

export function isCodAvailable(product: any): boolean {
  return (product?.price ?? 0) <= 500000;
}

export function getSimilarProducts(product: any, all: any[], limit = 8): any[] {
  const subId = getProductSubcategoryId(product);
  const catId = getProductCategoryId(product);
  const sub = subId ? findSubcategoryById(subId) : undefined;

  return all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (sub && productMatchesSubcategory(p, sub)) score += 4;
      if (getProductSubcategoryId(p) === subId) score += 3;
      if (getProductCategoryId(p) === catId) score += 2;
      if (product.type && p.type === product.type) score += 1;
      if (product.maison?.id && p.maison?.id === product.maison.id) score += 1;
      return { p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.p);
}

export function getCategorySectionMeta(product: any): CategorySectionMeta {
  const meta = product?.arMetadata || {};
  const brandType = String(product?.type || meta.categoryLabel || "Fashion");
  const slug = slugFromCategoryName(brandType);

  if (meta.subcategoryLabel && meta.subcategoryId) {
    return {
      title: `More in ${meta.subcategoryLabel}`,
      slug,
      subcategoryId: meta.subcategoryId,
    };
  }

  if (meta.categoryLabel) {
    return {
      title: `More in ${meta.categoryLabel}`,
      slug,
    };
  }

  return {
    title: `More in ${brandType}`,
    slug,
  };
}

/** Products in the same subcategory / shop category — shown below ratings on PDP. */
export function getCategoryRelatedProducts(
  product: any,
  all: any[],
  limit = 12
): any[] {
  const subId = getProductSubcategoryId(product);
  const catId = getProductCategoryId(product);
  const sub = subId ? findSubcategoryById(subId) : undefined;
  const brandType = String(product?.type || product?.arMetadata?.categoryLabel || "");

  const scored = all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (sub && productMatchesSubcategory(p, sub)) score += 5;
      if (subId && getProductSubcategoryId(p) === subId) score += 4;
      if (catId && getProductCategoryId(p) === catId) score += 3;
      if (brandType && p.type === brandType) score += 2;
      if (brandType && productMatchesCategory(p, brandType)) score += 2;
      return { p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: any[] = [];
  for (const row of scored) {
    if (seen.has(row.p.id)) continue;
    seen.add(row.p.id);
    out.push(row.p);
    if (out.length >= limit) break;
  }
  return out;
}

export function getCouponPreview(product: any): {
  amount: number;
  description: string;
} {
  const price = product?.price ?? 0;
  const amount = Math.max(100, Math.round(price * 0.1));
  return {
    amount,
    description: `Save ${Math.round((amount / Math.max(price, 1)) * 100)}% extra on eligible items`,
  };
}
