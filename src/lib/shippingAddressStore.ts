import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildDefaultShippingAddress,
  type ShippingAddress,
} from "@/lib/shopAddress";
import { loadSavedAddresses } from "@/lib/ecosystemSettings";

const PRIMARY_KEY = "@aura/primary_shipping_address_v1";

/** Load the user's primary shipping address (saved list → cached → profile defaults). */
export async function loadPrimaryShippingAddress(
  currentUser?: { name?: string; email?: string; phone?: string } | null,
  activeProfile?: { name?: string; email?: string; phone?: string } | null
): Promise<ShippingAddress> {
  try {
    const raw = await AsyncStorage.getItem(PRIMARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShippingAddress;
      if (parsed.address?.trim() || parsed.postalCode?.trim()) {
        return { ...buildDefaultShippingAddress(currentUser, activeProfile), ...parsed };
      }
    }
  } catch {
    /* fall through */
  }

  const saved = await loadSavedAddresses();
  if (saved.length > 0) {
    const primary = saved[0];
    const addr: ShippingAddress = {
      ...buildDefaultShippingAddress(currentUser, activeProfile),
      name: primary.name,
      phone: primary.phone,
      address: primary.address,
      city: primary.city,
      state: primary.state,
      postalCode: primary.postalCode,
      country: primary.country,
    };
    await savePrimaryShippingAddress(addr);
    return addr;
  }

  return buildDefaultShippingAddress(currentUser, activeProfile);
}

export async function savePrimaryShippingAddress(addr: ShippingAddress): Promise<void> {
  await AsyncStorage.setItem(PRIMARY_KEY, JSON.stringify(addr));
}
