import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export type ReturnRequestSummary = {
  id: string;
  orderId: string;
  orderItemId: string | null;
  type: "RETURN" | "EXCHANGE";
  reason: string;
  status: string;
  refundAmount: number | null;
  refundStatus: string | null;
  refundMethod: string | null;
  pickupLabelUrl: string | null;
  autoRefundAt: string | null;
  createdAt: string;
};

export type ReturnRequestDetail = ReturnRequestSummary & {
  order: {
    id: string;
    orderNumber: string | null;
    amount: number;
    paymentMethod: string | null;
    status: string;
  };
  item: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    images: string[];
  } | null;
};

export async function fetchReturns(): Promise<ReturnRequestSummary[]> {
  const res = await fetch(`${API_BASE}/returns`, { headers: authHeaders() });
  const data = await res.json();
  return data.success ? data.returns : [];
}

export async function fetchReturnDetail(id: string): Promise<ReturnRequestDetail | null> {
  const res = await fetch(`${API_BASE}/returns/${id}`, { headers: authHeaders() });
  const data = await res.json();
  return data.success ? data.returnRequest : null;
}

export async function createReturnRequest(payload: {
  orderId: string;
  orderItemId: string;
  type: "RETURN" | "EXCHANGE";
  reason: string;
  exchangeArtifactId?: string;
}): Promise<{ success: boolean; request?: ReturnRequestSummary; error?: string }> {
  const res = await fetch(`${API_BASE}/returns`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export const RETURN_REASONS = [
  "Wrong item delivered",
  "Product damaged",
  "Quality not as expected",
  "Size / variant issue",
  "Changed my mind",
  "Other",
];

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Submitted",
    APPROVED: "Approved",
    PICKUP_SCHEDULED: "Pickup scheduled",
    IN_TRANSIT: "In transit",
    RECEIVED: "Received at warehouse",
    REFUND_PROCESSING: "Refund processing",
    REFUNDED: "Refunded",
    EXCHANGE_PENDING: "Exchange credit issued",
    EXCHANGED: "Exchanged",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

export function refundStatusLabel(status: string | null): string {
  if (!status) return "Pending";
  const map: Record<string, string> = {
    PENDING: "Pending verification",
    WALLET_CREDITED: "Credited to AURA Wallet",
    GATEWAY_PROCESSING: "Processing to original payment",
    COMPLETED: "Refund completed",
    FAILED: "Refund failed — contact support",
  };
  return map[status] || status;
}
