import { getOriginalPrice, getDiscountPercent } from "@/lib/shopPricing";
import { couponDiscountAmount } from "@/lib/shopCoupons";
import { getEffectivePdpPrice, type BankOffer } from "@/lib/shopPdp";

export type CheckoutLineItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  maisonName?: string;
  selectedSize?: string;
  selectedColor?: string;
};

export type CheckoutTotals = {
  mrp: number;
  sellingPrice: number;
  productDiscount: number;
  couponDiscount: number;
  bankDiscount: number;
  deliveryFee: number;
  handlingFee: number;
  total: number;
  savings: number;
};

export function buildCheckoutTotals(opts: {
  items: CheckoutLineItem[];
  appliedCoupon?: any | null;
  appliedBankOffer?: BankOffer | null;
  deliveryFee?: number;
  handlingFee?: number;
}): CheckoutTotals {
  const { items, appliedCoupon, appliedBankOffer, deliveryFee = 0, handlingFee = 0 } = opts;

  const sellingPrice = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  let mrp = 0;
  let productDiscount = 0;
  for (const item of items) {
    const fakeProduct = { id: item.id, title: item.title, price: item.price };
    const original = getOriginalPrice(fakeProduct);
    const qty = item.quantity || 1;
    mrp += original * qty;
    productDiscount += Math.max(0, (original - item.price) * qty);
  }

  const afterBank = appliedBankOffer
    ? Math.max(0, sellingPrice - appliedBankOffer.discountAmount)
    : sellingPrice;

  const bankDiscount = appliedBankOffer?.discountAmount ?? 0;
  const couponDiscount = couponDiscountAmount(afterBank, appliedCoupon);
  const total = Math.max(1, afterBank - couponDiscount + deliveryFee + handlingFee);
  const savings = Math.max(0, mrp - total + productDiscount);

  return {
    mrp,
    sellingPrice,
    productDiscount,
    couponDiscount,
    bankDiscount,
    deliveryFee,
    handlingFee,
    total,
    savings: mrp + productDiscount > 0 ? mrp - total : productDiscount + couponDiscount + bankDiscount,
  };
}

export function getEmiMonthly(total: number, months = 36): number {
  return Math.max(1, Math.round(total / months));
}
