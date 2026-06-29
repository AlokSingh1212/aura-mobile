import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import Lucide from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";

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

let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default || require("react-native-razorpay");
} catch (e) {
  console.warn("[Cart] Razorpay native module not found. Payment simulator will be activated.");
}

export default function CartScreen() {
  const { 
    cart, 
    removeFromCart, 
    triggerHaptic, 
    activeProfile, 
    activeMaisonId, 
    currentUser,
    initiateCheckout,
    verifyPayment,
    applyCoupon,
    clearCart,
    formatPrice
  } = useStore();
  const insets = useSafeAreaInsets();

  // Dynamic Theme states
  const [themeMode, setThemeMode] = useState<"obsidian" | "cream">("obsidian");
  const [activeStep, setActiveStep] = useState<number>(0); // 0: Cart, 1: Shipping, 2: Payment
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");

  // Checkout States
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

  // Theme Colors config
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
    cardBg: themeMode === "obsidian" ? "#0b071e" : "#ffffff",
    inputBg: themeMode === "obsidian" ? "rgba(255,255,255,0.02)" : "#f1edec",
    surfaceContainer: themeMode === "obsidian" ? "#0b071e" : "#f1edec",
    surfaceContainerLow: themeMode === "obsidian" ? "rgba(255,255,255,0.02)" : "#f7f3f2"
  };

  const params = useLocalSearchParams<{ payment?: string; orderId?: string; amount?: string; orderNumber?: string; error?: string }>();
  
  useEffect(() => {
    if (params.payment === "success") {
      try {
        clearCart();
      } catch (e) {}
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
      alert("Payment Failed: " + (params.error || "Verification failed."));
      router.setParams({ payment: undefined, error: undefined });
    } else if (params.payment === "cancelled") {
      alert("Payment Aborted: Checkout cancelled.");
      router.setParams({ payment: undefined });
    }
  }, [params.payment]);

  const handleRemove = (id: string) => {
    triggerHaptic("medium");
    removeFromCart(id);
  };

  const handleUpdateQuantity = (productId: string, amount: number) => {
    triggerHaptic("medium");
    useStore.setState((state) => {
      const updatedCart = state.cart.map((item) => {
        if (item.id === productId) {
          const nextQty = Math.max(1, (item.quantity || 1) + amount);
          return { ...item, quantity: nextQty };
        }
        return item;
      });
      return { cart: updatedCart };
    });
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    if (appliedCoupon.type === "PERCENTAGE") {
      return subtotal * (appliedCoupon.discount / 100);
    }
    return Math.min(appliedCoupon.discount, subtotal);
  };

  const calculateTax = () => {
    const base = calculateSubtotal() - calculateDiscount();
    return base * 0.18; // 18% standard GST
  };

  const calculateShipping = () => {
    if (cart.length === 0) return 0;
    return deliveryMethod === "standard" ? 0 : 150;
  };

  const calculateTotal = () => {
    const base = calculateSubtotal() - calculateDiscount();
    return base + calculateTax() + calculateShipping();
  };

  const handleSaveAddress = () => {
    if (!tempAddress.name || !tempAddress.phone || !tempAddress.address || !tempAddress.city || !tempAddress.state || !tempAddress.postalCode) {
      alert("Please populate all destination parameters.");
      return;
    }
    setShippingAddress(tempAddress);
    setIsEditingAddress(false);
    triggerHaptic("light");
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
      const payloadCartItems = cart.map(item => ({
        artifactId: item.id,
        quantity: item.quantity || 1,
        price: item.price
      }));

      const res = await initiateCheckout({
        userId: currentUser?.id || activeProfile?.userId || "patron_guest_sim",
        cartItems: payloadCartItems,
        shippingAddress: shippingAddress,
        couponCode: appliedCoupon?.code
      });

      if (!res.success) {
        alert("Could not initiate checkout: " + (res.error || "Please try again."));
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
          clearCart();
          setSuccessDetails({
            orderNumber: verifyRes.orderNumber || "ORD-COD-2026",
            amount: verifyRes.amount || calculateTotal(),
            itemCount: cart.length,
            orderId: verifyRes.orderId || res.orderId || ""
          });
          setSuccessVisible(true);
          triggerHaptic("success");
        } else {
          alert("Verification failed: " + (verifyRes.error || "Invalid response."));
        }
        return;
      }

      const isRazorpayNativeAvailable = RazorpayCheckout && (res.razorpayOrderId && !res.razorpayOrderId.startsWith("order_sim_"));

      if (isRazorpayNativeAvailable) {
        const options = {
          description: 'AURAGRAM Luxury Fashion Checkout',
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200',
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
            setSuccessDetails({
              orderNumber: verifyRes.orderNumber || "ORD-NATIVE-2026",
              amount: verifyRes.amount || calculateTotal(),
              itemCount: cart.length,
              orderId: verifyRes.orderId || res.orderId || ""
            });
            clearCart();
            setSuccessVisible(true);
            triggerHaptic("success");
          } else {
            alert("Verification failed: " + (verifyRes.error || "Invalid response."));
          }
        }).catch((error: any) => {
          console.warn("[Razorpay Native error]", error);
          alert("Payment canceled or failed.");
        }).finally(() => {
          setIsCheckingOut(false);
        });
      } else {
        setIsCheckingOut(false);
        setPaymentSimVisible(true);
      }
    } catch (e) {
      console.error(e);
      alert("Checkout connection failed.");
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
        setSuccessDetails({
          orderNumber: verifyRes.orderNumber || "ORD-SIM-2026",
          amount: verifyRes.amount || calculateTotal(),
          itemCount: cart.length,
          orderId: verifyRes.orderId || activeRazorpayOrder.orderId || ""
        });
        clearCart();
        setSuccessVisible(true);
        triggerHaptic("success");
      } else {
        alert("Payment verification failed: " + (verifyRes.error || "Unknown error"));
      }
    } catch (e) {
      alert("Verification connection failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleOpenWebCheckout = async () => {
    if (!activeRazorpayOrder?.orderId) {
      alert("Missing order identifier. Please re-initiate checkout.");
      return;
    }
    triggerHaptic("heavy");
    setPaymentSimVisible(false);
    const paymentUrl = `${API_HOST}/checkout/pay-mobile?orderId=${activeRazorpayOrder.orderId}&returnPath=cart`;
    try {
      await WebBrowser.openBrowserAsync(paymentUrl);
    } catch (err) {
      alert("Could not launch secure web browser.");
    }
  };

  const handleContinueCTA = () => {
    if (activeStep === 0) {
      triggerHaptic("medium");
      setActiveStep(1);
    } else if (activeStep === 1) {
      triggerHaptic("medium");
      setActiveStep(2);
    } else {
      handleCheckout();
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.maison} numberOfLines={1}>{item.maison?.name || "AURAGRAM Maison"}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice(item.price)}</Text>
        </View>

        <View style={styles.qtyContainer}>
          <View style={[styles.qtyRow, { borderColor: colors.surfaceBorder }]}>
            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, -1)} style={styles.qtyBtn}>
              <Lucide name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyValText, { color: colors.text }]}>{item.quantity || 1}</Text>
            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, 1)} style={styles.qtyBtn}>
              <Lucide name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.removeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={() => handleRemove(item.id)}
            activeOpacity={0.8}
          >
            <Lucide name="trash-outline" size={16} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        {/* Custom Cinematic Header Navigation */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
          <TouchableOpacity onPress={() => { triggerHaptic("light"); router.back(); }}>
            <Lucide name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping Cart</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                triggerHaptic("light");
                setThemeMode(themeMode === "obsidian" ? "cream" : "obsidian");
              }}
            >
              <Lucide name={themeMode === "obsidian" ? "sunny-outline" : "moon-outline"} size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {cart.length > 0 ? (
          <View style={styles.content}>
            
            {/* 3-Step Wizard Progress Bar */}
            <View style={[styles.wizardBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.stepTab, activeStep === 0 && { borderBottomColor: colors.primary }]} 
                onPress={() => { triggerHaptic("light"); setActiveStep(0); }}
              >
                <Text style={[styles.stepText, { color: activeStep === 0 ? colors.text : colors.textMuted }]}>1. CART</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.stepTab, activeStep === 1 && { borderBottomColor: colors.primary }]} 
                onPress={() => { triggerHaptic("light"); setActiveStep(1); }}
              >
                <Text style={[styles.stepText, { color: activeStep === 1 ? colors.text : colors.textMuted }]}>2. DELIVERY ADDRESS</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.stepTab, activeStep === 2 && { borderBottomColor: colors.primary }]} 
                onPress={() => { triggerHaptic("light"); setActiveStep(2); }}
              >
                <Text style={[styles.stepText, { color: activeStep === 2 ? colors.text : colors.textMuted }]}>3. PAYMENT METHOD</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* STEP 0: CART ITEMS */}
              {activeStep === 0 && (
                <View style={styles.stepContainer}>
                  <View style={styles.stepHeaderRow}>
                    <Text style={[styles.stepHeadline, { color: colors.text }]}>Shopping Cart</Text>
                    <Text style={[styles.stepMutedCount, { color: colors.textMuted }]}>{cart.length} ITEMS</Text>
                  </View>
                  <FlatList
                    data={cart}
                    renderItem={renderCartItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={{ gap: 12 }}
                  />
                </View>
              )}

              {/* STEP 1: SHIPPING INFORMATION */}
              {activeStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.stepHeadline, { color: colors.text, marginBottom: 12 }]}>Delivery Address</Text>
                  
                  {isEditingAddress ? (
                    <View style={[styles.addressEditBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Full Name</Text>
                        <TextInput
                          style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                          value={tempAddress.name}
                          onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, name: val }))}
                          placeholder="Enter name"
                          placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email Address</Text>
                        <TextInput
                          style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                          value={tempAddress.email}
                          onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, email: val }))}
                          placeholder="luxury@auragram.vip"
                          placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
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
                            style={[styles.phoneNoInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                            value={tempAddress.phone}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, phone: val.replace(/[^0-9]/g, "") }))}
                            placeholder="9999999999"
                            placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Street Address</Text>
                        <TextInput
                          style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, minHeight: 50 }]}
                          value={tempAddress.address}
                          onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, address: val }))}
                          placeholder="Penthouse Suite 8, Aurelia Towers"
                          placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                          multiline
                        />
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>City</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                            value={tempAddress.city}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, city: val }))}
                            placeholder="Mumbai"
                            placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                          />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>State</Text>
                          <TextInput
                            style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                            value={tempAddress.state}
                            onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, state: val }))}
                            placeholder="Maharashtra"
                            placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Pincode / Postal Code</Text>
                        <TextInput
                          style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                          value={tempAddress.postalCode}
                          onChangeText={(val) => setTempAddress((prev: any) => ({ ...prev, postalCode: val }))}
                          placeholder="400001"
                          placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                          keyboardType="number-pad"
                        />
                      </View>

                      <TouchableOpacity style={[styles.saveAddressBtn, { backgroundColor: colors.primary }]} onPress={handleSaveAddress} activeOpacity={0.8}>
                                                  <Text style={[styles.saveAddressBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Deliver to this Address</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.addressBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Lucide name="location" size={22} color={colors.primary} />
                      <View style={styles.addressInfo}>
                        <Text style={[styles.addressText, { color: colors.text }]}>
                          {formatAddressString(shippingAddress)}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => { 
                            setIsEditingAddress(true); 
                            setTempAddress({ ...shippingAddress }); 
                            triggerHaptic("light"); 
                          }}
                        >
                          <Text style={[styles.editAddressBtn, { color: colors.primary }]}>Edit Address</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Delivery Method Selection */}
                  <View style={styles.shippingSection}>
                    <Text style={[styles.shippingSectionTitle, { color: colors.text }]}>Delivery Options</Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.shippingMethodCard, 
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        deliveryMethod === "standard" && { borderColor: colors.primary, borderWidth: 1.5 }
                      ]}
                      onPress={() => { triggerHaptic("light"); setDeliveryMethod("standard"); }}
                    >
                      <View style={styles.shippingMethodLeft}>
                        <Lucide name={deliveryMethod === "standard" ? "checkbox" : "square-outline"} size={20} color={colors.primary} />
                        <View style={styles.shippingMethodInfo}>
                          <Text style={[styles.shippingMethodName, { color: colors.text }]}>Standard Delivery (Free)</Text>
                          <Text style={[styles.shippingMethodDays, { color: colors.textMuted }]}>Delivered in 3-5 Business Days</Text>
                        </View>
                      </View>
                      <Text style={[styles.shippingMethodCost, { color: colors.text }]}>Free</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.shippingMethodCard, 
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        deliveryMethod === "express" && { borderColor: colors.primary, borderWidth: 1.5 }
                      ]}
                      onPress={() => { triggerHaptic("light"); setDeliveryMethod("express"); }}
                    >
                      <View style={styles.shippingMethodLeft}>
                        <Lucide name={deliveryMethod === "express" ? "checkbox" : "square-outline"} size={20} color={colors.primary} />
                        <View style={styles.shippingMethodInfo}>
                          <Text style={[styles.shippingMethodName, { color: colors.text }]}>Express Delivery (+₹150)</Text>
                          <Text style={[styles.shippingMethodDays, { color: colors.textMuted }]}>Delivered Next Business Day</Text>
                        </View>
                      </View>
                      <Text style={[styles.shippingMethodCost, { color: colors.text }]}>₹150</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 2: SECURE PAYMENT OPTIONS */}
              {activeStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={[styles.stepHeadline, { color: colors.text, marginBottom: 12 }]}>Payment Method</Text>
                  
                  {/* Razorpay Option */}
                  <TouchableOpacity 
                    style={[
                      styles.paymentMethodCard, 
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      paymentMethod === "RAZORPAY" && { borderColor: colors.primary, borderWidth: 1.5 }
                    ]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("RAZORPAY"); }}
                  >
                    <View style={styles.paymentMethodInfo}>
                      <Lucide name="card" size={20} color={colors.primary} />
                      <Text style={[styles.paymentMethodText, { color: colors.text }]}>Pay Online (UPI, Card, Net Banking)</Text>
                    </View>
                    <Lucide name={paymentMethod === "RAZORPAY" ? "radio-button-on" : "radio-button-off"} size={18} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Cash on Delivery (COD) Option */}
                  <TouchableOpacity 
                    style={[
                      styles.paymentMethodCard, 
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      paymentMethod === "COD" && { borderColor: colors.primary, borderWidth: 1.5 }
                    ]}
                    onPress={() => { triggerHaptic("light"); setPaymentMethod("COD"); }}
                  >
                    <View style={styles.paymentMethodInfo}>
                      <Lucide name="cash" size={20} color={colors.primary} />
                      <Text style={[styles.paymentMethodText, { color: colors.text }]}>Cash on Delivery (COD)</Text>
                    </View>
                    <Lucide name={paymentMethod === "COD" ? "radio-button-on" : "radio-button-off"} size={18} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Mock Alternate Gateways */}
                  <View style={styles.alternatePayments}>
                    <Text style={[styles.alternatePaymentsTitle, { color: colors.textMuted }]}>Alternative Secure Methods</Text>
                    
                    <TouchableOpacity style={[styles.mockGatewayCard, { backgroundColor: colors.surface, borderColor: colors.border }]} disabled>
                      <View style={styles.paymentMethodInfo}>
                        <Lucide name="logo-apple" size={18} color={colors.textMuted} />
                        <Text style={[styles.mockGatewayText, { color: colors.textMuted }]}>Apple Pay (Unavailable)</Text>
                      </View>
                      <Lucide name="chevron-forward" size={14} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.mockGatewayCard, { backgroundColor: colors.surface, borderColor: colors.border }]} disabled>
                      <View style={styles.paymentMethodInfo}>
                        <Lucide name="logo-paypal" size={18} color={colors.textMuted} />
                        <Text style={[styles.mockGatewayText, { color: colors.textMuted }]}>PayPal (Unavailable)</Text>
                      </View>
                      <Lucide name="chevron-forward" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Privilege Coupon Codes block */}
              <View style={[styles.couponBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.couponTitle, { color: colors.text }]}>Promo Code / Discount Coupon</Text>
                <View style={styles.couponRow}>
                  <TextInput
                    style={[styles.couponInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                    placeholder="ENTER PROMO CODE (e.g. VIP20)"
                    placeholderTextColor={themeMode === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}
                    value={couponCode}
                    onChangeText={(val) => {
                      setCouponCode(val);
                      setCouponError("");
                    }}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={[styles.couponBtn, { backgroundColor: colors.primary }, isCheckingCoupon && styles.couponBtnDisabled]}
                    onPress={handleApplyCoupon}
                    disabled={isCheckingCoupon}
                    activeOpacity={0.8}
                  >
                    {isCheckingCoupon ? (
                      <ActivityIndicator size="small" color={themeMode === "obsidian" ? "#080415" : "#fff"} />
                    ) : (
                      <Text style={[styles.couponBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
                {appliedCoupon ? (
                  <View style={styles.couponSuccessBadge}>
                    <Lucide name="checkmark-circle" size={16} color="#00d4aa" />
                    <Text style={styles.couponSuccessText}>
                      Coupon Applied: {appliedCoupon.code} (-{appliedCoupon.discount}
                      {appliedCoupon.type === "PERCENTAGE" ? "%" : " INR"})
                    </Text>
                  </View>
                ) : null}
              </View>

            </ScrollView>

            {/* Calculations Box */}
            <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 52 + insets.bottom }]}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Subtotal</Text>
                <Text style={[styles.rowVal, { color: colors.text }]}>{formatPrice(calculateSubtotal())}</Text>
              </View>
              {appliedCoupon ? (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: "#00d4aa" }]}>Privilege Discount</Text>
                  <Text style={[styles.rowVal, { color: "#00d4aa" }]}>-{formatPrice(calculateDiscount())}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Import Duty & GST (18%)</Text>
                <Text style={[styles.rowVal, { color: colors.text }]}>{formatPrice(calculateTax())}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Secured Node Courier</Text>
                <Text style={[styles.rowVal, { color: colors.text }]}>{formatPrice(calculateShipping())}</Text>
              </View>
              
              <View style={[styles.row, styles.totalRow, { borderColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Casket Price</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>{formatPrice(calculateTotal())}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.checkoutBtn, { backgroundColor: colors.primary }, isCheckingOut && styles.checkoutBtnDisabled]}
                activeOpacity={0.9}
                onPress={handleContinueCTA}
                disabled={isCheckingOut}
              >
                <Text style={[styles.checkoutText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>
                  {isCheckingOut ? "Securing Node..." : 
                   activeStep === 0 ? "Continue to Shipping" : 
                   activeStep === 1 ? "Continue to Payment" : "Authenticate Purchase"}
                </Text>
                <Lucide name={activeStep === 2 ? "shield-checkmark" : "arrow-forward-sharp"} size={17} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
              </TouchableOpacity>

              {/* Confidence Badges */}
              <View style={styles.confidenceBadges}>
                <View style={styles.badgeItem}>
                  <Lucide name="shield-checkmark" size={16} color={colors.textMuted} />
                  <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Secure Pay</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Lucide name="flash" size={16} color={colors.textMuted} />
                  <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>Fast Delivery</Text>
                </View>
                <View style={styles.badgeItem}>
                  <Lucide name="refresh" size={16} color={colors.textMuted} />
                  <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>30 Day Returns</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="bag-handle-outline" size={48} color={colors.textMuted} style={{ opacity: 0.2 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is empty.</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add items to your cart to start shopping.</Text>
          </View>
        )}

      </SafeAreaView>

      {/* 🏠 AURA BOTTOM NAVIGATION — 5 tabs with elevated Create */}
      <View style={[styles.auraBottomBar, { paddingBottom: insets.bottom, height: 62 + insets.bottom }]}>

        {/* TAB 1 — Home */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/");
          }}
        >
          <Lucide
            name="home-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Home</Text>
        </TouchableOpacity>

        {/* TAB 2 — Reel */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { activeTab: "reels" } } as any);
          }}
        >
          <Lucide
            name="film-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Reel</Text>
        </TouchableOpacity>

        {/* TAB 3 — Inbox */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push({ pathname: "/", params: { openDMs: "true" } } as any);
          }}
        >
          <Lucide
            name="paper-plane-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Inbox</Text>
        </TouchableOpacity>

        {/* TAB 4 — Products */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/shop");
          }}
        >
          <Lucide
            name="bag-handle-outline"
            size={26}
            color="rgba(255,255,255,0.45)"
          />
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Products</Text>
        </TouchableOpacity>

        {/* TAB 5 — Profile */}
        <TouchableOpacity
          style={styles.auraTabBtn}
          onPress={() => {
            triggerHaptic("light");
            router.push("/account");
          }}
        >
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", overflow: "hidden" }]}>
            {activeProfile?.logo ? (
              <Image 
                source={{ uri: activeProfile.logo }} 
                style={styles.profileTabImg} 
              />
            ) : currentUser?.avatar ? (
              <Image 
                source={{ uri: currentUser.avatar }} 
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }]}>
                <Text style={{ color: themeMode === "obsidian" ? "#000" : "#fff", fontSize: 10, fontWeight: "bold" }}>
                  {(activeProfile?.name || currentUser?.name || activeMaisonId || "R")[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.auraTabLabel, { color: "rgba(255,255,255,0.35)" }]}>Profile</Text>
        </TouchableOpacity>

      </View>

      {/* Interactive Simulated Payment Gateway Modal */}
      <Modal visible={paymentSimVisible} transparent animationType="slide" onRequestClose={() => setPaymentSimVisible(false)}>
        <View style={styles.simOverlay}>
          <View style={[styles.simContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.simHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lucide name="shield-checkmark" size={22} color={colors.primary} />
                <Text style={[styles.simTitle, { color: colors.text }]}>AURAGRAM PAYMENT</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentSimVisible(false)}>
                <Lucide name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.simSubtitle}>Test Mode Simulation · Safe Sandbox Environment</Text>

            <View style={[styles.simCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.simCardLabel, { color: colors.textMuted }]}>Total Due</Text>
              <Text style={[styles.simCardAmount, { color: colors.primary }]}>{formatPrice(calculateTotal())}</Text>
              
              <View style={styles.simDetailRow}>
                <Text style={[styles.simDetailLabel, { color: colors.textMuted }]}>Order ID</Text>
                <Text style={[styles.simDetailVal, { color: colors.text }]}>{activeRazorpayOrder?.razorpayOrderId || "N/A"}</Text>
              </View>
              
              <View style={styles.simDetailRow}>
                <Text style={[styles.simDetailLabel, { color: colors.textMuted }]}>Description</Text>
                <Text style={[styles.simDetailVal, { color: colors.text }]}>AURAGRAM Shopping Cart</Text>
              </View>
            </View>

            <View style={[styles.simInstructions, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.simInstructionText, { color: colors.textMuted }]}>
                Choose whether to confirm via the real Razorpay standard gateway check on web, or bypass instantly using the sandbox simulation.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.simPayBtn, { backgroundColor: colors.primary }, isCheckingOut && styles.simPayBtnDisabled]}
              onPress={handleOpenWebCheckout}
              disabled={isCheckingOut}
              activeOpacity={0.8}
            >
              {isCheckingOut ? (
                <Text style={[styles.simPayBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Connecting Gateway...</Text>
              ) : (
                <>
                  <Text style={[styles.simPayBtnText, { color: themeMode === "obsidian" ? "#080415" : "#ffffff" }]}>Open Web Checkout</Text>
                  <Lucide name="card-sharp" size={18} color={themeMode === "obsidian" ? "#080415" : "#ffffff"} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.simPayBtnSecondary, { borderColor: colors.primary }, isCheckingOut && styles.simPayBtnDisabled]}
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
      
      {/* Country Selector Overlay */}
      {showCountryPicker && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg, padding: 24, zIndex: 999 }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.primary }]}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Lucide name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {LUXURY_COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
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
                  <Text style={[styles.pickerName, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.pickerCode, { color: colors.primary }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  wizardBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  stepTab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingHorizontal: 12,
  },
  stepText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    gap: 16,
    marginBottom: 20,
  },
  stepHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  stepHeadline: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  stepMutedCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  image: {
    width: 68,
    height: 85,
    borderRadius: 10,
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  maison: {
    color: "#ff3366",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  price: {
    fontSize: 15.0,
    fontWeight: "300",
    marginTop: 4,
  },
  qtyContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    height: 28,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValText: {
    fontSize: 13,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  summaryBox: {
    borderTopWidth: 1,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowVal: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalVal: {
    fontSize: 18.5,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  checkoutText: {
    fontSize: 13.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "400",
  },
  instagramBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 52,
    borderTopWidth: 0.5,
  },
  auraBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "rgba(5,3,15,0.94)",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  auraTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingTop: 8,
    gap: 3,
  },
  auraTabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  tabBtn: {
    padding: 8,
  },
  profileTabCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "relative",
  },
  profileTabImg: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  profileActiveIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  addressInfo: {
    flex: 1,
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  editAddressBtn: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  addressEditBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  saveAddressBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 4,
  },
  saveAddressBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  couponBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  couponTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  couponBtn: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    height: 42,
  },
  couponBtnDisabled: {
    opacity: 0.5,
  },
  couponBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  couponErrorText: {
    color: "#ff3b30",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  couponSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 212, 170, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  couponSuccessText: {
    color: "#00d4aa",
    fontSize: 12,
    fontWeight: "bold",
  },
  shippingSection: {
    marginTop: 16,
    gap: 10,
  },
  shippingSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shippingMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  shippingMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shippingMethodInfo: {
    gap: 2,
  },
  shippingMethodName: {
    fontSize: 13.5,
    fontWeight: "bold",
  },
  shippingMethodDays: {
    fontSize: 11,
  },
  shippingMethodCost: {
    fontSize: 13.5,
    fontWeight: "bold",
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 13.5,
    fontWeight: "bold",
  },
  alternatePayments: {
    marginTop: 16,
    gap: 10,
  },
  alternatePaymentsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mockGatewayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    opacity: 0.6,
  },
  mockGatewayText: {
    fontSize: 13,
  },
  confidenceBadges: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeLabel: {
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  simOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 4, 21, 0.85)",
    justifyContent: "flex-end",
  },
  simContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  simHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  simTitle: {
    fontSize: 15,
    fontWeight: "300",
    letterSpacing: 1.5,
  },
  simSubtitle: {
    color: "#ff3b30",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: -8,
  },
  simCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  simCardLabel: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  simCardAmount: {
    fontSize: 32,
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
    fontWeight: "500",
  },
  simDetailVal: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  simInstructions: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  simInstructionText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  simPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  simPayBtnDisabled: {
    opacity: 0.5,
  },
  simPayBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 10,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countryPickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderRadius: 10,
    paddingHorizontal: 8,
    width: 70,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
