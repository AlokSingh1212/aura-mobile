import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.set(key, String(value));
    }
  });
  return q.toString();
}

export type BusinessStatCards = {
  ordersToday: number;
  revenueToday: number;
  openEnquiries: number;
  storeViewsToday: number;
  ads?: {
    activeCount: number;
    totalSpend: number;
    totalClicks: number;
    totalImpressions: number;
  };
};

export function formatBusinessRevenue(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatBusinessCount(value: number): string {
  const n = Math.max(0, Math.round(value));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function businessStatsToCards(stats: BusinessStatCards) {
  return [
    { label: "Orders Today", value: String(stats.ordersToday), icon: "bag-outline", color: "#00f5ff" },
    { label: "Revenue", value: formatBusinessRevenue(stats.revenueToday), icon: "cash-outline", color: "#a78bfa" },
    { label: "Enquiries", value: String(stats.openEnquiries), icon: "chatbubble-outline", color: "#fb923c" },
    {
      label: "Store Views",
      value: formatBusinessCount(stats.storeViewsToday),
      icon: "eye-outline",
      color: "#34d399",
    },
  ];
}

export const EMPTY_BUSINESS_STATS: BusinessStatCards = {
  ordersToday: 0,
  revenueToday: 0,
  openEnquiries: 0,
  storeViewsToday: 0,
};

export async function fetchBusinessStatsApi(maisonId: string, userId: string) {
  const res = await fetch(
    `${API_HOST}/api/mobile/business-stats?${buildQuery({ maisonId, userId })}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function fetchPromotionsApi(maisonId: string, userId: string) {
  const res = await fetch(
    `${API_HOST}/api/mobile/promotions?${buildQuery({ maisonId, userId, active: true })}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function createPromotionApi(
  userId: string,
  payload: { maisonId: string; code: string; discount: number; type: string }
) {
  const res = await fetch(`${API_HOST}/api/mobile/promotions`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ ...payload, userId }),
  });
  return res.json();
}

export async function fetchBroadcastsApi(maisonId: string, userId: string) {
  const res = await fetch(
    `${API_HOST}/api/mobile/broadcast?${buildQuery({ maisonId, userId })}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function sendBroadcastApi(
  userId: string,
  payload: { maisonId: string; title: string; content: string; audience?: string; type?: string }
) {
  const res = await fetch(`${API_HOST}/api/mobile/broadcast`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ ...payload, userId }),
  });
  return res.json();
}

export async function fetchAdsMetricsApi(maisonId: string, userId: string) {
  const res = await fetch(
    `${API_HOST}/api/mobile/ads?${buildQuery({ maisonId, userId })}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function fetchAutoReplyApi(maisonId: string, userId: string) {
  const res = await fetch(
    `${API_HOST}/api/mobile/auto-reply?${buildQuery({ maisonId, userId })}`,
    { headers: authHeaders() }
  );
  return res.json();
}

export async function saveAutoReplyApi(
  userId: string,
  payload: {
    maisonId: string;
    enabled: boolean;
    greetingMessage: string;
    awayMessage: string;
    quietHoursStart: number | null;
    quietHoursEnd: number | null;
  }
) {
  const res = await fetch(`${API_HOST}/api/mobile/auto-reply`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ ...payload, userId }),
  });
  return res.json();
}
