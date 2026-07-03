import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";

export interface SearchPickerItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUri?: string | null;
  icon?: keyof typeof Lucide.glyphMap;
}

interface SearchPickerSheetProps {
  visible: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onSelect: (item: SearchPickerItem) => void;
  search: (query: string) => Promise<SearchPickerItem[]>;
  minQueryLength?: number;
}

export function SearchPickerSheet({
  visible,
  title,
  placeholder,
  onClose,
  onSelect,
  search,
  minQueryLength = 0,
}: SearchPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (text: string) => {
      if (text.trim().length < minQueryLength) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const list = await search(text.trim());
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [minQueryLength, search]
  );

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      return;
    }
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [visible, query, runSearch]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Lucide name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color="#00f5ff" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim().length < minQueryLength
                  ? `Type at least ${minQueryLength} characters to search`
                  : "No results found"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                ) : item.icon ? (
                  <View style={styles.iconCircle}>
                    <Lucide name={item.icon} size={18} color="#00f5ff" />
                  </View>
                ) : (
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconLetter}>{item.title[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 24,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  thumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: "#111" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLetter: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
