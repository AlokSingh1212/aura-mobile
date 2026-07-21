import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerBottomSheet } from "@/components/create/ComposerBottomSheet";
import { searchProducts } from "@/lib/postComposerSearch";
import type { ProductSticker } from "@/lib/postEditState";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";

interface PostProductSheetProps {
  visible: boolean;
  brandStores: BrandStoreOption[];
  userId?: string;
  selected: ProductSticker[];
  onClose: () => void;
  onChange: (stickers: ProductSticker[]) => void;
  onDone?: () => void;
}

export function PostProductSheet({
  visible,
  brandStores,
  userId,
  selected,
  onClose,
  onChange,
  onDone,
}: PostProductSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSticker[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const products = await searchProducts(query, userId);
      setResults(
        products.map((p) => ({
          productId: p.id,
          title: p.title,
          image: p.images[0] || "",
          price: p.price,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, userId]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    const timer = setTimeout(load, 220);
    return () => clearTimeout(timer);
  }, [visible, load]);

  const toggle = (item: ProductSticker) => {
    if (selected.some((s) => s.productId === item.productId)) {
      onChange(selected.filter((s) => s.productId !== item.productId));
    } else if (selected.length >= 4) {
      return;
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <ComposerBottomSheet
      visible={visible}
      title="Products"
      onClose={onClose}
      onDone={onDone ?? onClose}
      height="65%"
    >
      <Text style={styles.hint}>
        Select products, then tap Done. Drag the tag anywhere on your photo or video.
      </Text>

      {selected.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow}>
          {selected.map((p) => (
            <TouchableOpacity key={p.productId} onPress={() => toggle(p)} style={styles.selectedBox}>
              <Image source={{ uri: p.image }} style={styles.selectedImg} contentFit="cover" />
              <View style={styles.removeBadge}>
                <Lucide name="close" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.searchBox}>
        <Lucide name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your products…"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#0095f6" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView style={styles.list}>
          {results.map((item) => {
            const picked = selected.some((s) => s.productId === item.productId);
            return (
              <TouchableOpacity key={item.productId} style={styles.row} onPress={() => toggle(item)}>
                <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.price != null ? (
                    <Text style={styles.price}>₹{item.price.toLocaleString()}</Text>
                  ) : null}
                </View>
                {picked ? (
                  <Lucide name="checkmark-circle" size={22} color="#0095f6" />
                ) : (
                  <Lucide name="add-circle-outline" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
          {!results.length && !loading ? (
            <Text style={styles.empty}>
              {brandStores.length ? "Search products from your store" : "Create a brand store to add products"}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </ComposerBottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  selectedRow: { maxHeight: 56, paddingHorizontal: 16, marginBottom: 8 },
  selectedBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#0095f6",
    overflow: "hidden",
  },
  selectedImg: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  list: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#222" },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  price: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 32, paddingHorizontal: 24 },
});
