import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import type { LocationOption } from "@/lib/worldLocations";

type Props = {
  visible: boolean;
  title: string;
  items: LocationOption[];
  onClose: () => void;
  onSelect: (item: LocationOption) => void;
  searchPlaceholder?: string;
  emptyText?: string;
};

export function LocationSearchPicker({
  visible,
  title,
  items,
  onClose,
  onSelect,
  searchPlaceholder = "Search…",
  emptyText = "No matches found",
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color={SHOP.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Lucide name="search" size={18} color={SHOP.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={SHOP.textMuted}
              autoFocus
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Lucide name="close-circle" size={18} color={SHOP.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  setQuery("");
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.rowSub}>{item.subtitle}</Text> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: SHOP.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "88%",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: SHOP.text },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: SHOP.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: SHOP.text,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 8 },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  rowLabel: { fontSize: 15, color: SHOP.text, fontWeight: "500" },
  rowSub: { fontSize: 12, color: SHOP.textSecondary, marginTop: 2 },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: SHOP.textSecondary },
});
