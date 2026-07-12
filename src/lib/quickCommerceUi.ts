import type { DynamicCategory } from "@/lib/dynamicShopCatalog";

export type QuickCommerceChip = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  filter?: (product: any) => boolean;
};

const SEASONAL_CHIPS: QuickCommerceChip[] = [
  {
    id: "monsoon",
    slug: "monsoon",
    label: "Monsoon",
    icon: "rainy-outline",
    filter: (p) => /rain|monsoon|umbrella|raincoat|waterproof/i.test(String(p.title || "")),
  },
  {
    id: "electronics",
    slug: "electronics",
    label: "Electronics",
    icon: "phone-portrait-outline",
    filter: (p) =>
      /phone|laptop|earbud|headphone|charger|electronic|gadget/i.test(String(p.title || "")) ||
      /technology|electronics/i.test(String(p.type || p.category || "")),
  },
  {
    id: "beauty",
    slug: "beauty",
    label: "Beauty",
    icon: "flower-outline",
    filter: (p) =>
      /beauty|makeup|skincare|lipstick|serum|cosmetic/i.test(String(p.title || "")) ||
      /beauty/i.test(String(p.type || p.category || "")),
  },
  {
    id: "pharma",
    slug: "pharma",
    label: "Pharma",
    icon: "medkit-outline",
    filter: (p) =>
      /medicine|pharma|tablet|vitamin|health|wellness/i.test(String(p.title || "")) ||
      /health|pharma/i.test(String(p.type || p.category || "")),
  },
];

/** Quick-shop top chips: All + dynamic catalog + seasonal rows. */
export function buildQuickCommerceChips(catalog: DynamicCategory[]): QuickCommerceChip[] {
  const fromCatalog = catalog
    .filter((c) => c.slug !== "for-you" && c.count > 0)
    .slice(0, 6)
    .map((c) => ({
      id: c.slug,
      slug: c.slug,
      label: c.label,
      icon: c.icon,
    }));

  const merged = [
    { id: "all", slug: "for-you", label: "All", icon: "apps-outline" },
    ...SEASONAL_CHIPS.filter((chip) =>
      fromCatalog.some((c) => c.slug === chip.slug) ? false : true
    ).slice(0, 4),
    ...fromCatalog.filter((c) => !SEASONAL_CHIPS.some((s) => s.slug === c.slug)),
  ];

  const seen = new Set<string>();
  return merged.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });
}

export function filterByQuickChip(products: any[], chip: QuickCommerceChip): any[] {
  if (chip.slug === "for-you" || chip.id === "all") return products;
  if (chip.filter) {
    const matched = products.filter(chip.filter);
    if (matched.length > 0) return matched;
  }
  return products.filter((p) => {
    const label = String(p.type || p.category || p.arMetadata?.shopCategory || "").toLowerCase();
    return label.includes(chip.slug.replace(/-/g, " ")) || label.includes(chip.label.toLowerCase());
  });
}

export function getPreviouslyBoughtProducts(products: any[], orders: any[]): any[] {
  const ids = new Set<string>();
  for (const order of orders) {
    for (const item of order.items || order.orderItems || []) {
      const id = item.artifactId || item.productId || item.id;
      if (id) ids.add(String(id));
    }
  }
  const fromOrders = products.filter((p) => ids.has(String(p.id)));
  return fromOrders.slice(0, 12);
}

export function getFreeDeliveryGap(cartTotal: number, threshold = 149): number {
  return Math.max(0, threshold - cartTotal);
}

export type DeliveryStatus = {
  subtitle: string;
  title: string;
  emoji?: string;
  unavailable?: boolean;
};

export function getDeliveryStatus(): DeliveryStatus {
  return { subtitle: "Express delivery in", title: "12 mins", emoji: "⚡" };
}

export function pickPromoProduct(products: any[]): any | null {
  if (!products.length) return null;
  const featured = products.find((p) =>
    /oreo|bts|limited|offer|deal/i.test(String(p.title || ""))
  );
  return featured || products[0];
}
