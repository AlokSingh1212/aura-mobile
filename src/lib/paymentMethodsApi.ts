import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type SavedPaymentMethod = {
  id: string;
  type: string;
  label: string;
  last4: string | null;
  upiId: string | null;
  isDefault: boolean;
  hasToken: boolean;
  createdAt: string;
};

export async function fetchPaymentMethods(userId: string): Promise<{
  methods: SavedPaymentMethod[];
  walletBalance: number;
} | null> {
  try {
    const res = await fetch(
      `${API_BASE}/payment-methods?userId=${encodeURIComponent(userId)}`,
      { headers: authHeaders() }
    );
    const data = await res.json();
    if (!data.success) return null;
    return {
      methods: data.methods || [],
      walletBalance: data.walletBalance ?? 0,
    };
  } catch {
    return null;
  }
}

export async function addPaymentMethod(opts: {
  userId: string;
  type: string;
  label: string;
  last4?: string;
  upiId?: string;
  isDefault?: boolean;
}): Promise<SavedPaymentMethod | null> {
  try {
    const res = await fetch(`${API_BASE}/payment-methods`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    return data.success ? data.method : null;
  } catch {
    return null;
  }
}

export async function removePaymentMethod(userId: string, methodId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/payment-methods?userId=${encodeURIComponent(userId)}&methodId=${encodeURIComponent(methodId)}`,
      { method: "DELETE", headers: authHeaders() }
    );
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function setDefaultPaymentMethod(
  userId: string,
  methodId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/payment-methods`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ userId, methodId }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
