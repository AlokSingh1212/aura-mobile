import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import type { TaggedProduct } from "@/lib/createDraft";
import { openProduct } from "@/lib/postNavigation";

type Props = {
  visible: boolean;
  products: TaggedProduct[];
  onClose: () => void;
  onSelectProduct?: (product: TaggedProduct) => void;
};

export function ShoppableProductSheet({
  visible,
  products,
  onClose,
  onSelectProduct,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {products.length === 1 ? "1 product" : `${products.length} products`}
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.productId}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => {
                  if (onSelectProduct) onSelectProduct(p);
                  else openProduct(p.productId);
                  onClose();
                }}
              >
                {p.image ? (
                  <Image source={{ uri: p.image }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Lucide name="bag-outline" size={20} color="#666" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {p.title}
                  </Text>
                  {p.price != null ? (
                    <Text style={styles.price}>₹{p.price.toLocaleString("en-IN")}</Text>
                  ) : null}
                </View>
                <Lucide name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "62%",
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#f0f0f0" },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: "#111" },
  price: { fontSize: 13, color: "#666", marginTop: 4, fontWeight: "600" },
});
