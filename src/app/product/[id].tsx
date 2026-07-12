import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";
import { ShopProductDetail } from "@/components/shop/ShopProductDetail";
import { buildDefaultShippingAddress } from "@/lib/shopAddress";
import { loadPrimaryShippingAddress, savePrimaryShippingAddress } from "@/lib/shippingAddressStore";
import {
  getCategoryRelatedProducts,
  getCategorySectionMeta,
  getEffectivePdpPrice,
  getSimilarProducts,
  type BankOffer,
} from "@/lib/shopPdp";
import { fetchProductReviews, submitProductReview, type ProductReviewSummary } from "@/lib/shopReviews";
import { RateProductSheet } from "@/components/shop/RateProductSheet";
import { CountrySearchPicker } from "@/components/settings/CountrySearchPicker";
import { applyCountrySelection } from "@/lib/worldLocations";
import { loadEcosystemSettings } from "@/lib/ecosystemSettings";

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default || require("react-native-razorpay");
} catch (e) {
  console.warn("[Product] Razorpay native module not found. Payment simulator will be activated.");
}

const { width } = Dimensions.get("window");

const formatAddressString = (addr: any) => {
  if (typeof addr === "string") return addr;
  if (!addr) return "N/A";
  const namePart = addr.name ? `${addr.name} ` : "";
  const emailPart = addr.email ? `(${addr.email})\n` : "\n";
  const contactPart = (addr.countryCode && addr.phone) ? `${addr.countryCode} ${addr.phone}` : (addr.phone || "");
  const contactLine = contactPart ? `${contactPart}\n` : "";
  const streetPart = addr.address || "";
  const cityStateZip = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  const countryPart = addr.country ? `\n${addr.country}` : "";
  return `${namePart}${emailPart}${contactLine}${streetPart}\n${cityStateZip}${countryPart}`;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    products, 
    addToCart, 
    triggerHaptic,
    activeProfile,
    activeMaisonId,
    currentUser,
    initiateCheckout,
    verifyPayment,
    applyCoupon,
    wishlist,
    toggleWishlist,
    fetchWishlist,
    formatPrice
  } = useStore();

  // Redesign state additions
  const [themeMode, setThemeMode] = useState<"obsidian" | "cream">("obsidian");
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("Noir");
  const [selectedSize, setSelectedSize] = useState<string>("S");
  const [pinCode, setPinCode] = useState<string>("");
  const [pinChecked, setPinChecked] = useState<boolean>(false);
  const [detailsExpanded, setDetailsExpanded] = useState<boolean>(false);
  const [sizeGuideVisible, setSizeGuideVisible] = useState<boolean>(false);

  // Aura Fit™ AR Simulation state
  const [arModalVisible, setArModalVisible] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isInitializingLidar, setIsInitializingLidar] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);

  // Animation values for scanning line
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Colors config based on theme
  const colors = {
    bg: themeMode === "obsidian" ? "#080415" : "#fdf8f8",
    surface: themeMode === "obsidian" ? "#0b071e" : "#ffffff",
    surfaceBorder: themeMode === "obsidian" ? "rgba(255,255,255,0.06)" : "#c4c7c7",
    primary: themeMode === "obsidian" ? "#00f5ff" : "#000000",
    text: themeMode === "obsidian" ? "#ffffff" : "#1c1b1b",
    textMuted: themeMode === "obsidian" ? "rgba(255,255,255,0.45)" : "#5e5e5e",
    border: themeMode === "obsidian" ? "rgba(255,255,255,0.08)" : "#c4c7c7",
    primaryContainer: themeMode === "obsidian" ? "rgba(0, 245, 255, 0.1)" : "rgba(0,0,0,0.05)",
    primaryContainerText: themeMode === "obsidian" ? "#00f5ff" : "#000000",
    cardBg: themeMode === "obsidian" ? "#0b071e" : "#f1edec",
    inputBg: themeMode === "obsidian" ? "rgba(255,255,255,0.02)" : "#f7f3f2",
  };

  useEffect(() => {
    if (arModalVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [arModalVisible]);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280] // Maps to height of simulating AR frame
  });

  const userId = currentUser?.id || activeProfile?.userId || "patron_guest_sim";
  const isFavorited = wishlist.some((item: any) => item.id === id);

  useEffect(() => {
    if (userId && userId !== "patron_guest_sim") {
      fetchWishlist(userId);
    }
  }, [userId]);

  // 3-step checkout state variables
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: Shipping, 1: Settlement, 2: Review
  const [shippingAddress, setShippingAddress] = useState<any>(() =>
    buildDefaultShippingAddress(currentUser, activeProfile)
  );
  const [appliedBankOffer, setAppliedBankOffer] = useState<BankOffer | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState<any>(() =>
    buildDefaultShippingAddress(currentUser, activeProfile)
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [couponSheetVisible, setCouponSheetVisible] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rateSheetVisible, setRateSheetVisible] = useState(false);
  const [showBankOffers, setShowBankOffers] = useState(true);

  useEffect(() => {
    loadEcosystemSettings().then((s) => setShowBankOffers(s.shop.showBankOffers));
  }, []);

  useEffect(() => {
    (async () => {
      const addr = await loadPrimaryShippingAddress(currentUser, activeProfile);
      setShippingAddress(addr);
      setTempAddress(addr);
    })();
  }, [currentUser?.id, activeProfile?.userId]);

  useEffect(() => {
    if (currentUser || activeProfile) {
      setShippingAddress((prev: any) => ({
        ...buildDefaultShippingAddress(currentUser, activeProfile),
        ...prev,
        name: prev.name || currentUser?.name || activeProfile?.name || "",
        email: prev.email || currentUser?.email || activeProfile?.email || "",
        phone:
          prev.phone ||
          String(currentUser?.phone || activeProfile?.phone || "")
            .replace(/\D/g, "")
            .slice(-10),
      }));
    }
  }, [currentUser?.id, activeProfile?.id]);

  useEffect(() => {
    setAppliedBankOffer(null);
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }, [id]);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSimVisible, setPaymentSimVisible] = useState(false);
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState<any | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    orderNumber: "ORD-2026-0001",
    amount: 0,
    itemCount: 0,
    orderId: ""
  });

  const params = useLocalSearchParams<{ payment?: string; orderId?: string; amount?: string; orderNumber?: string; error?: string }>();
  
  useEffect(() => {
    if (params.payment === "success") {
      setSuccessDetails({
        orderNumber: params.orderNumber || "ORD-2026",
        amount: Number(params.amount) || 0,
        itemCount: 1,
        orderId: params.orderId || ""
      });
      setSuccessVisible(true);
      triggerHaptic("success");
      router.setParams({ payment: undefined, orderId: undefined, amount: undefined, orderNumber: undefined });
    } else if (params.payment === "failed") {
      Alert.alert("Payment Failed", params.error || "Verification failed.");
      router.setParams({ payment: undefined, error: undefined });
    } else if (params.payment === "cancelled") {
      Alert.alert("Payment Aborted", "Checkout cancelled.");
      router.setParams({ payment: undefined });
    }
  }, [params.payment]);

  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [fetchedProduct, setFetchedProduct] = useState<any | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    fetchProductReviews(String(id))
      .then(setReviewSummary)
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const refreshReviews = () => {
    if (!id) return;
    setReviewsLoading(true);
    fetchProductReviews(String(id))
      .then(setReviewSummary)
      .finally(() => setReviewsLoading(false));
  };

  const handleSubmitReview = async (rating: number, content: string) => {
    const userId = currentUser?.id || activeProfile?.userId;
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to submit a review.");
      throw new Error("Sign in required");
    }
    const res = await submitProductReview({
      userId,
      artifactId: String(id),
      rating,
      content,
    });
    if (!res.success) {
      throw new Error(res.error || "Could not submit review.");
    }
    triggerHaptic("success");
    refreshReviews();
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingProduct(true);
      try {
        const { fetchProductById } = await import("@/lib/profileApi");
        const remote = await fetchProductById(String(id));
        if (!cancelled && remote) setFetchedProduct(remote);
      } catch {
        /* fallback to store cache */
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const cachedProduct = products.find((p) => p.id === id);
  const product = fetchedProduct || cachedProduct;

  if (loadingProduct && !product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#2874F0" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", padding: 24 }}>
        <Text style={{ color: "#212121", fontSize: 18, fontWeight: "600" }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#2874F0" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const checkoutUnitPrice = getEffectivePdpPrice(product, appliedBankOffer, appliedCoupon);

  const calculateDiscount = () => {
    const base = product.price ?? 0;
    const offerAdjusted = getEffectivePdpPrice(product, appliedBankOffer, null);
    if (!appliedCoupon) return base - offerAdjusted;
    if (appliedCoupon.type === "PERCENTAGE") {
      return offerAdjusted * (appliedCoupon.discount / 100);
    }
    return Math.min(appliedCoupon.discount, offerAdjusted);
  };

  const calculateTax = () => {
    const base = checkoutUnitPrice;
    return base * 0.18;
  };

  const calculateTotal = () => {
    return checkoutUnitPrice + calculateTax() + 1500;
  };

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride || couponCode).trim();
    if (!code) return;
    setCouponCode(code);
    setIsCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await applyCoupon({
        code,
        maisonId: product?.maison?.id || activeMaisonId,
      });
      if (res.success && res.valid) {
        setAppliedCoupon(res);
        setCouponError("");
        setCouponSheetVisible(false);
        triggerHaptic("success");
      } else {
        setCouponError(res.error || "Invalid coupon code.");
        setAppliedCoupon(null);
        triggerHaptic("medium");
      }
    } catch (err) {
      setCouponError("Could not validate coupon.");
      setAppliedCoupon(null);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    triggerHaptic("heavy");
    try {
      const payloadCartItems = [{
        artifactId: product.id,
        quantity: 1,
        price: checkoutUnitPrice,
      }];

      const res = await initiateCheckout({
        userId: currentUser?.id || activeProfile?.userId || "patron_guest_sim",
        cartItems: payloadCartItems,
        shippingAddress: shippingAddress,
        couponCode: appliedCoupon?.code
      });

      if (!res.success) {
        Alert.alert("Checkout Error", res.error || "Please try again.");
        setIsCheckingOut(false);
        return;
      }

      setActiveRazorpayOrder(res);

      if (paymentMethod === "COD") {
        setIsCheckingOut(false);
        const verifyRes = await verifyPayment({
          razorpayOrderId: res.razorpayOrderId,
          razorpayPaymentId: "pay_cod",
          razorpaySignature: "sig_cod"
        });
        if (verifyRes.success) {
          setCheckoutVisible(false);
          setSuccessDetails({
            orderNumber: verifyRes.orderNumber || "ORD-COD-2026",
            amount: verifyRes.amount || calculateTotal(),
            itemCount: 1,
            orderId: verifyRes.orderId || res.orderId || ""
          });
          setSuccessVisible(true);
          triggerHaptic("success");
        } else {
          Alert.alert("Verification Error", verifyRes.error || "Invalid response.");
        }
        return;
      }

      const isRazorpayNativeAvailable = RazorpayCheckout && (res.razorpayOrderId && !res.razorpayOrderId.startsWith("order_sim_"));

      if (isRazorpayNativeAvailable) {
        const options = {
          description: `Acquisition: ${product.title}`,
          image: images[0] || '',
          currency: 'INR',
          key: res.key,
          amount: res.amount,
          name: 'AURAGRAM',
          order_id: res.razorpayOrderId,
          prefill: {
            email: shippingAddress?.email || currentUser?.email || 'luxury@auragram.vip',
            contact: shippingAddress?.phone ? `${shippingAddress.countryCode || ''}${shippingAddress.phone}` : (currentUser?.phone || '9999999999'),
            name: shippingAddress?.name || currentUser?.name || activeProfile?.name || 'Elite Patron'
          },
          theme: {
            color: '#080415'
          }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
          const verifyRes = await verifyPayment({
            razorpayOrderId: res.razorpayOrderId,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature
          });

          if (verifyRes.success) {
            setCheckoutVisible(false);
            setSuccessDetails({
              orderNumber: verifyRes.orderNumber || "ORD-NATIVE-2026",
              amount: verifyRes.amount || calculateTotal(),
              itemCount: 1,
              orderId: verifyRes.orderId || res.orderId || ""
            });
            setSuccessVisible(true);
            triggerHaptic("success");
          } else {
            Alert.alert("Verification Error", verifyRes.error || "Invalid response.");
          }
        }).catch((error: any) => {
          console.warn("[Razorpay Native error]", error);
          Alert.alert("Payment Canceled", "Direct gateway payment was canceled.");
        }).finally(() => {
          setIsCheckingOut(false);
        });
      } else {
        setIsCheckingOut(false);
        setCheckoutVisible(false); // Hide checkout modal to prevent overlapping modals
        setPaymentSimVisible(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Fulfillment Error", "Checkout connection failed.");
      setIsCheckingOut(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!activeRazorpayOrder) return;
    setIsCheckingOut(true);
    triggerHaptic("heavy");
    try {
      const verifyRes = await verifyPayment({
        razorpayOrderId: activeRazorpayOrder.razorpayOrderId,
        razorpayPaymentId: `pay_sim_${Math.random().toString(36).substring(2, 11)}`,
        razorpaySignature: `sig_sim_${Math.random().toString(36).substring(2, 11)}`
      });

      if (verifyRes.success) {
        setPaymentSimVisible(false);
        setCheckoutVisible(false);
        setSuccessDetails({
          orderNumber: verifyRes.orderNumber || "ORD-SIM-2026",
          amount: verifyRes.amount || calculateTotal(),
          itemCount: 1,
          orderId: verifyRes.orderId || activeRazorpayOrder.orderId || ""
        });
        setSuccessVisible(true);
        triggerHaptic("success");
      } else {
        Alert.alert("Verification Error", verifyRes.error || "Unknown error");
      }
    } catch (e) {
      Alert.alert("Connection Error", "Verification connection failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOpenWebCheckout = async () => {
    if (!activeRazorpayOrder?.orderId) {
      Alert.alert("Checkout Error", "Missing order identifier. Please re-initiate checkout.");
      return;
    }
    triggerHaptic("heavy");
    setPaymentSimVisible(false);
    const paymentUrl = `${API_HOST}/checkout/pay-mobile?orderId=${activeRazorpayOrder.orderId}&returnPath=product/${id}`;
    try {
      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch (err) {
      Alert.alert("Browser Error", "Could not launch secure web browser.");
    }
  };

  const handleAcquire = () => {
    triggerHaptic("heavy");
    setCheckoutVisible(true);
    setActiveStep(0);
  };

  const handleInstantAcquire = () => {
    triggerHaptic("success");
    setCheckoutVisible(true);
    setActiveStep(2); // Go straight to step 3 review
  };

  const handleToggleWishlist = async () => {
    triggerHaptic("medium");
    if (userId) {
      await toggleWishlist(userId, product.id);
    }
  };

  // Aura Fit™ Scanning loop
  const handleStartScan = () => {
    triggerHaptic("medium");
    setIsInitializingLidar(true);
    setScanComplete(false);
    
    setTimeout(() => {
      setIsInitializingLidar(false);
      setIsScanning(true);
      triggerHaptic("success");
      
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        triggerHaptic("success");
        Alert.alert(
          "Aura Fit™ Calibration Complete",
          "Silhouette calibrated with millimeter precision using LiDAR.\nRecommended Size: S."
        );
      }, 3000);
    }, 2000);
  };

  const specList = Object.entries(product.arMetadata || {}).map(([key, val]) => ({
    label: key,
    value: typeof val === "string" ? val : JSON.stringify(val),
  }));

  const sizeOptions =
    Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.map((v: { title: string }) => v.title)
      : ["XS", "S", "M", "L", "XL"];

  const maisonName = product.maison?.name || "AURA LUXURY";
  const maisonId = product.maison?.id || "aura_luxury";
  const similarProducts = getSimilarProducts(product, products, 6);
  const categorySection = getCategorySectionMeta(product);
  const similarIds = new Set(similarProducts.map((p) => p.id));
  const categoryProducts = getCategoryRelatedProducts(product, products, 12).filter(
    (p) => !similarIds.has(p.id)
  );

  const openCategoryListing = () => {
    triggerHaptic("light");
    const sub = categorySection.subcategoryId
      ? `?subcategory=${encodeURIComponent(categorySection.subcategoryId)}`
      : "";
    router.push(`/shop/category/${categorySection.slug}${sub}` as any);
  };

  const handleShopAddToCart = (opts?: { color?: string; size?: string }) => {
    addToCart({
      ...product,
      selectedColor: opts?.color,
      selectedSize: opts?.size,
    });
    triggerHaptic("heavy");
  };

  const handleShopBuyNow = (opts?: { color?: string; size?: string }) => {
    triggerHaptic("heavy");
    const q = new URLSearchParams({ productId: String(product.id) });
    if (opts?.color) q.set("color", opts.color);
    if (opts?.size) q.set("size", opts.size);
    router.push(`/shop/checkout?${q.toString()}` as any);
  };

  const handleShopBuyWithEmi = (opts?: { color?: string; size?: string }) => {
    triggerHaptic("heavy");
    const q = new URLSearchParams({
      productId: String(product.id),
      paymentMethod: "EMI",
    });
    if (opts?.color) q.set("color", opts.color);
    if (opts?.size) q.set("size", opts.size);
    router.push(`/shop/checkout?${q.toString()}` as any);
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  return (
    <>
      <ShopProductDetail
        product={product}
        similarProducts={similarProducts}
        categoryProducts={categoryProducts}
        categorySection={categorySection}
        onViewAllCategory={openCategoryListing}
        shippingAddress={shippingAddress}
        onSaveAddress={setShippingAddress}
        appliedBankOffer={appliedBankOffer}
        onApplyBankOffer={setAppliedBankOffer}
        appliedCoupon={appliedCoupon}
        couponCode={couponCode}
        onCouponCodeChange={setCouponCode}
        onApplyCoupon={() => handleApplyCoupon()}
        onClearCoupon={handleClearCoupon}
        couponError={couponError}
        isCheckingCoupon={isCheckingCoupon}
        reviewSummary={reviewSummary}
        reviewsLoading={reviewsLoading}
        onRateReview={() => {
          triggerHaptic("light");
          if (!currentUser?.id && !activeProfile?.userId) {
            Alert.alert("Sign in required", "Sign in to rate this product.");
            return;
          }
          setRateSheetVisible(true);
        }}
        onOpenCoupons={() => setCouponSheetVisible(true)}
        couponSheetVisible={couponSheetVisible}
        onCloseCoupons={() => setCouponSheetVisible(false)}
        onApplyCouponCode={handleApplyCoupon}
        maisonId={maisonId}
        onAddToCart={handleShopAddToCart}
        onBuyNow={handleShopBuyNow}
        onBuyWithEmi={handleShopBuyWithEmi}
        showBankOffers={showBankOffers}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isFavorited}
      />

      <RateProductSheet
        visible={rateSheetVisible}
        productTitle={product.title}
        onClose={() => setRateSheetVisible(false)}
        onSubmit={handleSubmitReview}
      />

      {/* 3-Step Checkout Modal Drawer */}
        <Modal visible={checkoutVisible} transparent animationType="slide" onRequestClose={() => setCheckoutVisible(false)}>
          <View style={styles.simOverlay}>
            <View style={[styles.simContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <View style={styles.simHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lucide name="shield-checkmark" size={22} color={colors.primary} />
                  <Text style={[styles.simTitle, { color: colors.primary }]}>AURA SECURED CHECKOUT</Text>
                </View>
                <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                  <Lucide name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalStepsRow}>
                <Text style={[styles.modalStepText, activeStep === 0 && { color: colors.primary }]}>Address</Text>
                <Lucide name="chevron-forward" size={12} color={colors.border} />
                <Text style={[styles.modalStepText, activeStep === 1 && { color: colors.primary }]}>Gateway</Text>
                <Lucide name="chevron-forward" size={12} color={colors.border} />
                <Text style={[styles.modalStepText, activeStep === 2 && { color: colors.primary }]}>Audit</Text>
              </View>

              {activeStep === 0 && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Fulfillment Destination</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Indicate the delivery node coordinates for physical dispatch.</Text>
                  {isEditingAddress ? (
                    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                      <View style={[styles.addressEditBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        
                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
                          <TextInput
                            style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={tempAddress.name}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, name: val }))}
                            placeholder="Enter your full name"
                            placeholderTextColor={colors.textMuted}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email Address</Text>
                          <TextInput
                            style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={tempAddress.email}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, email: val }))}
                            placeholder="luxury@auragram.vip"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Country / Region</Text>
                          <TouchableOpacity 
                            style={[styles.countryPickerTrigger, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                            onPress={() => { setShowCountryPicker(true); triggerHaptic("light"); }}
                          >
                            <Text style={[styles.countryPickerTriggerText, { color: colors.text }]}>
                              {tempAddress.country ? `${tempAddress.country}` : "Select Country"}
                            </Text>
                            <Lucide name="chevron-down" size={16} color={colors.primary} />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Mobile Number</Text>
                          <View style={styles.phoneInputRow}>
                            <TouchableOpacity 
                              style={[styles.phoneCodeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                              onPress={() => { setShowCountryPicker(true); triggerHaptic("light"); }}
                            >
                              <Text style={[styles.phoneCodeText, { color: colors.text }]}>{tempAddress.countryCode || "+91"}</Text>
                              <Lucide name="chevron-down" size={10} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.phoneNoInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                              value={tempAddress.phone}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, phone: val.replace(/[^0-9]/g, "") }))}
                              placeholder="9999999999"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="phone-pad"
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Street Address</Text>
                          <TextInput
                            style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, minHeight: 60, textAlignVertical: "top" }]}
                            value={tempAddress.address}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, address: val }))}
                            placeholder="Penthouse Suite 8, Aurelia Towers"
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={2}
                          />
                        </View>

                        <View style={styles.formRow}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>City</Text>
                            <TextInput
                              style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                              value={tempAddress.city}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, city: val }))}
                              placeholder="Mumbai"
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>State</Text>
                            <TextInput
                              style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                              value={tempAddress.state}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, state: val }))}
                              placeholder="Maharashtra"
                              placeholderTextColor={colors.textMuted}
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Pincode / Postal Code</Text>
                          <TextInput
                            style={[styles.formInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={tempAddress.postalCode}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, postalCode: val }))}
                            placeholder="400001"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                          />
                        </View>

                        <TouchableOpacity 
                          style={[styles.saveAddressBtn, { backgroundColor: colors.primary }]} 
                          onPress={() => {
                            if (!tempAddress.name || !tempAddress.phone || !tempAddress.address || !tempAddress.city || !tempAddress.state || !tempAddress.postalCode) {
                              Alert.alert("Required Fields", "Please populate all destination parameters.");
                              return;
                            }
                            setShippingAddress(tempAddress);
                            savePrimaryShippingAddress(tempAddress).catch(() => {});
                            setIsEditingAddress(false);
                            triggerHaptic("light");
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.saveAddressBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Lock Node Coordinates</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={[styles.addressBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Lucide name="location" size={22} color={colors.primary} />
                      <View style={styles.addressInfo}>
                        <Text style={[styles.addressText, { color: colors.text }]}>{formatAddressString(shippingAddress)}</Text>
                        <TouchableOpacity onPress={() => { setIsEditingAddress(true); setTempAddress({ ...shippingAddress }); triggerHaptic("light"); }}>
                          <Text style={[styles.editAddressBtn, { color: colors.primary }]}>Modify Address Node</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setCheckoutVisible(false)}>
                      <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => { triggerHaptic("light"); setActiveStep(1); }}>
                      <Text style={[styles.nextBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Next Step</Text>
                      <Lucide name="arrow-forward" size={16} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Settlement Gateway</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Select your preferred ledger verification standard.</Text>
                  
                  <TouchableOpacity 
                    style={[styles.gatewayOption, paymentMethod === "RAZORPAY" && { borderColor: colors.primary }, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("RAZORPAY"); }}
                    activeOpacity={0.8}
                  >
                    <Lucide name="card" size={24} color={paymentMethod === "RAZORPAY" ? colors.primary : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.gatewayTitle, { color: colors.text }]}>Razorpay Gateway (UPI / Cards)</Text>
                      <Text style={[styles.gatewayDesc, { color: colors.textMuted }]}>Cryptographically signed digital payment protocols.</Text>
                    </View>
                    <View style={[styles.radioCircle, paymentMethod === "RAZORPAY" && { borderColor: colors.primary }]}>
                      {paymentMethod === "RAZORPAY" && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayOption, paymentMethod === "COD" && { borderColor: colors.primary }, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("COD"); }}
                    activeOpacity={0.8}
                  >
                    <Lucide name="cash" size={24} color={paymentMethod === "COD" ? colors.primary : colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.gatewayTitle, { color: colors.text }]}>Cash on Delivery (COD)</Text>
                      <Text style={[styles.gatewayDesc, { color: colors.textMuted }]}>Settle in cash at the door. Requires local node check.</Text>
                    </View>
                    <View style={[styles.radioCircle, paymentMethod === "COD" && { borderColor: colors.primary }]}>
                      {paymentMethod === "COD" && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => { triggerHaptic("light"); setActiveStep(0); }}>
                      <Lucide name="arrow-back" size={16} color={colors.text} />
                      <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => { triggerHaptic("light"); setActiveStep(2); }}>
                      <Text style={[styles.nextBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Next Step</Text>
                      <Lucide name="arrow-forward" size={16} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Acquisition Audit</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Validate coupon codes and finalize item settlement parameters.</Text>
                  
                  <View style={styles.couponRow}>
                    <TextInput
                      style={[styles.couponInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                      placeholder="ENTER PRIVILEGE CODE"
                      placeholderTextColor={colors.textMuted}
                      value={couponCode}
                      onChangeText={(val) => {
                        setCouponCode(val);
                        setCouponError("");
                      }}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.couponBtn, isCheckingCoupon && styles.couponBtnDisabled, { backgroundColor: colors.text }]}
                      onPress={handleApplyCoupon}
                      disabled={isCheckingCoupon}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.couponBtnText, { color: colors.bg }]}>
                        {isCheckingCoupon ? "Securing..." : "Validate"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
                  {appliedCoupon ? (
                    <View style={styles.couponSuccessBadge}>
                      <Lucide name="checkmark-circle" size={16} color="#00d4aa" />
                      <Text style={styles.couponSuccessText}>
                        Privilege Activated: {appliedCoupon.code} (-
                        {appliedCoupon.type === "PERCENTAGE" 
                          ? `${appliedCoupon.discount}%` 
                          : formatPrice(appliedCoupon.discount)}
                        )
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.priceBreakdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Artifact Value</Text>
                      <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatPrice(product.price)}</Text>
                    </View>
                    {appliedCoupon && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: "#00d4aa" }]}>Discount Applied</Text>
                        <Text style={[styles.breakdownValue, { color: "#00d4aa" }]}>-{formatPrice(calculateDiscount())}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Import Duty & GST (18%)</Text>
                      <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatPrice(calculateTax())}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>Secured Node Courier</Text>
                      <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatPrice(1500)}</Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                      <Text style={[styles.breakdownTotalLabel, { color: colors.text }]}>Total Price</Text>
                      <Text style={[styles.breakdownTotalValue, { color: colors.primary }]}>{formatPrice(calculateTotal())}</Text>
                    </View>
                  </View>

                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => { triggerHaptic("light"); setActiveStep(1); }}>
                      <Lucide name="arrow-back" size={16} color={colors.text} />
                      <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.checkoutBtn, isCheckingOut && styles.checkoutBtnDisabled, { backgroundColor: colors.primary }]} 
                      onPress={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <ActivityIndicator color={themeMode === "obsidian" ? "#080415" : "#ffffff"} size="small" />
                      ) : (
                        <>
                          <Text style={[styles.checkoutText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Authenticate Purchase</Text>
                          <Lucide name="shield-checkmark" size={18} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <CountrySearchPicker
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                title="Select country"
                onSelectIso={(iso) => {
                  setTempAddress((prev: any) => ({
                    ...prev,
                    ...applyCountrySelection(iso, prev),
                  }));
                  triggerHaptic("light");
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Simulated Payment Gateway Modal */}
        <Modal visible={paymentSimVisible} transparent animationType="slide" onRequestClose={() => { setPaymentSimVisible(false); setCheckoutVisible(true); }}>
          <View style={styles.simOverlay}>
            <View style={[styles.simContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <View style={styles.simHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lucide name="shield-checkmark" size={22} color={colors.primary} />
                  <Text style={[styles.simTitle, { color: colors.primary }]}>AURAGRAM PAYMENT NODE</Text>
                </View>
                <TouchableOpacity onPress={() => { setPaymentSimVisible(false); setCheckoutVisible(true); triggerHaptic("light"); }}>
                  <Lucide name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.simSubtitle, { color: colors.textMuted }]}>Test Mode Simulation · Safe Sandbox Environment</Text>

              <View style={[styles.simCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.simCardLabel, { color: colors.textMuted }]}>Total Due</Text>
                <Text style={[styles.simCardAmount, { color: colors.primary }]}>{formatPrice(calculateTotal())}</Text>
                
                <View style={styles.simDetailRow}>
                  <Text style={[styles.simDetailLabel, { color: colors.textMuted }]}>Order ID</Text>
                  <Text style={[styles.simDetailVal, { color: colors.text }]}>{activeRazorpayOrder?.razorpayOrderId || "N/A"}</Text>
                </View>
                
                <View style={styles.simDetailRow}>
                  <Text style={[styles.simDetailLabel, { color: colors.textMuted }]}>Description</Text>
                  <Text style={[styles.simDetailVal, { color: colors.text }]}>AURAGRAM Luxury Attire Casket</Text>
                </View>
              </View>

              <View style={[styles.simInstructions, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.simInstructionText, { color: colors.textMuted }]}>
                  Choose whether to confirm via the real Razorpay standard gateway check on web, or bypass instantly using the sandbox simulation.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.simPayBtn, isCheckingOut && styles.simPayBtnDisabled, { backgroundColor: colors.primary }]}
                onPress={handleOpenWebCheckout}
                disabled={isCheckingOut}
                activeOpacity={0.8}
              >
                {isCheckingOut ? (
                  <Text style={[styles.simPayBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Connecting Gateway...</Text>
                ) : (
                  <>
                    <Text style={[styles.simPayBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Open Web Checkout (Real Gateway)</Text>
                    <Lucide name="card-sharp" size={18} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simPayBtnSecondary, isCheckingOut && styles.simPayBtnDisabled, { borderColor: colors.primary }]}
                onPress={handleSimulateSuccess}
                disabled={isCheckingOut}
                activeOpacity={0.8}
              >
                <Text style={[styles.simPayBtnTextSecondary, { color: colors.primary }]}>Sandbox Simulation Bypass</Text>
                <Lucide name="arrow-forward-sharp" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Aura Fit™ AR Simulation Viewport Modal */}
        <Modal visible={arModalVisible} transparent animationType="slide" onRequestClose={() => setArModalVisible(false)}>
          <View style={styles.simOverlay}>
            <View style={[styles.simContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.simHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lucide name="aperture" size={22} color={colors.primary} />
                  <Text style={[styles.simTitle, { color: colors.primary }]}>AURA FIT™ LIDAR VIEWPORT</Text>
                </View>
                <TouchableOpacity onPress={() => setArModalVisible(false)}>
                  <Lucide name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* simulated camera frame */}
              <View style={[styles.arViewport, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <ImageBackground 
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIrM_fQPMyw3qRmTcqEIn2AplkCcbxTY61zUdIckpIhqWyuS8jRruZyWKWlz9b7InrxkPAXx15ESI8pLb4o4IN9bKQLU-rhWOR0CCslioXY8moLiRK45Gzx-yUD1pEii7VmGIg-3sz0jzqvl94igQ8-zS7bwb3y7NG6XhjYosA86znGmGqpsdnq3gZaGf7CAATu65fVUgAKKx_FJijYhBnTESVQqxcWknvDxV252vxQS0wjQb3DoN6d1OhUoU7jsTW9_t5Ii6xsnc" }} 
                  style={StyleSheet.absoluteFillObject}
                  imageStyle={{ opacity: 0.35, tintColor: themeMode === "cream" ? undefined : "#00f5ff" }}
                />

                {/* Grid Overlay */}
                <View style={[styles.arOverlay, { opacity: 0.15 }]}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={[styles.arGridLineH, { top: `${(i + 1) * 16}%`, backgroundColor: colors.text }]} />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={[styles.arGridLineV, { left: `${(i + 1) * 16}%`, backgroundColor: colors.text }]} />
                  ))}
                </View>

                {/* Brackets */}
                <View style={styles.arBrackets}>
                  <View style={[styles.bracketTL, { borderColor: colors.primary }]} />
                  <View style={[styles.bracketTR, { borderColor: colors.primary }]} />
                  <View style={[styles.bracketBL, { borderColor: colors.primary }]} />
                  <View style={[styles.bracketBR, { borderColor: colors.primary }]} />
                </View>

                {/* Scanning line animation */}
                {isScanning && (
                  <Animated.View 
                    style={[
                      styles.scanBar, 
                      { 
                        transform: [{ translateY: scanTranslateY }],
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        shadowOpacity: 0.8,
                        shadowRadius: 10
                      }
                    ]} 
                  />
                )}

                {/* Center scan guides */}
                <View style={styles.arGuideCenter}>
                  <Lucide 
                    name={scanComplete ? "checkmark-circle" : (isScanning ? "sync-outline" : "videocam-outline")} 
                    size={38} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.arGuideCenterText, { color: colors.text }]}>
                    {isInitializingLidar 
                      ? "Initializing LiDAR..." 
                      : (isScanning 
                        ? "Scanning Silhouette..." 
                        : (scanComplete 
                          ? "Calibration Complete!" 
                          : "Align Silhouette inside Frame"))}
                  </Text>
                </View>

                {/* Floating telemetry tags */}
                {isScanning || scanComplete ? (
                  <>
                    <View style={[styles.arFloatTagDepth, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.arFloatTagText, { color: colors.text }]}>DEPTH: <Text style={{ fontWeight: "bold", color: colors.primary }}>1.28m</Text></Text>
                    </View>
                    <View style={[styles.arFloatTagWidth, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.arFloatTagText, { color: colors.text }]}>WIDTH: <Text style={{ fontWeight: "bold", color: colors.primary }}>0.45m</Text></Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Information Panel */}
              <View style={[styles.arTechCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.arTechHeader}>
                  <Lucide name="sparkles" size={18} color={colors.primary} />
                  <Text style={[styles.arTechTitle, { color: colors.text }]}>Aura Fit™ Technology</Text>
                  <Text style={[styles.arTechAccuracy, { color: colors.primary }]}>99.8% Precision</Text>
                </View>
                <Text style={[styles.arTechDesc, { color: colors.textMuted }]}>
                  Our proprietary engine maps your ambient depth and silhouette contours via LiDAR telemetry, matching measurements against the material elasticity profiles.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  style={[styles.simPayBtn, isInitializingLidar && { opacity: 0.6 }, { backgroundColor: colors.primary }]}
                  onPress={handleStartScan}
                  disabled={isInitializingLidar || isScanning}
                >
                  {isInitializingLidar ? (
                    <ActivityIndicator color={themeMode === "obsidian" ? "#080415" : "#ffffff"} size="small" />
                  ) : (
                    <>
                      <Lucide name="pulse" size={18} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                      <Text style={[styles.simPayBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>
                        {scanComplete ? "Recalibrate Silhouette" : "Start LiDAR Scan"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simPayBtnSecondary, { borderColor: colors.border }]}
                  onPress={() => { triggerHaptic("light"); setSizeGuideVisible(true); }}
                >
                  <Text style={[styles.simPayBtnTextSecondary, { color: colors.text }]}>View Size Chart Ledger</Text>
                  <Lucide name="list-outline" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Size Guide chart modal */}
        <Modal visible={sizeGuideVisible} transparent animationType="fade" onRequestClose={() => setSizeGuideVisible(false)}>
          <View style={styles.simOverlay}>
            <View style={[styles.sizeGuideModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.pickerTitle, { color: colors.primary }]}>AURA Size Chart</Text>
                <TouchableOpacity onPress={() => setSizeGuideVisible(false)}>
                  <Lucide name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.simSubtitle, { color: colors.textMuted, marginBottom: 12 }]}>All metrics listed represent garment dimensions in inches.</Text>

              <View style={[styles.sizeChartTable, { borderColor: colors.border }]}>
                <View style={[styles.sizeChartRow, { backgroundColor: colors.inputBg, borderBottomWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.sizeChartHeaderCell, { color: colors.text }]}>Size</Text>
                  <Text style={[styles.sizeChartHeaderCell, { color: colors.text }]}>Chest</Text>
                  <Text style={[styles.sizeChartHeaderCell, { color: colors.text }]}>Waist</Text>
                  <Text style={[styles.sizeChartHeaderCell, { color: colors.text }]}>Sleeve</Text>
                </View>

                {[
                  { sz: "XS", chest: "34-36", waist: "28-30", sleeve: "31-32" },
                  { sz: "S", chest: "36-38", waist: "30-32", sleeve: "32-33" },
                  { sz: "M", chest: "38-40", waist: "32-34", sleeve: "33-34" },
                  { sz: "L", chest: "40-42", waist: "34-36", sleeve: "34-35" },
                  { sz: "XL", chest: "42-44", waist: "36-38", sleeve: "35-36" }
                ].map((row, idx) => (
                  <View key={row.sz} style={[styles.sizeChartRow, idx < 4 && { borderBottomWidth: 1, borderColor: colors.border }]}>
                    <Text style={[styles.sizeChartCell, { color: colors.text, fontWeight: "bold" }]}>{row.sz}</Text>
                    <Text style={[styles.sizeChartCell, { color: colors.textMuted }]}>{row.chest}</Text>
                    <Text style={[styles.sizeChartCell, { color: colors.textMuted }]}>{row.waist}</Text>
                    <Text style={[styles.sizeChartCell, { color: colors.textMuted }]}>{row.sleeve}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.simPayBtn, { backgroundColor: colors.text, marginTop: 20 }]}
                onPress={() => setSizeGuideVisible(false)}
              >
                <Text style={[styles.simPayBtnText, { color: colors.bg }]}>Close Ledger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Premium Checkout Success Screen Overlay */}
        <CheckoutSuccess
          visible={successVisible}
          onClose={() => setSuccessVisible(false)}
          onTrackOrder={() => {
            setSuccessVisible(false);
            if (successDetails.orderId) {
              router.push(`/account/track/${successDetails.orderId}`);
            } else {
              router.push("/account");
            }
          }}
          orderNumber={successDetails.orderNumber}
          amount={successDetails.amount}
          itemCount={successDetails.itemCount}
        />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  favActive: {
    borderColor: "#ff3366",
    backgroundColor: "rgba(255,51,102,0.05)",
  },
  navTitle: {
    fontSize: 15.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  navRight: {
    flexDirection: "row",
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  galleryContainer: {
    width: width,
    height: 380,
    position: "relative",
  },
  galleryScrollView: {
    flex: 1,
  },
  galleryMainImg: {
    width: width,
    height: "100%",
    resizeMode: "cover",
  },
  galleryOverlayTags: {
    position: "absolute",
    bottom: 20,
    left: 24,
    flexDirection: "row",
    gap: 8,
  },
  galleryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  galleryTagText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dotsRow: {
    position: "absolute",
    bottom: 20,
    right: 24,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  narrativeContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  breadcrumbActive: {
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  vibeText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serialText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  titleBlock: {
    marginTop: 18,
  },
  maisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  maisonLabel: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  luxuryHeading: {
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 8,
    lineHeight: 38,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  starsBox: {
    flexDirection: "row",
  },
  starIcon: {
    marginRight: 1,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: "bold",
  },
  reviewCount: {
    fontSize: 12,
  },
  matricesRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 36,
  },
  matrixCell: {
    flex: 1,
  },
  matrixLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matrixVal: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  auragramBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  auragramVal: {
    fontSize: 24,
    fontWeight: "bold",
  },
  urgencyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  selectorSection: {
    marginTop: 24,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  colorPillsRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorPillBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sizeGuideLink: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  sizePillsRow: {
    flexDirection: "row",
    gap: 10,
  },
  sizePillBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sizePillText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  estimatorSection: {
    marginTop: 24,
  },
  estimatorRow: {
    flexDirection: "row",
    gap: 10,
  },
  estimatorInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  estimatorBtn: {
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  estimatorBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  estimatorFeedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  estimatorFeedbackText: {
    fontSize: 12.5,
    fontWeight: "bold",
  },
  accordionSection: {
    marginTop: 20,
    paddingVertical: 12,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  accordionBody: {
    marginTop: 10,
    gap: 16,
  },
  accordionDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  specsGrid: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  specLabel: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13.5,
    fontWeight: "bold",
  },
  fulfillmentGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  fulfillBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  fulfillTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fulfillDesc: {
    fontSize: 10.5,
    marginTop: 2,
  },
  styleWithSection: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  bentoMiniLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#858383",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bentoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  bentoCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  bentoCardImg: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  bentoAddBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  bentoCardInfo: {
    padding: 10,
  },
  bentoCardTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  bentoCardPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  reelsSection: {
    marginTop: 32,
  },
  reelsRow: {
    flexDirection: "row",
  },
  reelCard: {
    width: 130,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  reelImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  reelOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
    padding: 10,
  },
  reelHandle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  reviewsSection: {
    marginTop: 32,
    paddingTop: 24,
  },
  reviewsSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  reviewsSummaryLeft: {
    gap: 4,
  },
  reviewsAvgText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  writeReviewBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    gap: 4,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewAuthor: {
    fontSize: 13.5,
    fontWeight: "bold",
  },
  reviewDate: {
    fontSize: 11.5,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tryOnContainer: {
    marginTop: 36,
  },
  tryOnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 26,
    gap: 8,
  },
  tryOnText: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  checkoutActions: {
    marginTop: 12,
    gap: 12,
  },
  primaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 32,
    gap: 8,
  },
  primaryAcquireText: {
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  secondaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 32,
    gap: 8,
  },
  secLabel: {
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secVal: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  simOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  simContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  simHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  simTitle: {
    fontSize: 15.5,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  simSubtitle: {
    fontSize: 12.5,
    marginTop: -8,
  },
  simCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  simCardLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  simCardAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  simDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  simDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  simDetailVal: {
    fontSize: 13,
    fontWeight: "bold",
  },
  simInstructions: {
    borderRadius: 14,
    padding: 14,
  },
  simInstructionText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  simPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  simPayBtnText: {
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  simPayBtnDisabled: {
    opacity: 0.4,
  },
  modalStepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalStepText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -8,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addressInfo: {
    flex: 1,
    gap: 4,
  },
  addressText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "400",
  },
  editAddressBtn: {
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  addressEditBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  saveAddressBtn: {
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  saveAddressBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gatewayOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  gatewayTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  gatewayDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    letterSpacing: 1,
  },
  couponBtn: {
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 12,
    height: 48,
  },
  couponBtnDisabled: {
    opacity: 0.5,
  },
  couponBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  couponErrorText: {
    color: "#ff3366",
    fontSize: 12,
    marginTop: 4,
  },
  couponSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 212, 170, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.2)",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  couponSuccessText: {
    color: "#00d4aa",
    fontSize: 12,
    fontWeight: "bold",
  },
  priceBreakdown: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: 13.5,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  breakdownTotalLabel: {
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  breakdownTotalValue: {
    fontSize: 17,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutText: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 12,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    fontSize: 13.5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  countryPickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  countryPickerTriggerText: {
    fontSize: 13.5,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  phoneCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    width: 75,
    gap: 4,
  },
  phoneCodeText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  phoneNoInput: {
    flex: 1,
    fontSize: 13.5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formRow: {
    flexDirection: "row",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  pickerFlag: {
    fontSize: 20,
  },
  pickerName: {
    flex: 1,
    fontSize: 14,
  },
  pickerCode: {
    fontSize: 13,
    fontWeight: "bold",
  },
  simPayBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  simPayBtnTextSecondary: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Redesign additions styling
  arViewport: {
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  arOverlay: {
    position: "absolute",
    inset: 0,
  },
  arGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  arGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  arBrackets: {
    position: "absolute",
    inset: 20,
  },
  bracketTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  bracketTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  bracketBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  bracketBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  scanBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
  },
  arGuideCenter: {
    alignItems: "center",
    gap: 10,
    zIndex: 10,
  },
  arGuideCenterText: {
    fontSize: 12.5,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arFloatTagDepth: {
    position: "absolute",
    top: 24,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  arFloatTagWidth: {
    position: "absolute",
    bottom: 24,
    left: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  arFloatTagText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  arTechCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  arTechHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  arTechTitle: {
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  arTechAccuracy: {
    fontSize: 12,
    fontWeight: "bold",
  },
  arTechDesc: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Size chart modal style
  sizeGuideModal: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
    width: "100%",
  },
  sizeChartTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  sizeChartRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sizeChartHeaderCell: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "bold",
    textAlign: "center",
  },
  sizeChartCell: {
    flex: 1,
    fontSize: 13,
    textAlign: "center",
  }
});
