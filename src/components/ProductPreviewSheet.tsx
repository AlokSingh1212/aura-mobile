import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions 
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { router } from "expo-router";
import { SlideToPayCheckout } from "./SlideToPayCheckout";

const { height, width } = Dimensions.get("window");

export interface ProductPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
  product: any;
  feedItemId?: string; // Optional feed item id for tracking telemetry
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL"];
const AVAILABLE_COLORS = [
  { name: "Obsidian Black", hex: "#111111" },
  { name: "Shell White", hex: "#F5F5F7" },
  { name: "Platinum Grey", hex: "#8E8E93" }
];

export const ProductPreviewSheet: React.FC<ProductPreviewSheetProps> = ({
  visible,
  onClose,
  product,
  feedItemId
}) => {
  const { addToCart, logEngagement, logFeedCartAdd, formatPrice, triggerHaptic } = useStore();
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  if (!product) return null;

  // Format product details cleanly
  const title = product.title || product.name || "AURA Designer Item";
  const price = product.price || 120000;
  const rating = product.rating || 4.8;
  const description = product.description || "Indulge in our exquisite limited release garment. Crafted from carefully sourced premium materials with a signature silhouette and custom hardware details, representing AURA's hallmark luxury fashion-tech ecosystem.";
  
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400"];

  const handleAddToCart = async () => {
    triggerHaptic("success");
    // Add to cart with selected variants
    addToCart({
      ...product,
      id: product.id,
      title,
      price,
      images,
      selectedSize,
      selectedColor: selectedColor.name
    });

    // Telemetry log
    if (feedItemId) {
      await logFeedCartAdd(feedItemId, product.id);
      await logEngagement(feedItemId, "cart_add");
    }

    onClose();
  };

  const handleBuyNow = () => {
    triggerHaptic("heavy");
    onClose();
    setCheckoutVisible(true);
  };

  return (
    <>
      <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.dismissArea} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <View style={styles.sheetContainer}>
          {/* Header indicator drag bar */}
          <View style={styles.dragIndicator} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.designerLabel}>AURA COUTURE</Text>
              <Text style={styles.productTitle} numberOfLines={1}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Lucide name="close-outline" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Horizontal Product Image Gallery */}
            <View style={styles.galleryContainer}>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  setActiveImageIndex(Math.round(x / (width - 32)));
                }}
                scrollEventThrottle={16}
              >
                {images.map((img: string, i: number) => (
                  <Image key={i} source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {images.length > 1 && (
                <View style={styles.paginationRow}>
                  {images.map((_: any, i: number) => (
                    <View 
                      key={i} 
                      style={[
                        styles.paginationDot, 
                        i === activeImageIndex && styles.paginationDotActive
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Price & Rating Section */}
            <View style={styles.detailsSection}>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatPrice(price)}</Text>
                {product.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{product.discount}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingRow}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Lucide 
                      key={s} 
                      name={s <= Math.floor(rating) ? "star" : "star-outline"} 
                      size={15} 
                      color="#FFB800" 
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>{rating} (42 reviews)</Text>
              </View>

              <Text style={styles.descriptionText}>{description}</Text>
            </View>

            {/* Colors Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionTitle}>SELECT COLOR: <Text style={{ fontWeight: "bold" }}>{selectedColor.name}</Text></Text>
              <View style={styles.colorsContainer}>
                {AVAILABLE_COLORS.map((col) => {
                  const isSelected = selectedColor.name === col.name;
                  return (
                    <TouchableOpacity 
                      key={col.name} 
                      style={[
                        styles.colorCircleOutline, 
                        isSelected && styles.colorCircleOutlineActive
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setSelectedColor(col);
                      }}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: col.hex }]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sizes Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionTitle}>SELECT SIZE</Text>
              <View style={styles.sizesContainer}>
                {AVAILABLE_SIZES.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <TouchableOpacity 
                      key={sz} 
                      style={[
                        styles.sizeChip, 
                        isSelected && styles.sizeChipActive
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setSelectedSize(sz);
                      }}
                    >
                      <Text style={[
                        styles.sizeChipText, 
                        isSelected && styles.sizeChipTextActive
                      ]}>{sz}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
              <Lucide name="cart-outline" size={20} color="#111111" />
              <Text style={styles.addToCartBtnText}>Add To Cart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
              <Text style={styles.buyNowBtnText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    
    <SlideToPayCheckout
      visible={checkoutVisible}
      onClose={() => setCheckoutVisible(false)}
      product={{
        id: product.id,
        title,
        price,
        images,
        selectedSize,
        selectedColor: selectedColor.name
      }}
      onSuccess={() => {
        addToCart({
          ...product,
          id: product.id,
          title,
          price,
          images,
          selectedSize,
          selectedColor: selectedColor.name
        });
        router.push("/cart");
      }}
    />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.85,
    paddingTop: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EAEAEA",
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F7",
  },
  designerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#8E8E93",
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  galleryContainer: {
    position: "relative",
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F5F5F7",
  },
  galleryImage: {
    width: width - 32,
    height: 300,
  },
  paginationRow: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: "#FFFFFF",
  },
  detailsSection: {
    marginTop: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  discountBadge: {
    backgroundColor: "#E5F9E7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#1F8722",
    fontSize: 11,
    fontWeight: "bold",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  descriptionText: {
    fontSize: 14,
    color: "#48484A",
    lineHeight: 20,
    marginTop: 14,
  },
  selectionSection: {
    marginTop: 24,
  },
  selectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
    letterSpacing: 1,
    marginBottom: 12,
  },
  colorsContainer: {
    flexDirection: "row",
    gap: 14,
  },
  colorCircleOutline: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleOutlineActive: {
    borderColor: "#111111",
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  sizesContainer: {
    flexDirection: "row",
    gap: 10,
  },
  sizeChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sizeChipActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  sizeChipTextActive: {
    color: "#FFFFFF",
  },
  actionsBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F7",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  addToCartBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addToCartBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  buyNowBtn: {
    flex: 1.2,
    height: 52,
    backgroundColor: "#111111",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
