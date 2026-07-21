import React from "react";
import Lucide from "@expo/vector-icons/Ionicons";

const VERIFIED_BLUE = "#0095f6";

type Props = {
  size?: number;
  color?: string;
};

/** Instagram-style blue verified check for premium Maisons. */
export function VerifiedMaisonBadge({ size = 14, color = VERIFIED_BLUE }: Props) {
  return <Lucide name="checkmark-circle" size={size} color={color} accessibilityLabel="Verified Maison" />;
}

export function isProductFromVerifiedMaison(product: {
  maisonPremiumVerified?: boolean;
  maison?: {
    premiumVerified?: boolean;
    premiumUntil?: string | Date | null;
  } | null;
}): boolean {
  if (product.maisonPremiumVerified === true) return true;
  const m = product.maison;
  if (!m?.premiumVerified) return false;
  if (!m.premiumUntil) return true;
  return new Date(m.premiumUntil).getTime() > Date.now();
}
