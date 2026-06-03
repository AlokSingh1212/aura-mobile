import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  Modal
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store/useStore";
import MainHeader from "@/components/MainHeader";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";

const { width } = Dimensions.get("window");

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
    clearCart 
  } = useStore();
  const insets = useSafeAreaInsets();

  // Checkout States
  const [shippingAddress, setShippingAddress] = useState("Penthouse Suite 8, Aurelia Towers, Mumbai - 400001");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(shippingAddress);
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
    itemCount: 0
  });

  const handleRemove = (id: string) => {
    triggerHaptic("medium");
    removeFromCart(id);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price || 0), 0);
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

  const calculateTotal = () => {
    const base = calculateSubtotal() - calculateDiscount();
    return base + calculateTax() + (cart.length > 0 ? 1500 : 0); // 1500 shipping
  };

  const handleSaveAddress = () => {
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
      // 1. Create Razorpay order on our backend
      const payloadCartItems = cart.map(item => ({
        artifactId: item.id,
        quantity: item.quantity || 1,
        price: item.price
      }));

      const res = await initiateCheckout({
        userId: currentUser?.id || activeProfile?.profileId || "patron_guest_sim",
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

      // 2. Check if native Razorpay module exists and can be run
      const isRazorpayNativeAvailable = RazorpayCheckout && (res.razorpayOrderId && !res.razorpayOrderId.startsWith("order_sim_"));

      if (isRazorpayNativeAvailable) {
        // Run native SDK checkout
        const options = {
          description: 'AURAGRAM Luxury Fashion Checkout',
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=200',
          currency: 'INR',
          key: res.key, // From response
          amount: res.amount, // In paise
          name: 'AURAGRAM',
          order_id: res.razorpayOrderId,
          prefill: {
            email: currentUser?.email || 'luxury@auragram.vip',
            contact: currentUser?.phone || '9999999999',
            name: currentUser?.name || activeProfile?.name || 'Elite Patron'
          },
          theme: {
            color: '#080415'
          }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
          // Native payment succeeded, send to verification
          const verifyRes = await verifyPayment({
            razorpayOrderId: res.razorpayOrderId,
            razorpayPaymentId: data.razorpay_payment_id,
            razorpaySignature: data.razorpay_signature
          });

          if (verifyRes.success) {
            setSuccessDetails({
              orderNumber: verifyRes.orderNumber || "ORD-NATIVE-2026",
              amount: verifyRes.amount || calculateTotal(),
              itemCount: cart.length
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
        // Fallback to beautiful simulator dialog (required for sandbox / web / simulators)
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
          itemCount: cart.length
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

  const renderCartItem = ({ item }: { item: any }) => {
    const imageUrl = item.images?.[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600";
    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.maison} numberOfLines={1}>{item.maison?.name || "AURAGRAM Maison"}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>₹{item.price?.toLocaleString()}</Text>
        </View>

        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemove(item.id)}
          activeOpacity={0.8}
        >
          <Lucide name="trash-outline" size={19} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Reusable Brand MainHeader */}
        <MainHeader />

        {cart.length > 0 ? (
          <View style={styles.content}>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <View style={styles.footerDetails}>
                  {/* Shipping Node Address Selector */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Delivery Node Address</Text>
                  </View>
                  
                  {isEditingAddress ? (
                    <View style={styles.addressEditBox}>
                      <TextInput
                        style={styles.addressInput}
                        value={tempAddress}
                        onChangeText={setTempAddress}
                        multiline
                        numberOfLines={3}
                        placeholder="Enter delivery node coordinates..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                      />
                      <TouchableOpacity style={styles.saveAddressBtn} onPress={handleSaveAddress} activeOpacity={0.8}>
                        <Text style={styles.saveAddressBtnText}>Lock Node</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.addressBox}>
                      <Lucide name="location" size={20} color="#00f5ff" />
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressText} numberOfLines={2}>
                          {shippingAddress}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => { 
                            setIsEditingAddress(true); 
                            setTempAddress(shippingAddress); 
                            triggerHaptic("light"); 
                          }}
                        >
                          <Text style={styles.editAddressBtn}>Modify Delivery Node</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Privilege Coupon Input */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Privilege Coupon Code</Text>
                  </View>
                  <View style={styles.couponRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="ENTER PRIVILEGE CODE (e.g. VIP20)"
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
                </View>
              }
            />

            {/* Calculations Box */}
            <View style={[styles.summaryBox, { marginBottom: 52 + insets.bottom }]}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal</Text>
                <Text style={styles.rowVal}>₹{calculateSubtotal().toLocaleString()}</Text>
              </View>
              {appliedCoupon ? (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: "#00d4aa" }]}>Privilege Discount</Text>
                  <Text style={[styles.rowVal, { color: "#00d4aa" }]}>-₹{calculateDiscount().toLocaleString()}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Import Duty & GST (18%)</Text>
                <Text style={styles.rowVal}>₹{calculateTax().toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Secured Node Courier</Text>
                <Text style={styles.rowVal}>₹1,500</Text>
              </View>
              
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Casket Price</Text>
                <Text style={styles.totalVal}>₹{calculateTotal().toLocaleString()}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.checkoutBtn, isCheckingOut && styles.checkoutBtnDisabled]}
                activeOpacity={0.9}
                onPress={handleCheckout}
                disabled={isCheckingOut}
              >
                <Text style={styles.checkoutText}>
                  {isCheckingOut ? "Securing Node..." : "Authenticate Purchase"}
                </Text>
                <Lucide name="shield-checkmark" size={17} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="bag-handle-outline" size={48} color="rgba(255,255,255,0.06)" />
            <Text style={styles.emptyTitle}>Your casket is empty.</Text>
            <Text style={styles.emptySub}>Select elite curator artifacts from the atelier grid to lock down stock nodes.</Text>
          </View>
        )}

      </SafeAreaView>

      {/* 🏠 GLOBAL PERSISTENT Bottom Navigation tabs replica */}
      <View style={[styles.instagramBottomBar, { height: 52 + insets.bottom, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/"); }}>
          <Lucide name="home-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push({ pathname: "/", params: { activeTab: "reels" } } as any); }}>
          <Lucide name="film-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push({ pathname: "/", params: { openDMs: "true" } } as any); }}>
          <Lucide name="paper-plane-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/shop" as any); }}>
          <Lucide name="play-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => { triggerHaptic("light"); router.push("/account"); }}>
          <View style={[styles.profileTabCircle, { borderWidth: 1.5, borderColor: "#00f5ff", overflow: "hidden" }]}>
            {activeProfile?.logo ? (
              <Image 
                source={{ uri: activeProfile.logo }} 
                style={styles.profileTabImg} 
              />
            ) : (
              <View style={[styles.profileTabImg, { backgroundColor: "#00f5ff", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }]}>
                <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>{activeMaisonId[0]?.toUpperCase() || "A"}</Text>
              </View>
            )}
            <View style={styles.profileActiveIndicator} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Interactive Simulated Payment Gateway Modal */}
      <Modal visible={paymentSimVisible} transparent animationType="slide" onRequestClose={() => setPaymentSimVisible(false)}>
        <View style={styles.simOverlay}>
          <View style={styles.simContainer}>
            <View style={styles.simHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lucide name="shield-checkmark" size={22} color="#00f5ff" />
                <Text style={styles.simTitle}>AURAGRAM PAYMENT NODE</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentSimVisible(false)}>
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
                You are using the sandbox payment node. To simulate a successful payment and trigger database ledgers, click the button below.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.simPayBtn, isCheckingOut && styles.simPayBtnDisabled]}
              onPress={handleSimulateSuccess}
              disabled={isCheckingOut}
              activeOpacity={0.8}
            >
              {isCheckingOut ? (
                <Text style={styles.simPayBtnText}>Verifying Ledger...</Text>
              ) : (
                <>
                  <Text style={styles.simPayBtnText}>Authorize Sandbox Payment</Text>
                  <Lucide name="arrow-forward-sharp" size={18} color="#080415" />
                </>
              )}
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
          router.push("/account");
        }}
        orderNumber={successDetails.orderNumber}
        amount={successDetails.amount}
        itemCount={successDetails.itemCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080415",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  badge: {
    backgroundColor: "#00f5ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 14,
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  maison: {
    color: "#00f5ff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
    marginTop: 2,
  },
  price: {
    color: "#fff",
    fontSize: 15.5,
    fontWeight: "300",
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  summaryBox: {
    backgroundColor: "#0b071e",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowVal: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "400",
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 14.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalVal: {
    color: "#00f5ff",
    fontSize: 18.5,
    fontWeight: "bold",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  checkoutText: {
    color: "#000",
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
    color: "#fff",
    fontSize: 18.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptySub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13.5,
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
    backgroundColor: "#080415",
    borderTopWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(0,245,255,0.3)",
  },
  footerDetails: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
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
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponInput: {
    flex: 1,
    color: "#fff",
    backgroundColor: "#0b071e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: "500",
  },
  couponBtn: {
    backgroundColor: "#00f5ff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  couponBtnDisabled: {
    backgroundColor: "rgba(0,245,255,0.3)",
  },
  couponBtnText: {
    color: "#080415",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
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
  simOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 4, 21, 0.85)",
    justifyContent: "flex-end",
  },
  simContainer: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.08)",
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
    color: "#fff",
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
    backgroundColor: "#080415",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.15)",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  simCardLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  simCardAmount: {
    color: "#00f5ff",
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
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "500",
  },
  simDetailVal: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "600",
  },
  simInstructions: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
  },
  simInstructionText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  simPayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00f5ff",
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  simPayBtnDisabled: {
    backgroundColor: "rgba(0, 245, 255, 0.3)",
  },
  simPayBtnText: {
    color: "#080415",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
