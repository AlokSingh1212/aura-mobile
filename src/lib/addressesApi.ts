import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADDRESSES_KEY = "@aura/saved_addresses_v1";

export async function fetchRemoteAddresses(userId: string): Promise<any[] | null> {
  try {
    const res = await fetch(`${API_BASE}/addresses?userId=${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.addresses)) {
      await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(data.addresses));
      return data.addresses;
    }
  } catch {
    /* offline */
  }
  return null;
}

export async function pushRemoteAddresses(userId: string, addresses: any[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ userId, addresses }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function syncAddressesWithCloud(userId: string): Promise<any[]> {
  const remote = await fetchRemoteAddresses(userId);
  if (remote) return remote;

  try {
    const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
    const local = raw ? JSON.parse(raw) : [];
    if (local.length > 0) {
      await pushRemoteAddresses(userId, local);
    }
    return local;
  } catch {
    return [];
  }
}
