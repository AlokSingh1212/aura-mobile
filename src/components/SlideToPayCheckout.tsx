import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  TouchableWithoutFeedback
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

export interface SlideToPayCheckoutProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    selectedSize?: string;
    selectedColor?: string;
  };
  onSuccess: () => void;
}

const SLIDER_WIDTH = width * 0.84;
const THUMB_SIZE = 54;
const END_THRESHOLD = SLIDER_WIDTH - THUMB_SIZE - 8;

export const SlideToPayCheckout: React.FC<SlideToPayCheckoutProps> = ({
  visible,
  onClose,
  product,
  onSuccess
}) => {
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS">("IDLE");
  const slideX = useRef(new Animated.Value(0)).current;
  const slideProgress = useRef(0);

  // Bottom sheet slide-up animation
  const sheetY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStatus("IDLE");
      slideX.setValue(0);
      slideProgress.current = 0;
      
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  // Set up PanResponder for drag guestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Constrain movement inside the track
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > END_THRESHOLD) newX = END_THRESHOLD;
        
        slideX.setValue(newX);
        slideProgress.current = newX;
      },
      onPanResponderRelease: () => {
        if (slideProgress.current >= END_THRESHOLD - 10) {
          // Slide completed successfully
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleSlideSuccess();
        } else {
          // Slide snapped back to start
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(slideX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true
          }).start();
          slideProgress.current = 0;
        }
      }
    })
  ).current;

  const handleSlideSuccess = () => {
    setStatus("PROCESSING");
    Animated.timing(slideX, {
      toValue: END_THRESHOLD,
      duration: 100,
      useNativeDriver: true
    }).start();

    // Simulate double-entry ledger secure settling
    setTimeout(() => {
      setStatus("SUCCESS");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        dismissSheet(onSuccess);
      }, 1500);
    }, 2000);
  };

  const dismissSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
      if (callback) callback();
    });
  };

  if (!visible || !product) return null;

  const images = product.images || [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400"
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => dismissSheet()}
    >
      <View style={styles.root}>
        {/* Background Overlay */}
        <TouchableWithoutFeedback onPress={() => status === "IDLE" && dismissSheet()}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Drawer Content */}
        <Animated.View style={[styles.drawer, { transform: [{ translateY: sheetY }] }]}>
          {/* Header Drag Handle */}
          <View style={styles.dragBar} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order Checkout</Text>
            <TouchableWithoutFeedback onPress={() => status === "IDLE" && dismissSheet()}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableWithoutFeedback>
          </View>

          {status === "IDLE" && (
            <View style={styles.body}>
              {/* Product details */}
              <View style={styles.productRow}>
                <Image source={{ uri: images[0] }} style={styles.productImg} />
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>{product.title}</Text>
                  <Text style={styles.productVariant}>
                    Size: {product.selectedSize || "M"}  •  Color: {product.selectedColor || "Obsidian"}
                  </Text>
                  <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                </View>
              </View>

              {/* Secure transaction info */}
              <View style={styles.securityBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
                <Text style={styles.securityText}>
                  Escrow settlement secured. Funds will be held until delivery is verified.
                </Text>
              </View>

              {/* Total checkout details */}
              <View style={styles.priceSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${product.price.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fulfillment Fee</Text>
                  <Text style={styles.summaryValue}>FREE</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${product.price.toFixed(2)}</Text>
                </View>
              </View>

              {/* Slide to Pay button track */}
              <View style={styles.sliderTrack}>
                <Text style={styles.sliderPlaceholder}>Slide to Confirm Payment</Text>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.sliderThumb,
                    { transform: [{ translateX: slideX }] }
                  ]}
                >
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </Animated.View>
              </View>
            </View>
          )}

          {status === "PROCESSING" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Securing double-entry ledger settlement...</Text>
              <Text style={styles.loadingSubtext}>Writing escrow balance transfer logs.</Text>
            </View>
          )}

          {status === "SUCCESS" && (
            <View style={styles.loadingContainer}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={80} color="#34C759" />
              </View>
              <Text style={styles.successText}>Transaction Completed</Text>
              <Text style={styles.loadingSubtext}>Chain of custody hash locked.</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000"
  },
  drawer: {
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 20
  },
  dragBar: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 10
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)"
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  productImg: {
    width: 74,
    height: 74,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: "#2C2C2E"
  },
  productDetails: {
    flex: 1
  },
  productName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1
  },
  productVariant: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 4
  },
  price: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6
  },
  securityBox: {
    flexDirection: "row",
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.15)"
  },
  securityText: {
    color: "#34C759",
    fontSize: 12,
    flex: 1,
    marginLeft: 10,
    lineHeight: 16
  },
  priceSummary: {
    marginVertical: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)"
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryLabel: {
    color: "#8E8E93",
    fontSize: 14
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500"
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.04)",
    paddingTop: 12,
    marginTop: 8
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  totalValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700"
  },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 62,
    backgroundColor: "#2C2C2E",
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)"
  },
  sliderPlaceholder: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1
  },
  sliderThumb: {
    position: "absolute",
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center"
  },
  loadingSubtext: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center"
  },
  successIconBox: {
    marginBottom: 10
  },
  successText: {
    color: "#34C759",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10
  }
});
