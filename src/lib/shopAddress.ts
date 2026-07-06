export type ShippingAddress = {
  name?: string;
  email?: string;
  phone?: string;
  /** E.164 dial prefix e.g. +91 */
  countryCode?: string;
  /** ISO 3166-1 alpha-2 e.g. IN */
  countryIso?: string;
  country?: string;
  state?: string;
  /** ISO state/province code from country-state-city */
  stateIso?: string;
  city?: string;
  address?: string;
  postalCode?: string;
};

export function formatAddressString(addr: ShippingAddress | string | null | undefined): string {
  if (typeof addr === "string") return addr;
  if (!addr) return "N/A";
  const namePart = addr.name ? `${addr.name} ` : "";
  const emailPart = addr.email ? `(${addr.email})\n` : "\n";
  const contactPart =
    addr.countryCode && addr.phone ? `${addr.countryCode} ${addr.phone}` : addr.phone || "";
  const contactLine = contactPart ? `${contactPart}\n` : "";
  const streetPart = addr.address || "";
  const cityStateZip = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  const countryPart = addr.country ? `\n${addr.country}` : "";
  return `${namePart}${emailPart}${contactLine}${streetPart}\n${cityStateZip}${countryPart}`;
}

export function shortAddressLine(addr: ShippingAddress | null | undefined): string {
  if (!addr) return "Add delivery address";
  const parts = [addr.address, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
  if (!parts.length) return "Add delivery address";
  const line = parts.join(", ");
  return line.length > 48 ? `${line.slice(0, 46)}…` : line;
}

export function buildDefaultShippingAddress(
  currentUser?: any,
  activeProfile?: any
): ShippingAddress {
  return {
    name: currentUser?.name || activeProfile?.name || "",
    email: currentUser?.email || activeProfile?.email || "",
    phone: String(currentUser?.phone || activeProfile?.phone || "")
      .replace(/\D/g, ""),
    countryCode: "+91",
    countryIso: "IN",
    country: "India",
    address: "",
    city: "",
    state: "",
    stateIso: "",
    postalCode: "",
  };
}

export function isAddressComplete(addr: ShippingAddress | null | undefined): boolean {
  if (!addr) return false;
  return Boolean(
    addr.name?.trim() &&
      addr.phone?.trim() &&
      addr.address?.trim() &&
      addr.city?.trim() &&
      addr.state?.trim() &&
      addr.postalCode?.trim()
  );
}
