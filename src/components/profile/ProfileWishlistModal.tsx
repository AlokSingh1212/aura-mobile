import React from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { profileModalStyles as styles } from "@/components/profile/profileModalStyles";

type WishlistItem = {
  id: string;
  title: string;
  price?: number;
  vibe?: string;
  images?: string[];
  maison?: { name?: string };
};

type ProfileWishlistModalProps = {
  visible: boolean;
  wishlist: WishlistItem[];
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
  onMoveToCart: (item: WishlistItem) => void;
  onRemove: (item: WishlistItem) => void;
};

export function ProfileWishlistModal({
  visible,
  wishlist,
  onClose,
  onOpenProduct,
  onMoveToCart,
  onRemove,
}: ProfileWishlistModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wishlistOverlay}>
        <View style={styles.wishlistContainer}>
          <View style={styles.wishlistHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Lucide name="heart" size={22} color="#00f5ff" />
              <Text style={styles.wishlistTitle}>SAVED ARTIFACTS</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {wishlist && wishlist.length > 0 ? (
            <FlatList
              data={wishlist}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.wishlistListContent}
              renderItem={({ item }) => {
                const imageUrl =
                  item.images?.[0] ||
                  "https://auragram.com/logo.png";
                return (
                  <View style={styles.wishlistItemCard}>
                    <TouchableOpacity style={styles.wishlistItemMain} onPress={() => onOpenProduct(item.id)}>
                      <Image source={{ uri: imageUrl }} style={styles.wishlistItemImg} />
                      <View style={styles.wishlistItemInfo}>
                        <Text style={styles.wishlistItemMaison} numberOfLines={1}>
                          {item.maison?.name || "AURAGRAM Maison"}
                        </Text>
                        <Text style={styles.wishlistItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.wishlistItemVibe}>✦ {item.vibe || "Quiet Luxury"}</Text>
                        <Text style={styles.wishlistItemPrice}>₹{item.price?.toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.wishlistItemActions}>
                      <TouchableOpacity style={styles.wishlistAddToCartBtn} onPress={() => onMoveToCart(item)}>
                        <Lucide name="basket-outline" size={16} color="#000000" />
                        <Text style={styles.wishlistAddToCartText}>Move to Cart</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.wishlistRemoveBtn} onPress={() => onRemove(item)}>
                        <Lucide name="trash-outline" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.wishlistEmpty}>
              <Lucide name="heart-dislike-outline" size={48} color="rgba(255,255,255,0.1)" />
              <Text style={styles.wishlistEmptyTitle}>No saved designs</Text>
              <Text style={styles.wishlistEmptyDesc}>
                Discover premium items from the atelier shop and save them here.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
