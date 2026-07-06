export type ShopSortBy = "relevance" | "price_low" | "price_high" | "rating";

export type ShopFilters = {
  sortBy: ShopSortBy;
  brands: string[];
  colors: string[];
  gender: string | null;
};

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  sortBy: "relevance",
  brands: [],
  colors: [],
  gender: null,
};

export function extractFilterOptions(products: any[]) {
  const brands = new Set<string>();
  const colors = new Set<string>();
  const genders = new Set<string>();

  for (const p of products) {
    const brand = p.maison?.name || p.brand;
    if (brand) brands.add(String(brand));

    if (Array.isArray(p.colors)) {
      p.colors.forEach((c: string) => colors.add(String(c)));
    }

    const gender =
      p.attributes?.gender ||
      p.arMetadata?.gender ||
      p.metadata?.gender ||
      p.gender;
    if (gender) genders.add(String(gender));
  }

  return {
    brands: [...brands].sort(),
    colors: [...colors].sort(),
    genders: [...genders].sort(),
  };
}

export function productMatchesShopFilters(product: any, filters: ShopFilters): boolean {
  if (filters.brands.length) {
    const brand = product.maison?.name || product.brand || "";
    if (!filters.brands.includes(String(brand))) return false;
  }

  if (filters.colors.length) {
    const productColors: string[] = Array.isArray(product.colors) ? product.colors : [];
    if (!filters.colors.some((c) => productColors.includes(c))) return false;
  }

  if (filters.gender) {
    const g =
      product.attributes?.gender ||
      product.arMetadata?.gender ||
      product.metadata?.gender ||
      product.gender ||
      "";
    if (String(g).toLowerCase() !== filters.gender.toLowerCase()) return false;
  }

  return true;
}

export function sortProducts(list: any[], sortBy: ShopSortBy): any[] {
  if (sortBy === "price_low") return [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === "price_high") return [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sortBy === "rating") return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return list;
}

export function activeFilterCount(filters: ShopFilters): number {
  let n = 0;
  if (filters.brands.length) n += filters.brands.length;
  if (filters.colors.length) n += filters.colors.length;
  if (filters.gender) n += 1;
  return n;
}
