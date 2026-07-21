import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { SHOP } from "@/theme/shopTheme";
import { CheckoutStepper } from "@/components/shop/CheckoutStepper";
import { CheckoutPriceDetails } from "@/components/shop/CheckoutPriceDetails";
import { CouponPickerSheet } from "@/components/shop/CouponPickerSheet";
import { PdpAddressSheet } from "@/components/shop/PdpAddressSheet";
import { AddressFormFields, validateAddressForm, normalizeAddressForm } from "@/components/shop/AddressFormFields";
import { buildDefaultShippingAddress, shortAddressLine, type ShippingAddress } from "@/lib/shopAddress";
import { loadPrimaryShippingAddress, savePrimaryShippingAddress } from "@/lib/shippingAddressStore";
import { buildCheckoutTotals, getEmiMonthly, type CheckoutLineItem } from "@/lib/shopCheckout";
import { getBankOffers, type BankOffer } from "@/lib/shopPdp";
import { formatPhoneDisplay } from "@/lib/phoneValidation";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";
import { loadEcosystemSettings } from "@/lib/ecosystemSettings";
import type { PaymentMethod } from "@/lib/ecosystemSettings";
import { appendActivity } from "@/lib/activityLog";
import {
  executeOrchestratedPayment,
  type PaymentOrchestration,
} from "@/lib/juspayCheckout";
import { applyCountrySelection } from "@/lib/worldLocations";
import {
  getCheckoutBlockReason,
  getStoreProcessingDays,
  tryAutoApplyCheckoutCoupon,
} from "@/lib/settingsRuntime";

const PAYMENT_METHODS = [
  { id: "UPI", icon: "phone-portrait-outline", title: "UPI", sub: "Pay by any UPI app", offer: "Get upto ₹50 cashback" },
  { id: "CARD", icon: "card-outline", title: "Credit / Debit / ATM Card", sub: "Add and secure cards as per RBI guidelines", offer: "Save upto ₹150" },
  { id: "EMI", icon: "calendar-outline", title: "EMI", sub: "AURA No Cost EMI", offer: "" },
  { id: "COD", icon: "cash-outline", title: "Cash on Delivery", sub: "Pay when you receive", offer: "" },
] as const;

