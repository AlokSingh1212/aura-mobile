import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const SHEET_HEIGHT = screenHeight * 0.55;
const CARD_WIDTH = (screenWidth - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * (5 / 4); // 4:5 aspect ratio

export interface ExploreProductsSheetProps {
  visible: boolean;
  products: Array<{
    id: string;
    title: string;
    image: string;
    price: number;
  }>;
  onClose: () => void;
  onProductPress: (productId: string) => void;
}

export const ExploreProductsSheet: React.FC<ExploreProductsSheetProps> = ({
  visible,
  products,
  onClose,
  onProductPress,
}) => {
  const renderProduct = ({
    item,
  }: {
    item: { id: string; title: string; image: string; price: number };
  }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() => onProductPress(item.id)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        contentFit="cover"
        placeholder="L184i9ofbHof00ayjZay~qj[ayof"
        placeholderContentFit="cover"
        transition={250}
      />
      {/* Title + Price Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.cardGradient}
      >
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            ${item.price.toFixed(2)}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Dismiss area above the sheet */}
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet Container */}
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Explore all products</Text>
            {/* Spacer to balance the close button */}
            <View style={styles.headerSpacer} />
          </View>

          {/* Product Grid */}
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    height: SHEET_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 36,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
  },
  productTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  priceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  priceBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
