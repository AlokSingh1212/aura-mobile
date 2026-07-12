import { API_BASE } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import {
  isNativeRazorpayAvailable,
  openNativeRazorpay,
  razorpayMethodForCheckout,
} from "@/lib/razorpayCheckout";
import * as WebBrowser from "expo-web-browser";

export type PaymentOrchestration = {
  orchestrator: "JUSPAY";
  primaryGateway: "RAZORPAY" | "PAYU";
  secondaryGateway: "RAZORPAY" | "PAYU";
  sessionId: string;
  orderId: string;
  orderNumber: string;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string | null;
  razorpayKeyId: string | null;
  payuMerchantKey: string | null;
  payuTxnId: string | null;
  payuHash: string | null;
  payuProductInfo: string;
  juspayClientId: string | null;
  juspayMerchantId: string | null;
  juspayEnvironment: "production" | "sandbox";
  juspayPayload: Record<string, unknown>;
  simulated?: boolean;
};

export type OrchestratedPaymentResult =
  | { success: true; gateway: "RAZORPAY" | "PAYU"; paymentId: string; signature?: string }
  | { success: false; error: string; canRetryPayU?: boolean };

export async function fetchPaymentOrchestration(
  userId: string,
  orderId: string
): Promise<PaymentOrchestration | null> {
  const res = await fetch(`${API_BASE}/checkout/orchestrate-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ userId, orderId }),
  });
  const data = await res.json();
  return data.success ? data.orchestration : null;
}

/** Open PayU secondary gateway (web checkout). */
export async function openPayUFallback(
  orchestration: PaymentOrchestration,
  customer: { name?: string; email?: string; phone?: string }
): Promise<OrchestratedPaymentResult> {
  if (!orchestration.payuMerchantKey || !orchestration.payuTxnId || !orchestration.payuHash) {
    return { success: false, error: "PayU fallback not configured." };
  }

  const amount = (orchestration.amountPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    key: orchestration.payuMerchantKey,
    txnid: orchestration.payuTxnId,
    amount,
    productinfo: orchestration.payuProductInfo,
    firstname: customer.name || "Customer",
    email: customer.email || "customer@aura.social",
    phone: customer.phone || "9999999999",
    surl: `${API_BASE.replace("/api/mobile", "")}/checkout/pay-mobile?gateway=payu&status=success`,
    furl: `${API_BASE.replace("/api/mobile", "")}/checkout/pay-mobile?gateway=payu&status=failed`,
    hash: orchestration.payuHash,
  });

  const payuUrl = `https://secure.payu.in/_payment?${params.toString()}`;
  await WebBrowser.openBrowserAsync(payuUrl);
  return {
    success: true,
    gateway: "PAYU",
    paymentId: orchestration.payuTxnId,
  };
}

/**
 * Juspay-orchestrated checkout: Razorpay primary → PayU secondary on failure.
 */
export async function executeOrchestratedPayment(opts: {
  orchestration: PaymentOrchestration;
  paymentMethod: string;
  customer: { name?: string; email?: string; phone?: string };
  description?: string;
}): Promise<OrchestratedPaymentResult> {
  const { orchestration, paymentMethod, customer, description } = opts;
  const orderId = orchestration.razorpayOrderId || undefined;
  const key = orchestration.razorpayKeyId || undefined;

  if (isNativeRazorpayAvailable(orderId) && key) {
    try {
      const payment = await openNativeRazorpay({
        key,
        amount: orchestration.amountPaise,
        order_id: orderId!,
        description: description || `Order ${orchestration.orderNumber}`,
        method: razorpayMethodForCheckout(paymentMethod),
        prefill: {
          email: customer.email,
          name: customer.name,
          contact: customer.phone,
        },
      });
      return {
        success: true,
        gateway: "RAZORPAY",
        paymentId: payment.razorpay_payment_id,
        signature: payment.razorpay_signature,
      };
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "description" in err
          ? String((err as { description?: string }).description)
          : "Razorpay payment failed";
      const code =
        err && typeof err === "object" && "code" in err
          ? Number((err as { code?: number }).code)
          : 0;
      if (code === 2) {
        return { success: false, error: "Payment cancelled.", canRetryPayU: false };
      }
      const payu = await openPayUFallback(orchestration, customer);
      if (payu.success) return payu;
      return { success: false, error: message, canRetryPayU: true };
    }
  }

  if (orchestration.juspayPayload?.juspay_session) {
    const session = orchestration.juspayPayload.juspay_session as {
      payment_links?: { web?: string };
    };
    if (session.payment_links?.web) {
      await WebBrowser.openBrowserAsync(session.payment_links.web);
      return {
        success: true,
        gateway: "RAZORPAY",
        paymentId: orchestration.sessionId,
      };
    }
  }

  return openPayUFallback(orchestration, customer);
}