export default function ShopCheckoutScreen() {
  const { productId, color, size, paymentMethod: paymentMethodParam, affiliateCode: affiliateCodeParam } = useLocalSearchParams<{
    productId?: string;
    color?: string;
    size?: string;
    paymentMethod?: string;
    affiliateCode?: string;
  }>();

  const {
    cart,
    products,
    currentUser,
    activeProfile,
    activeMaisonId,
    applyCoupon,
    initiateCheckout,
    verifyPayment,
    triggerHaptic,
    formatPrice,
    fetchProducts,
  } = useStore();

  const [step, setStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(() =>
    buildDefaultShippingAddress(currentUser, activeProfile)
  );
  const [addressSheet, setAddressSheet] = useState(false);
  const [couponSheet, setCouponSheet] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [appliedBankOffer, setAppliedBankOffer] = useState<BankOffer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [expandedPayment, setExpandedPayment] = useState<string | null>("UPI");
  const [isPaying, setIsPaying] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ orderNumber: "", amount: 0, itemCount: 0, orderId: "" });
  const [shopPrefs, setShopPrefs] = useState({
    defaultCountryIso: "IN",
    expressDelivery: false,
    codEnabled: true,
    showBankOffers: true,
    emailOrderUpdates: true,
  });
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    loadEcosystemSettings().then((s) => {
      setShopPrefs(s.shop);
      setSavedMethods(s.payments.methods);
      const defaultId = s.payments.defaultMethodId;
      const defaultMethod = s.payments.methods.find((m) => m.id === defaultId);
      if (defaultMethod) {
        setSelectedSavedMethodId(defaultMethod.id);
        if (defaultMethod.type === "CARD") {
          setPaymentMethod("CARD");
          setExpandedPayment("CARD");
        } else if (defaultMethod.type === "WALLET") {
          setPaymentMethod("UPI");
          setExpandedPayment("UPI");
        } else {
          setPaymentMethod("UPI");
          setExpandedPayment("UPI");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (paymentMethodParam === "EMI") {
      setPaymentMethod("EMI");
      setExpandedPayment("EMI");
      setStep(1);
    }
  }, [paymentMethodParam]);

  useEffect(() => {
    (async () => {
      const addr = await loadPrimaryShippingAddress(currentUser, activeProfile);
      setShippingAddress(addr);
    })();
  }, [currentUser?.id, activeProfile?.userId]);

  useEffect(() => {
    if (!shopPrefs.defaultCountryIso) return;
    setShippingAddress((prev) => {
      if (prev.countryIso === shopPrefs.defaultCountryIso) return prev;
      return {
        ...prev,
        ...applyCountrySelection(shopPrefs.defaultCountryIso, prev),
      } as ShippingAddress;
    });
  }, [shopPrefs.defaultCountryIso]);

  const lineItems: CheckoutLineItem[] = useMemo(() => {
    if (productId) {
      const p = products.find((x) => x.id === productId);
      if (!p) return [];
      return [
        {
          id: p.id,
          title: p.title,
          price: p.price ?? 0,
          quantity: 1,
          image: p.images?.[0],
          maisonName: p.maison?.name,
          selectedColor: color,
          selectedSize: size,
          affiliateCode: affiliateCodeParam || undefined,
        },
      ];
    }
    return cart.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price ?? 0,
      quantity: item.quantity || 1,
      image: item.images?.[0],
      maisonName: item.maison?.name,
      affiliateCode: item.affiliateCode,
    }));
  }, [productId, products, cart, color, size, affiliateCodeParam]);

  useEffect(() => {
    if (appliedCoupon || !lineItems.length || isCheckingCoupon) return;
    let cancelled = false;
    (async () => {
      const auto = await tryAutoApplyCheckoutCoupon(
        (payload) => applyCoupon(payload),
        activeMaisonId || undefined
      );
      if (cancelled || !auto) return;
      setAppliedCoupon(auto.coupon);
      setCouponCode(auto.code);
    })();
    return () => {
      cancelled = true;
    };
  }, [lineItems.length, appliedCoupon, activeMaisonId, isCheckingCoupon]);

  const primaryProduct = productId ? products.find((p) => p.id === productId) : cart[0];
  const maisonId = primaryProduct?.maison?.id || activeMaisonId;
  const bankOffers = shopPrefs.showBankOffers && primaryProduct ? getBankOffers(primaryProduct) : [];
  const paymentMethods = PAYMENT_METHODS.filter(
    (m) => m.id !== "COD" || shopPrefs.codEnabled
  );

  useEffect(() => {
    if (!shopPrefs.showBankOffers) {
      setAppliedBankOffer(null);
      return;
    }
    if (bankOffers[0] && !appliedBankOffer) {
      setAppliedBankOffer(bankOffers[0]);
    }
  }, [primaryProduct?.id, shopPrefs.showBankOffers]);

  const totals = buildCheckoutTotals({
    items: lineItems,
    appliedCoupon,
    appliedBankOffer: shopPrefs.showBankOffers ? appliedBankOffer : null,
    deliveryFee: shopPrefs.expressDelivery ? 49 : 0,
    handlingFee: paymentMethod === "EMI" ? 11 : 0,
  });

  useEffect(() => {
    if (!shopPrefs.codEnabled && paymentMethod === "COD") {
      setPaymentMethod("UPI");
      setExpandedPayment("UPI");
    }
  }, [shopPrefs.codEnabled]);

  const emiMonthly = getEmiMonthly(totals.total);

  const handleApplyCoupon = async (code: string) => {
    setIsCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await applyCoupon({ code: code.trim(), maisonId });
      if (res.success && res.valid) {
        setAppliedCoupon(res);
        setCouponCode(res.code);
        setCouponError("");
        setCouponSheet(false);
        triggerHaptic("success");
      } else {
        setCouponError(res.error || "Invalid coupon code.");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Could not validate coupon.");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const goNext = () => {
    if (step === 0) {
      const err = validateAddressForm(shippingAddress);
      if (err) {
        Alert.alert("Address required", err);
        return;
      }
      setShippingAddress(normalizeAddressForm(shippingAddress));
      savePrimaryShippingAddress(normalizeAddressForm(shippingAddress)).catch(() => {});
    }
    triggerHaptic("light");
    setStep((s) => Math.min(2, s + 1));
  };

  const handlePay = async () => {
    if (!lineItems.length) return;
    const blockReason = getCheckoutBlockReason();
    if (blockReason) {
      Alert.alert("Store unavailable", blockReason);
      return;
    }
    setIsPaying(true);
    triggerHaptic("heavy");
    try {
      const cartItems = lineItems.map((item) => ({
        artifactId: item.id,
        quantity: item.quantity,
        price: item.price,
        affiliateCode: item.affiliateCode || undefined,
      }));

      const res = await initiateCheckout({
        userId: currentUser?.id || activeProfile?.userId || "guest",
        cartItems,
        shippingAddress: JSON.stringify(shippingAddress),
        couponCode: appliedCoupon?.code,
      });

      if (!res.success) {
        Alert.alert("Checkout error", res.error || "Try again.");
        setIsPaying(false);
        return;
      }

      if (paymentMethod === "COD") {
        const verify = await verifyPayment({
          razorpayOrderId: res.razorpayOrderId || res.orderId,
          razorpayPaymentId: "pay_cod",
          razorpaySignature: "sig_cod",
        });
        if (verify.success) {
          const saved = savedMethods.find((m) => m.id === selectedSavedMethodId);
          appendActivity({
            type: "purchase",
            title: `Order ${verify.orderNumber || res.orderNumber || "placed"}`,
            subtitle: saved ? `Paid with ${saved.label}` : "Cash on delivery",
            targetId: verify.orderId || res.orderId,
          });
          setSuccessDetails({
            orderNumber: verify.orderNumber || res.orderNumber || "ORD",
            amount: totals.total,
            itemCount: lineItems.length,
            orderId: verify.orderId || res.orderId || "",
          });
          setSuccessVisible(true);
        } else {
          Alert.alert("Order failed", verify.error || "Could not place order.");
        }
        setIsPaying(false);
        return;
      }

      const orchestration: PaymentOrchestration | undefined = res.orchestration;
      if (orchestration) {
        const payResult = await executeOrchestratedPayment({
          orchestration,
          paymentMethod,
          customer: {
            name: activeProfile?.name || currentUser?.username,
            email: currentUser?.email,
            phone: shippingAddress.phone,
          },
          description: `AURA order ${res.orderNumber || ""}`.trim(),
        });

        if (payResult.success && payResult.gateway === "RAZORPAY" && payResult.paymentId) {
          const verify = await verifyPayment({
            razorpayOrderId: res.razorpayOrderId,
            razorpayPaymentId: payResult.paymentId,
            razorpaySignature: payResult.signature,
          });
          if (verify.success) {
            appendActivity({
              type: "purchase",
              title: `Order ${verify.orderNumber || res.orderNumber || "placed"}`,
              subtitle: "Paid via Juspay · Razorpay",
              targetId: verify.orderId || res.orderId,
            });
            setSuccessDetails({
              orderNumber: verify.orderNumber || res.orderNumber || "ORD",
              amount: totals.total,
              itemCount: lineItems.length,
              orderId: verify.orderId || res.orderId || "",
            });
            setSuccessVisible(true);
          } else {
            Alert.alert("Payment failed", verify.error || "Verification failed.");
          }
        } else if (payResult.success && payResult.gateway === "PAYU") {
          appendActivity({
            type: "purchase",
            title: `Order ${res.orderNumber || "placed"}`,
            subtitle: "Paid via Juspay · PayU",
            targetId: res.orderId,
          });
          Alert.alert(
            "PayU checkout",
            "Complete payment in the browser, then return to the app."
          );
        } else if (!payResult.success && payResult.error !== "Payment cancelled.") {
          Alert.alert("Payment error", payResult.error || "Could not complete payment.");
        }
        setIsPaying(false);
        return;
      }

      const url = `${API_HOST}/checkout/pay-mobile?orderId=${res.orderId}&returnPath=shop/checkout`;
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Payment error", "Could not start payment.");
    } finally {
      setIsPaying(false);
    }
  };

  if (!lineItems.length) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>Nothing to checkout</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const item = lineItems[0];
  const checkoutBlock = getCheckoutBlockReason();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : router.back())}>
            <Lucide name="arrow-back" size={24} color={SHOP.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.stepLabel}>Step {step + 1} of 3</Text>
            <Text style={styles.headerTitle}>
              {step === 0 ? "Delivery Address" : step === 1 ? "Order Summary" : "Payments"}
            </Text>
          </View>
          {step === 2 && (
            <View style={styles.secureBadge}>
              <Lucide name="lock-closed" size={12} color={SHOP.green} />
              <Text style={styles.secureText}>100% Secure</Text>
            </View>
          )}
        </View>

        {checkoutBlock ? (
          <View style={styles.vacationBanner}>
            <Lucide name="pause-circle-outline" size={18} color="#E65100" />
            <Text style={styles.vacationText}>{checkoutBlock}</Text>
          </View>
        ) : null}

        <CheckoutStepper currentStep={step} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={styles.block}>
              <AddressFormFields value={shippingAddress} onChange={setShippingAddress} />
            </View>
          )}

          {step >= 1 && (
            <>
              <View style={styles.addressCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrName}>{shippingAddress.name}</Text>
                  <Text style={styles.addrLine}>{shortAddressLine(shippingAddress)}</Text>
                  <Text style={styles.addrPhone}>
                    {formatPhoneDisplay(shippingAddress.phone || "", shippingAddress.countryCode)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStep(0)}>
                  <Text style={styles.changeBtn}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.productCard}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPh]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.selectedSize ? (
                    <Text style={styles.variant}>Size: {item.selectedSize}</Text>
                  ) : null}
                  <Text style={styles.seller}>Seller: {item.maisonName || "AURA"}</Text>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  <Text style={styles.deliveryEta}>
                    Delivery in {shopPrefs.expressDelivery ? "1–2 days" : `${getStoreProcessingDays() + 2}–${getStoreProcessingDays() + 5} days`} |{" "}
                    {shopPrefs.expressDelivery ? "Express ₹49" : "Free"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.couponRow} onPress={() => setCouponSheet(true)}>
                <Lucide name="ticket-outline" size={20} color={SHOP.primary} />
                <Text style={styles.couponLabel}>
                  {appliedCoupon ? `${appliedCoupon.code} applied` : "Apply Coupon"}
                </Text>
                <Lucide name="chevron-forward" size={18} color={SHOP.textSecondary} />
              </TouchableOpacity>

              <CheckoutPriceDetails
                totals={totals}
                itemCount={lineItems.reduce((s, i) => s + i.quantity, 0)}
                formatPrice={formatPrice}
              />
            </>
          )}

          {step === 2 && (
            <View style={styles.block}>
              <View style={styles.paySummary}>
                <Text style={styles.paySummaryTitle}>Total Amount</Text>
                <Text style={styles.paySummaryAmt}>{formatPrice(totals.total)}</Text>
                {appliedBankOffer ? (
                  <Text style={styles.payCashback}>
                    Bank cashback −{formatPrice(appliedBankOffer.discountAmount)}
                  </Text>
                ) : null}
                <Text style={styles.payFinal}>Pay {formatPrice(totals.total)}</Text>
              </View>

              <TouchableOpacity style={styles.emiBanner}>
                <Text style={styles.emiTitle}>Pay in EMI</Text>
                <Text style={styles.emiSub}>
                  No Cost EMI from {formatPrice(emiMonthly)}/month
                </Text>
              </TouchableOpacity>

              {savedMethods.length > 0 ? (
                <View style={styles.savedMethodsBlock}>
                  <Text style={styles.savedMethodsTitle}>Saved payment methods</Text>
                  {savedMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.savedMethodRow,
                        selectedSavedMethodId === method.id && styles.savedMethodRowActive,
                      ]}
                      onPress={() => {
                        setSelectedSavedMethodId(method.id);
                        const nextType = method.type === "CARD" ? "CARD" : "UPI";
                        setPaymentMethod(nextType);
                        setExpandedPayment(nextType);
                      }}
                    >
                      <Lucide
                        name={
                          method.type === "CARD"
                            ? "card-outline"
                            : method.type === "WALLET"
                              ? "wallet-outline"
                              : "phone-portrait-outline"
                        }
                        size={20}
                        color={SHOP.text}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.savedMethodLabel}>{method.label}</Text>
                        {method.last4 ? (
                          <Text style={styles.savedMethodSub}>•••• {method.last4}</Text>
                        ) : null}
                      </View>
                      {selectedSavedMethodId === method.id ? (
                        <Lucide name="checkmark-circle" size={20} color={SHOP.accent} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {paymentMethods.map((m) => (
                <View key={m.id} style={styles.payMethod}>
                  <TouchableOpacity
                    style={styles.payMethodHead}
                    onPress={() => {
                      setExpandedPayment(expandedPayment === m.id ? null : m.id);
                      setPaymentMethod(m.id);
                    }}
                  >
                    <Lucide name={m.icon as any} size={22} color={SHOP.text} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.payMethodTitle}>{m.title}</Text>
                      <Text style={styles.payMethodSub}>{m.sub}</Text>
                      {m.offer ? <Text style={styles.payOffer}>{m.offer}</Text> : null}
                    </View>
                    <Lucide
                      name={expandedPayment === m.id ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={SHOP.textSecondary}
                    />
                  </TouchableOpacity>
                  {expandedPayment === m.id && paymentMethod === m.id && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={handlePay}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <ActivityIndicator color={SHOP.accentText} />
                      ) : (
                        <Text style={styles.payBtnText}>
                          {m.id === "COD" ? "Place order" : `Pay ${formatPrice(totals.total)}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {step < 2 && (
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerPrice}>{formatPrice(totals.total)}</Text>
            </View>
            <TouchableOpacity style={styles.continueBtn} onPress={goNext}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <CouponPickerSheet
        visible={couponSheet}
        maisonId={maisonId}
        appliedCode={appliedCoupon?.code}
        onClose={() => setCouponSheet(false)}
        onApply={handleApplyCoupon}
        isApplying={isCheckingCoupon}
        error={couponError}
      />

      <PdpAddressSheet
        visible={addressSheet}
        address={shippingAddress}
        onClose={() => setAddressSheet(false)}
        onSave={setShippingAddress}
      />

      <CheckoutSuccess
        visible={successVisible}
        orderNumber={successDetails.orderNumber}
        amount={successDetails.amount}
        itemCount={successDetails.itemCount}
        onClose={() => {
          setSuccessVisible(false);
          router.replace("/shop");
        }}
        onTrackOrder={() => {
          setSuccessVisible(false);
          if (successDetails.orderId) {
            router.replace(`/account/track/${successDetails.orderId}` as any);
          } else {
            router.replace("/shop/orders");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHOP.bg },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: SHOP.text },
  link: { color: SHOP.primary, marginTop: 12, fontWeight: "700" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  stepLabel: { fontSize: 11, color: SHOP.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: "700", color: SHOP.text },
  vacationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF3E0",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FFCC80",
  },
  vacationText: { flex: 1, color: "#E65100", fontSize: 13, lineHeight: 18 },
  secureBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  secureText: { fontSize: 11, color: SHOP.green, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 120 },
  block: { paddingBottom: 16 },
  addressCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addrName: { fontWeight: "700", color: SHOP.text, fontSize: 14 },
  addrLine: { fontSize: 12, color: SHOP.textSecondary, marginTop: 4 },
  addrPhone: { fontSize: 12, color: SHOP.text, marginTop: 4 },
  changeBtn: { color: SHOP.primary, fontWeight: "700", fontSize: 13 },
  productCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 12,
  },
  thumb: { width: 72, height: 72, borderRadius: 6, backgroundColor: SHOP.surface },
  thumbPh: { alignItems: "center", justifyContent: "center" },
  productTitle: { fontSize: 14, fontWeight: "600", color: SHOP.text },
  variant: { fontSize: 12, color: SHOP.textSecondary, marginTop: 2 },
  seller: { fontSize: 11, color: SHOP.textMuted, marginTop: 4 },
  productPrice: { fontSize: 16, fontWeight: "800", color: SHOP.text, marginTop: 6 },
  deliveryEta: { fontSize: 12, color: SHOP.green, fontWeight: "600", marginTop: 4 },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
  },
  couponLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: SHOP.text },
  paySummary: {
    backgroundColor: SHOP.wowBlueLight,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  paySummaryTitle: { fontSize: 13, color: SHOP.textSecondary },
  paySummaryAmt: { fontSize: 22, fontWeight: "800", color: SHOP.text, marginTop: 4 },
  payCashback: { fontSize: 13, color: SHOP.green, fontWeight: "700", marginTop: 4 },
  payFinal: { fontSize: 15, fontWeight: "700", color: SHOP.primary, marginTop: 8 },
  emiBanner: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  emiTitle: { fontWeight: "700", fontSize: 14, color: SHOP.text },
  emiSub: { fontSize: 12, color: SHOP.textSecondary, marginTop: 4 },
  savedMethodsBlock: { marginBottom: 12 },
  savedMethodsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: SHOP.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  savedMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  savedMethodRowActive: {
    borderColor: SHOP.accent,
    backgroundColor: SHOP.wowBlueLight,
  },
  savedMethodLabel: { fontSize: 14, fontWeight: "600", color: SHOP.text },
  savedMethodSub: { fontSize: 12, color: SHOP.textSecondary, marginTop: 2 },
  payMethod: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  payMethodHead: { flexDirection: "row", alignItems: "center", padding: 14 },
  payMethodTitle: { fontSize: 14, fontWeight: "700", color: SHOP.text },
  payMethodSub: { fontSize: 11, color: SHOP.textSecondary, marginTop: 2 },
  payOffer: { fontSize: 11, color: SHOP.green, fontWeight: "600", marginTop: 4 },
  payBtn: {
    backgroundColor: SHOP.accent,
    margin: 12,
    marginTop: 0,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  payBtnText: { fontWeight: "800", fontSize: 15, color: SHOP.accentText },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: SHOP.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SHOP.border,
  },
  footerLabel: { fontSize: 11, color: SHOP.textSecondary },
  footerPrice: { fontSize: 18, fontWeight: "800", color: SHOP.text },
  continueBtn: {
    backgroundColor: SHOP.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  continueText: { fontWeight: "800", fontSize: 15, color: SHOP.accentText },
});
