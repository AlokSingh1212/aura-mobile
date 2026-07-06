export function getOriginalPrice(product: any): number {
  if (product.originalPrice && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  const discount = product.discount ?? inferDiscountPercent(product);
  if (discount > 0 && product.price) {
    return Math.round(product.price / (1 - discount / 100));
  }
  return product.price ?? 0;
}

export function inferDiscountPercent(product: any): number {
  if (product.discount) return product.discount;
  const hash = String(product.id || product.title || "").length;
  const options = [10, 15, 20, 25, 30, 40, 50, 65];
  return options[hash % options.length];
}

export function getDiscountPercent(product: any): number {
  const original = getOriginalPrice(product);
  const current = product.price ?? 0;
  if (original <= current || !current) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function getBankOfferPrice(product: any): number {
  const base = product.price ?? 0;
  const pct = 5 + (String(product.id || "").length % 8);
  return Math.round(base * (1 - pct / 100));
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getEmiPerMonth(price: number, months = 36): number {
  return Math.max(1, Math.round(price / months));
}

export function getProductRating(product: any): number {
  return product.rating ?? product.auraScore ?? 4.3;
}

export function getReviewCount(product: any): number {
  return product.reviewCount ?? product.reviews ?? 1000;
}
