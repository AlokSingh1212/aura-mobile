import { API_HOST } from "@/constants/api";

export type ShopCoupon = {
  id: string;
  code: string;
  discount: number;
  type: "PERCENTAGE" | "FIXED";
  group: string;
  description: string;
  expiresAt?: string | null;
  stackable?: boolean;
};

function describeCoupon(p: {
  code: string;
  discount: number;
  type: string;
  group?: string;
}): string {
  if (p.type === "PERCENTAGE") {
    return `${p.discount}% off on eligible items`;
  }
  return `₹${Math.round(p.discount).toLocaleString("en-IN")} off`;
}

export async function fetchAvailableCoupons(
  maisonId?: string | null
): Promise<ShopCoupon[]> {
  const params = new URLSearchParams({ active: "true", group: "COUPON" });
  if (maisonId) params.set("maisonId", maisonId);

  try {
    const res = await fetch(`${API_HOST}/api/mobile/promotions?${params}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.promos)) {
      return data.promos.map((p: any) => ({
        id: p.id,
        code: p.code,
        discount: p.discount,
        type: p.type === "FIXED" ? "FIXED" : "PERCENTAGE",
        group: p.group || "COUPON",
        description: describeCoupon(p),
        expiresAt: p.expiresAt,
        stackable: p.stackable,
      }));
    }
  } catch {
    /* fallback */
  }

  return [
    {
      id: "aura10",
      code: "AURA10",
      discount: 10,
      type: "PERCENTAGE",
      group: "PLATFORM",
      description: "10% off on eligible AURA products",
    },
  ];
}

export function couponDiscountAmount(
  subtotal: number,
  coupon?: { type?: string; discount?: number } | null
): number {
  if (!coupon?.discount) return 0;
  if (coupon.type === "PERCENTAGE") {
    return Math.round(subtotal * (coupon.discount / 100));
  }
  return Math.min(subtotal, Math.round(coupon.discount));
}
