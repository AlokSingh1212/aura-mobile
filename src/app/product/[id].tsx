import React, { useState } from "react";
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
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default || require("react-native-razorpay");
} catch (e) {
  console.warn("[Product] Razorpay native module not found. Payment simulator will be activated.");
}

const { width } = Dimensions.get("window");

const LUXURY_COUNTRIES = [
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" }
];

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
    fetchWishlist
  } = useStore();
  const [activeImg, setActiveImg] = useState(0);

  const userId = currentUser?.id || activeProfile?.userId || "patron_guest_sim";
  const isFavorited = wishlist.some((item: any) => item.id === id);

  React.useEffect(() => {
    if (userId && userId !== "patron_guest_sim") {
      fetchWishlist(userId);
    }
  }, [userId]);

  // 3-step checkout state variables
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: Shipping, 1: Settlement, 2: Review
  const [shippingAddress, setShippingAddress] = useState<any>({
    name: "Alok Singh",
    email: "alok@auragram.vip",
    phone: "9999999999",
    countryCode: "+91",
    address: "Penthouse Suite 8, Aurelia Towers",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India"
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState<any>({ ...shippingAddress });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
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
  
  React.useEffect(() => {
    if (params.payment === "success") {
      setSuccessDetails({
        orderNumber: params.orderNumber || "ORD-2026",
        amount: Number(params.amount) || 0,
        itemCount: 1,
        orderId: params.orderId || ""
      });
      setSuccessVisible(true);
      triggerHaptic("success");
      
      // Clean up search params
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

  // Hydrate product from global ledger or fallback to mock matching web exactly
  const product = products.find(p => p.id === id) || {
    id: id || "1",
    title: "Heritage Calfskin Tote",
    price: 185000,
    vibe: "Quiet Luxury",
    maison: { name: "Rare Raven", id: "rare_raven" },
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000"
    ],
    arMetadata: {
      "Category": "Fashion",
      "Subcategory": "Apparel",
      "Material": "100% Calfskin Handloom",
      "Size": "Medium",
      "SKU": "AR-9824A"
    }
  };

  const images = product.images && product.images.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000"
  ];

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "PERCENTAGE") {
      return product.price * (appliedCoupon.discount / 100);
    }
    return Math.min(appliedCoupon.discount, product.price);
  };

  const calculateTax = () => {
    const base = product.price - calculateDiscount();
    return base * 0.18;
  };

  const calculateTotal = () => {
    const base = product.price - calculateDiscount();
    return base + calculateTax() + 1500; // ₹1,500 courier fee
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await applyCoupon({ code: couponCode.trim(), maisonId: activeMaisonId });
      if (res.success && res.valid) {
        setAppliedCoupon(res);
        setCouponError("");
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
        price: product.price
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
          image: images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200',
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
    
    // Construct the web payment checkout URL:
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

  const specList = Object.entries(product.arMetadata || {}).map(([key, val]) => ({
    label: key,
    value: typeof val === "string" ? val : JSON.stringify(val)
  }));

  const maisonName = product.maison?.name || "Rare Raven";
  const maisonId = product.maison?.id || "rare_raven";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Cinematic Header Nav (Parity with web nav bar style) */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.circleBtn}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
          >
            <Lucide name="arrow-back" size={23} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{product.title}</Text>
          <View style={styles.navRight}>
            <TouchableOpacity 
              style={[styles.circleBtn, isFavorited && styles.favActive]}
              onPress={handleToggleWishlist}
            >
              <Lucide name="heart" size={21} color={isFavorited ? "#ff3366" : "#fff"} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Visual Gallery Segment (Mirrors web detail stick visual layout) */}
          <View style={styles.galleryContainer}>
            <Image source={{ uri: images[activeImg] }} style={styles.galleryMainImg} />
            <View style={styles.galleryThumbnailsRow}>
              {images.map((img: string, idx: number) => {
                const isActive = activeImg === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.thumbBtn, isActive && styles.thumbBtnActive]}
                    onPress={() => {
                      triggerHaptic("light");
                      setActiveImg(idx);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.thumbImg} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Narrative & Acquisition Column Panel */}
          <View style={styles.narrativeContainer}>
            {/* Breadcrumb row */}
            <View style={styles.breadcrumbRow}>
              <Text style={styles.breadcrumbText}>{maisonName.toUpperCase()}</Text>
              <Lucide name="chevron-forward" size={11} color="rgba(255,255,255,0.2)" />
              <Text style={styles.breadcrumbText}>{(product.vibe || "CURATED").toUpperCase()}</Text>
              <Lucide name="chevron-forward" size={11} color="rgba(255,255,255,0.2)" />
              <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>{product.title.toUpperCase()}</Text>
            </View>

            {/* Neural Vibe Tag */}
            <View style={styles.headerRow}>
              <View style={styles.vibeBadge}>
                <Lucide name="sparkles" size={14} color="#00f5ff" style={styles.vibeSparkle} />
                <Text style={styles.vibeText}>Neural Vibe: {product.vibe}</Text>
              </View>
              <Text style={styles.serialText}>Serial: {product.id.substring(0, 8).toUpperCase()}-AURAGRAM</Text>
            </View>

            {/* Store & Title */}
            <View style={styles.titleBlock}>
              <TouchableOpacity onPress={() => router.push(`/maison/${maisonId}` as any)} style={styles.maisonRow}>
                <Lucide name="ribbon" size={17} color="#00f5ff" />
                <Text style={styles.maisonLabel}>Maison: {maisonName}</Text>
              </TouchableOpacity>
              <Text style={styles.luxuryHeading}>{product.title}</Text>

              {/* Star Rating Display */}
              <View style={styles.ratingRow}>
                <View style={styles.starsBox}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Lucide key={s} name="star" size={15} color="#D4AF37" style={styles.starIcon} />
                  ))}
                </View>
                <Text style={styles.ratingScore}>5.0/5</Text>
                <Text style={styles.reviewCount}>(24 reviews)</Text>
              </View>
            </View>

            {/* Price & AuraGram score matrices */}
            <View style={styles.matricesRow}>
              <View style={styles.matrixCell}>
                <Text style={styles.matrixLabel}>Acquisition Price</Text>
                <Text style={styles.matrixVal}>₹{product.price?.toLocaleString()}</Text>
              </View>
              <View style={styles.matrixCell}>
                <Text style={styles.matrixLabel}>AuraGram Score</Text>
                <View style={styles.auragramBox}>
                  <Lucide name="flash" size={19} color="#00f5ff" />
                  <Text style={styles.auragramVal}>9.8</Text>
                </View>
              </View>
            </View>

            {/* Urgency ticker */}
            <View style={styles.urgencyBox}>
              <View style={styles.urgencyDot} />
              <Text style={styles.urgencyText}>12 Discerning Collectors are currently viewing this node</Text>
            </View>

            {/* Neural Narrative Glass Box (Cursive Italics Web Parity) */}
            <View style={styles.glassPanel}>
              <View style={styles.glassHeader}>
                <View style={styles.glassDot} />
                <Text style={styles.glassTitle}>Neural Narrative Engine</Text>
              </View>
              <Text style={styles.glassQuote}>
                {"\"Synthesized from hand-selected materials, this artifact embodies a dialogue between mid-century brutalism and futuristic utility. Each piece is cryptographically unique, ensuring your selection remains one-of-one in the global discovery ledger.\""}
              </Text>
            </View>

            {/* Product Specifications Matrix */}
            <View style={styles.specsSection}>
              <View style={styles.sectionHeader}>
                <Lucide name="cube" size={17} color="#00f5ff" />
                <Text style={styles.sectionTitle}>Product Specifications</Text>
              </View>
              
              <View style={styles.specsGrid}>
                {specList.map((spec, idx) => (
                  <View key={idx} style={styles.specRow}>
                    <Text style={styles.specLabel}>{spec.label}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fulfillment Trust Node badges */}
            <View style={styles.fulfillmentGrid}>
              <View style={styles.fulfillBox}>
                <Lucide name="cube-outline" size={23} color="#00f5ff" />
                <View>
                  <Text style={styles.fulfillTitle}>Free Express Delivery</Text>
                  <Text style={styles.fulfillDesc}>Get it in 2 business days</Text>
                </View>
              </View>
              <View style={styles.fulfillBox}>
                <Lucide name="reload" size={21} color="#00f5ff" />
                <View>
                  <Text style={styles.fulfillTitle}>7-Day Easy Returns</Text>
                  <Text style={styles.fulfillDesc}>Industrial Grade Guarantee</Text>
                </View>
              </View>
            </View>

            {/* Trust Node Bullet points */}
            <View style={styles.trustGrid}>
              <View style={styles.trustCard}>
                <Lucide name="checkmark-circle" size={23} color="#00f5ff" />
                <Text style={styles.trustTitle}>Verified Authenticity</Text>
                <Text style={styles.trustDesc}>Verified by AURAGRAM Neural Ledger. Certificate included.</Text>
              </View>
              <View style={styles.trustCard}>
                <Lucide name="globe" size={23} color="#00f5ff" />
                <Text style={styles.trustTitle}>Global Escrow</Text>
                <Text style={styles.trustDesc}>Funds held in secure AURAGRAM portal until artifact arrival.</Text>
              </View>
            </View>

            {/* Premium Checkout Pill Actions */}
            <View style={styles.checkoutActions}>
              <TouchableOpacity 
                style={styles.primaryAcquireBtn}
                activeOpacity={0.95}
                onPress={handleAcquire}
              >
                <Lucide name="basket" size={21} color="#000" />
                <Text style={styles.primaryAcquireText}>Acquire Artifact</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAcquireBtn}
                activeOpacity={0.9}
                onPress={handleInstantAcquire}
              >
                <Lucide name="finger-print" size={21} color="#00f5ff" />
                <View>
                  <Text style={styles.secLabel}>1-Click</Text>
                  <Text style={styles.secVal}>Instant Acquisition</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* 3-Step Checkout Modal Drawer */}
        <Modal visible={checkoutVisible} transparent animationType="slide" onRequestClose={() => setCheckoutVisible(false)}>
          <View style={styles.simOverlay}>
            <View style={styles.simContainer}>
              <View style={styles.simHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lucide name="shield-checkmark" size={22} color="#00f5ff" />
                  <Text style={styles.simTitle}>AURA SECURED CHECKOUT</Text>
                </View>
                <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                  <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalStepsRow}>
                <Text style={[styles.modalStepText, activeStep === 0 && styles.modalStepActive]}>Address</Text>
                <Lucide name="chevron-forward" size={12} color="rgba(255,255,255,0.2)" />
                <Text style={[styles.modalStepText, activeStep === 1 && styles.modalStepActive]}>Gateway</Text>
                <Lucide name="chevron-forward" size={12} color="rgba(255,255,255,0.2)" />
                <Text style={[styles.modalStepText, activeStep === 2 && styles.modalStepActive]}>Audit</Text>
              </View>

              {activeStep === 0 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Fulfillment Destination</Text>
                  <Text style={styles.stepSubtitle}>Indicate the delivery node coordinates for physical dispatch.</Text>
                  {isEditingAddress ? (
                    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                      <View style={styles.addressEditBox}>
                        
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Full Name</Text>
                          <TextInput
                            style={styles.formInput}
                            value={tempAddress.name}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, name: val }))}
                            placeholder="Enter your full name"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Email Address</Text>
                          <TextInput
                            style={styles.formInput}
                            value={tempAddress.email}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, email: val }))}
                            placeholder="luxury@auragram.vip"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Country / Region</Text>
                          <TouchableOpacity 
                            style={styles.countryPickerTrigger}
                            onPress={() => { setShowCountryPicker(true); triggerHaptic("light"); }}
                          >
                            <Text style={styles.countryPickerTriggerText}>
                              {tempAddress.country ? `${tempAddress.country}` : "Select Country"}
                            </Text>
                            <Lucide name="chevron-down" size={16} color="#00f5ff" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Mobile Number</Text>
                          <View style={styles.phoneInputRow}>
                            <TouchableOpacity 
                              style={styles.phoneCodeBtn}
                              onPress={() => { setShowCountryPicker(true); triggerHaptic("light"); }}
                            >
                              <Text style={styles.phoneCodeText}>{tempAddress.countryCode || "+91"}</Text>
                              <Lucide name="chevron-down" size={10} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                            <TextInput
                              style={styles.phoneNoInput}
                              value={tempAddress.phone}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, phone: val.replace(/[^0-9]/g, "") }))}
                              placeholder="9999999999"
                              placeholderTextColor="rgba(255,255,255,0.2)"
                              keyboardType="phone-pad"
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Street Address</Text>
                          <TextInput
                            style={[styles.formInput, { minHeight: 60, textAlignVertical: "top" }]}
                            value={tempAddress.address}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, address: val }))}
                            placeholder="Penthouse Suite 8, Aurelia Towers"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            multiline
                            numberOfLines={2}
                          />
                        </View>

                        <View style={styles.formRow}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>City</Text>
                            <TextInput
                              style={styles.formInput}
                              value={tempAddress.city}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, city: val }))}
                              placeholder="Mumbai"
                              placeholderTextColor="rgba(255,255,255,0.2)"
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.inputLabel}>State</Text>
                            <TextInput
                              style={styles.formInput}
                              value={tempAddress.state}
                              onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, state: val }))}
                              placeholder="Maharashtra"
                              placeholderTextColor="rgba(255,255,255,0.2)"
                            />
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Pincode / Postal Code</Text>
                          <TextInput
                            style={styles.formInput}
                            value={tempAddress.postalCode}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, postalCode: val }))}
                            placeholder="400001"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            keyboardType="number-pad"
                          />
                        </View>

                        <TouchableOpacity 
                          style={styles.saveAddressBtn} 
                          onPress={() => {
                            if (!tempAddress.name || !tempAddress.phone || !tempAddress.address || !tempAddress.city || !tempAddress.state || !tempAddress.postalCode) {
                              Alert.alert("Required Fields", "Please populate all destination parameters.");
                              return;
                            }
                            setShippingAddress(tempAddress);
                            setIsEditingAddress(false);
                            triggerHaptic("light");
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.saveAddressBtnText}>Lock Node Coordinates</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={styles.addressBox}>
                      <Lucide name="location" size={22} color="#00f5ff" />
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressText}>{formatAddressString(shippingAddress)}</Text>
                        <TouchableOpacity onPress={() => { setIsEditingAddress(true); setTempAddress({ ...shippingAddress }); triggerHaptic("light"); }}>
                          <Text style={styles.editAddressBtn}>Modify Address Node</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setCheckoutVisible(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextBtn} onPress={() => { triggerHaptic("light"); setActiveStep(1); }}>
                      <Text style={styles.nextBtnText}>Next Step</Text>
                      <Lucide name="arrow-forward" size={16} color="#080415" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Settlement Gateway</Text>
                  <Text style={styles.stepSubtitle}>Select your preferred ledger verification standard.</Text>
                  
                  <TouchableOpacity 
                    style={[styles.gatewayOption, paymentMethod === "RAZORPAY" && styles.gatewayOptionActive]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("RAZORPAY"); }}
                    activeOpacity={0.8}
                  >
                    <Lucide name="card" size={24} color={paymentMethod === "RAZORPAY" ? "#00f5ff" : "rgba(255,255,255,0.4)"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gatewayTitle}>Razorpay Gateway (UPI / Cards)</Text>
                      <Text style={styles.gatewayDesc}>Cryptographically signed digital payment protocols.</Text>
                    </View>
                    <View style={[styles.radioCircle, paymentMethod === "RAZORPAY" && styles.radioCircleActive]}>
                      {paymentMethod === "RAZORPAY" && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.gatewayOption, paymentMethod === "COD" && styles.gatewayOptionActive]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("COD"); }}
                    activeOpacity={0.8}
                  >
                    <Lucide name="cash" size={24} color={paymentMethod === "COD" ? "#00f5ff" : "rgba(255,255,255,0.4)"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gatewayTitle}>Cash on Delivery (COD)</Text>
                      <Text style={styles.gatewayDesc}>Settle in cash at the door. Requires local node check.</Text>
                    </View>
                    <View style={[styles.radioCircle, paymentMethod === "COD" && styles.radioCircleActive]}>
                      {paymentMethod === "COD" && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); setActiveStep(0); }}>
                      <Lucide name="arrow-back" size={16} color="#fff" />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextBtn} onPress={() => { triggerHaptic("light"); setActiveStep(2); }}>
                      <Text style={styles.nextBtnText}>Next Step</Text>
                      <Lucide name="arrow-forward" size={16} color="#080415" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Acquisition Audit</Text>
                  <Text style={styles.stepSubtitle}>Validate coupon codes and finalize item settlement parameters.</Text>
                  
                  <View style={styles.couponRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="ENTER PRIVILEGE CODE"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={couponCode}
                      onChangeText={(val) => {
                        setCouponCode(val);
                        setCouponError("");
                      }}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.couponBtn, isCheckingCoupon && styles.couponBtnDisabled]}
                      onPress={handleApplyCoupon}
                      disabled={isCheckingCoupon}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.couponBtnText}>
                        {isCheckingCoupon ? "Securing..." : "Validate"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
                  {appliedCoupon ? (
                    <View style={styles.couponSuccessBadge}>
                      <Lucide name="checkmark-circle" size={16} color="#00d4aa" />
                      <Text style={styles.couponSuccessText}>
                        Privilege Activated: {appliedCoupon.code} (-{appliedCoupon.discount}
                        {appliedCoupon.type === "PERCENTAGE" ? "%" : " INR"})
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.priceBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Artifact Value</Text>
                      <Text style={styles.breakdownValue}>₹{product.price?.toLocaleString()}</Text>
                    </View>
                    {appliedCoupon && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: "#00d4aa" }]}>Discount Applied</Text>
                        <Text style={[styles.breakdownValue, { color: "#00d4aa" }]}>-₹{calculateDiscount().toLocaleString()}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Import Duty & GST (18%)</Text>
                      <Text style={styles.breakdownValue}>₹{calculateTax().toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Secured Node Courier</Text>
                      <Text style={styles.breakdownValue}>₹1,500</Text>
                    </View>
                    <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                      <Text style={styles.breakdownTotalLabel}>Total Price</Text>
                      <Text style={styles.breakdownTotalValue}>₹{calculateTotal().toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.modalNavRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => { triggerHaptic("light"); setActiveStep(1); }}>
                      <Lucide name="arrow-back" size={16} color="#fff" />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.checkoutBtn, isCheckingOut && styles.checkoutBtnDisabled]} 
                      onPress={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <ActivityIndicator color="#080415" size="small" />
                      ) : (
                        <>
                          <Text style={styles.checkoutText}>Authenticate Purchase</Text>
                          <Lucide name="shield-checkmark" size={18} color="#080415" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* Country Selector Overlay */}
              {showCountryPicker && (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#080415", borderRadius: 32, padding: 24, zIndex: 999 }]}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Select Destination Node</Text>
                    <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                      <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
                    {LUXURY_COUNTRIES.map((c) => (
                      <TouchableOpacity
                        key={c.name}
                        style={styles.pickerItem}
                        onPress={() => {
                          setTempAddress((prev: any) => ({
                            ...prev,
                            country: c.name,
                            countryCode: c.code
                          }));
                          setShowCountryPicker(false);
                          triggerHaptic("light");
                        }}
                      >
                        <Text style={styles.pickerFlag}>{c.flag}</Text>
                        <Text style={styles.pickerName}>{c.name}</Text>
                        <Text style={styles.pickerCode}>{c.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Simulated Payment Gateway Modal */}
        <Modal visible={paymentSimVisible} transparent animationType="slide" onRequestClose={() => { setPaymentSimVisible(false); setCheckoutVisible(true); }}>
          <View style={styles.simOverlay}>
            <View style={styles.simContainer}>
              <View style={styles.simHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lucide name="shield-checkmark" size={22} color="#00f5ff" />
                  <Text style={styles.simTitle}>AURAGRAM PAYMENT NODE</Text>
                </View>
                <TouchableOpacity onPress={() => { setPaymentSimVisible(false); setCheckoutVisible(true); triggerHaptic("light"); }}>
                  <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>

              <Text style={styles.simSubtitle}>Test Mode Simulation · Safe Sandbox Environment</Text>

              <View style={styles.simCard}>
                <Text style={styles.simCardLabel}>Total Due</Text>
                <Text style={styles.simCardAmount}>₹{calculateTotal().toLocaleString()}</Text>
                
                <View style={styles.simDetailRow}>
                  <Text style={styles.simDetailLabel}>Order ID</Text>
                  <Text style={styles.simDetailVal}>{activeRazorpayOrder?.razorpayOrderId || "N/A"}</Text>
                </View>
                
                <View style={styles.simDetailRow}>
                  <Text style={styles.simDetailLabel}>Description</Text>
                  <Text style={styles.simDetailVal}>AURAGRAM Luxury Attire Casket</Text>
                </View>
              </View>

              <View style={styles.simInstructions}>
                <Text style={styles.simInstructionText}>
                  Choose whether to confirm via the real Razorpay standard gateway check on web, or bypass instantly using the sandbox simulation.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.simPayBtn, isCheckingOut && styles.simPayBtnDisabled]}
                onPress={handleOpenWebCheckout}
                disabled={isCheckingOut}
                activeOpacity={0.8}
              >
                {isCheckingOut ? (
                  <Text style={styles.simPayBtnText}>Connecting Gateway...</Text>
                ) : (
                  <>
                    <Text style={styles.simPayBtnText}>Open Web Checkout (Real Gateway)</Text>
                    <Lucide name="card-sharp" size={18} color="#080415" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simPayBtnSecondary, isCheckingOut && styles.simPayBtnDisabled]}
                onPress={handleSimulateSuccess}
                disabled={isCheckingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.simPayBtnTextSecondary}>Sandbox Simulation Bypass</Text>
                <Lucide name="arrow-forward-sharp" size={16} color="#00f5ff" />
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415", // Brand black website color exact copy
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
    borderColor: "rgba(255,255,255,0.05)",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  favActive: {
    borderColor: "rgba(255,51,102,0.2)",
    backgroundColor: "rgba(255,51,102,0.05)",
  },
  navTitle: {
    color: "#fff",
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
    height: 420,
    backgroundColor: "#080415",
    position: "relative",
  },
  galleryMainImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  galleryThumbnailsRow: {
    position: "absolute",
    bottom: 20,
    left: 24,
    flexDirection: "row",
    gap: 10,
  },
  thumbBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    opacity: 0.5,
  },
  thumbBtnActive: {
    borderColor: "#00f5ff",
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    color: "rgba(255,255,255,0.3)",
    fontSize: 11.5,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  breadcrumbActive: {
    color: "#00f5ff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vibeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  vibeSparkle: {
    marginRight: 2,
  },
  vibeText: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  serialText: {
    color: "rgba(255,255,255,0.25)",
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
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  luxuryHeading: {
    color: "#fff",
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
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  reviewCount: {
    color: "rgba(255,255,255,0.3)",
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
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matrixVal: {
    color: "#fff",
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
    color: "#00f5ff",
    fontSize: 24,
    fontWeight: "bold",
  },
  urgencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.1)",
    padding: 12,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00f5ff",
  },
  urgencyText: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 24,
    borderRadius: 32,
    marginTop: 28,
  },
  glassHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  glassDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#00f5ff",
  },
  glassTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  glassQuote: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16.5,
    fontStyle: "italic",
    lineHeight: 22,
  },
  specsSection: {
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 32,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingBottom: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#00f5ff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  specsGrid: {
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
  },
  specLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specValue: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  fulfillmentGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  fulfillBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  fulfillTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fulfillDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 2,
  },
  trustGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  trustCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  trustTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trustDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11.5,
    lineHeight: 12,
  },
  checkoutActions: {
    marginTop: 36,
    gap: 12,
  },
  primaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 32,
    gap: 8,
  },
  primaryAcquireText: {
    color: "#000",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  secondaryAcquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 14,
    borderRadius: 32,
    gap: 8,
  },
  secLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secVal: {
    color: "#fff",
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
    backgroundColor: "#080415",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    color: "#00f5ff",
    fontSize: 15.5,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  simSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12.5,
    marginTop: -8,
  },
  simCard: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  simCardLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  simCardAmount: {
    color: "#00f5ff",
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
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  simDetailVal: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  simInstructions: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 14,
    padding: 14,
  },
  simInstructionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  simPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  simPayBtnText: {
    color: "#080415",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  simPayBtnDisabled: {
    backgroundColor: "rgba(0,245,255,0.3)",
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
  modalStepActive: {
    color: "#00f5ff",
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -8,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addressInfo: {
    flex: 1,
    gap: 4,
  },
  addressText: {
    color: "#fff",
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: "400",
  },
  editAddressBtn: {
    color: "#00f5ff",
    fontSize: 11.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  addressEditBox: {
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "#00f5ff",
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  addressInput: {
    color: "#fff",
    fontSize: 13.5,
    lineHeight: 18,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveAddressBtn: {
    backgroundColor: "#00f5ff",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  saveAddressBtnText: {
    color: "#080415",
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
    borderColor: "rgba(255,255,255,0.08)",
  },
  cancelBtnText: {
    color: "rgba(255,255,255,0.5)",
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
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  backBtnText: {
    color: "#fff",
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
    backgroundColor: "#00f5ff",
    gap: 6,
  },
  nextBtnText: {
    color: "#080415",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gatewayOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  gatewayOptionActive: {
    borderColor: "#00f5ff",
  },
  gatewayTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  gatewayDesc: {
    color: "rgba(255,255,255,0.4)",
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
  radioCircleActive: {
    borderColor: "#00f5ff",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00f5ff",
  },
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    letterSpacing: 1,
  },
  couponBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 12,
    height: 48,
  },
  couponBtnDisabled: {
    opacity: 0.5,
  },
  couponBtnText: {
    color: "#000",
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
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
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
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakdownValue: {
    color: "#fff",
    fontSize: 13.5,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 10,
    marginTop: 2,
  },
  breakdownTotalLabel: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  breakdownTotalValue: {
    color: "#00f5ff",
    fontSize: 17,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnDisabled: {
    backgroundColor: "rgba(0,245,255,0.3)",
  },
  checkoutText: {
    color: "#080415",
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
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    color: "#fff",
    fontSize: 13.5,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  countryPickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  countryPickerTriggerText: {
    color: "#fff",
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
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 10,
    width: 75,
    gap: 4,
  },
  phoneCodeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  phoneNoInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13.5,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  pickerTitle: {
    color: "#00f5ff",
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
    borderBottomColor: "rgba(255,255,255,0.03)",
    gap: 12,
  },
  pickerFlag: {
    fontSize: 20,
  },
  pickerName: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  pickerCode: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
  },
  simPayBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  simPayBtnTextSecondary: {
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
