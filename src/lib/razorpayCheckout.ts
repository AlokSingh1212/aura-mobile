import { IS_PRODUCTION_APP } from "@/lib/apiClient";

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default || require("react-native-razorpay");
} catch {
  /* Expo Go may lack native module */
}

export type RazorpayOpenOptions = {
  key: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
  };
};

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

export function isNativeRazorpayAvailable(orderId?: string) {
  return (
    !!RazorpayCheckout &&
    !!orderId &&
    !orderId.startsWith("order_sim_")
  );
}

export function razorpayMethodForCheckout(paymentMethod: string): RazorpayOpenOptions["method"] {
  switch (paymentMethod) {
    case "UPI":
      return { upi: true, card: false, netbanking: false, wallet: false, emi: false };
    case "CARD":
      return { upi: false, card: true, netbanking: false, wallet: false, emi: false };
    case "EMI":
      return { upi: false, card: true, netbanking: false, wallet: false, emi: true };
    default:
      return undefined;
  }
}

export function openNativeRazorpay(options: RazorpayOpenOptions): Promise<RazorpaySuccess> {
  if (!RazorpayCheckout) {
    return Promise.reject(new Error("Razorpay native module unavailable"));
  }
  return RazorpayCheckout.open({
    currency: "INR",
    name: "AURA",
    theme: { color: "#111111" },
    ...options,
  });
}

export function canSimulatePayment(orderId?: string) {
  return !IS_PRODUCTION_APP && (!orderId || orderId.startsWith("order_sim_"));
}
