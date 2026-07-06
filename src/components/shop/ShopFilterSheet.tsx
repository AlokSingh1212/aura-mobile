import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import {
  type ShopFilters,
  type ShopSortBy,
  DEFAULT_SHOP_FILTERS,
} from "@/lib/shopFilters";
import { useStore } from "@/store/useStore";

type FilterTab = "sort" | "brand" | "color" | "gender";

type Props = {
  visible: boolean;
  tab: FilterTab;
  filters: ShopFilters;
  brands: string[];
  colors: string[];
  genders: string[];
  onClose: () => void;
  onApply: (filters: ShopFilters) => void;
};

const SORT_OPTIONS: { key: ShopSortBy; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price_low", label: "Price — Low to High" },
  { key: "price_high", label: "Price — High to Low" },
  { key: "rating", label: "Customer Rating" },
];

export function ShopFilterSheet({
  visible,
  tab,
  filters,
  brands,
  colors,
  genders,
  onClose,
  onApply,
}: Props) {
  const { triggerHaptic } = useStore();
  const [draft, setDraft] = useState<ShopFilters>(filters);

  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const title = useMemo(() => {
    if (tab === "sort") return "Sort & Filter";
    if (tab === "brand") return "Brand";
    if (tab === "color") return "Color";
    return "Gender";
  }, [tab]);

  const toggleList = (key: "brands" | "colors", value: string) => {
    setDraft((prev) => {
      const list = prev[key];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const apply = () => {
    triggerHaptic("light");
    onApply(draft);
    onClose();
  };

  const clear = () => {
    triggerHaptic("light");
    if (tab === "sort") {
      setDraft((p) => ({ ...p, sortBy: "relevance" }));
    } else if (tab === "brand") {
      setDraft((p) => ({ ...p, brands: [] }));
    } else if (tab === "color") {
      setDraft((p) => ({ ...p, colors: [] }));
    } else {
      setDraft((p) => ({ ...p, gender: null }));
    }
  };

  const resetAll = () => {
    triggerHaptic("medium");
    setDraft(DEFAULT_SHOP_FILTERS);
  };

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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {tab === "sort" && (
              <>
                <Text style={styles.sectionLabel}>Sort by</Text>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={styles.row}
                    onPress={() => setDraft((p) => ({ ...p, sortBy: opt.key }))}
                  >
                    <Text style={styles.rowText}>{opt.label}</Text>
                    {draft.sortBy === opt.key ? (
                      <Lucide name="checkmark-circle" size={20} color={SHOP.primary} />
                    ) : (
                      <View style={styles.radio} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {tab === "brand" &&
              (brands.length ? (
                brands.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={styles.row}
                    onPress={() => toggleList("brands", b)}
                  >
                    <Text style={styles.rowText}>{b}</Text>
                    {draft.brands.includes(b) ? (
                      <Lucide name="checkbox" size={22} color={SHOP.primary} />
                    ) : (
                      <Lucide name="square-outline" size={22} color={SHOP.textMuted} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>No brands in this category</Text>
              ))}

            {tab === "color" &&
              (colors.length ? (
                colors.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.row}
                    onPress={() => toggleList("colors", c)}
                  >
                    <Text style={styles.rowText}>{c}</Text>
                    {draft.colors.includes(c) ? (
                      <Lucide name="checkbox" size={22} color={SHOP.primary} />
                    ) : (
                      <Lucide name="square-outline" size={22} color={SHOP.textMuted} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>No color variants listed</Text>
              ))}

            {tab === "gender" &&
              (genders.length ? (
                genders.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={styles.row}
                    onPress={() =>
                      setDraft((p) => ({
                        ...p,
                        gender: p.gender === g ? null : g,
                      }))
                    }
                  >
                    <Text style={styles.rowText}>{g}</Text>
                    {draft.gender === g ? (
                      <Lucide name="checkmark-circle" size={20} color={SHOP.primary} />
                    ) : (
                      <View style={styles.radio} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.empty}>No gender tags on products</Text>
              ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={tab === "sort" ? resetAll : clear}>
              <Text style={styles.clearText}>{tab === "sort" ? "Clear all" : "Clear"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: "78%",
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
  body: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: SHOP.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  rowText: { fontSize: 15, color: SHOP.text, flex: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: SHOP.border,
  },
  empty: { padding: 24, textAlign: "center", color: SHOP.textSecondary },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SHOP.border,
  },
  clearText: { fontSize: 15, fontWeight: "700", color: SHOP.primary },
  applyBtn: {
    backgroundColor: SHOP.accent,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyText: { fontWeight: "800", fontSize: 15, color: SHOP.accentText },
});
