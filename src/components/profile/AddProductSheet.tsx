import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { pickProductMediaFromLibrary, type ProductMediaItem } from "@/lib/createMediaPicker";
import { buildProductCreatePayload } from "@/lib/publishProduct";
import {
  PRODUCT_CATEGORIES,
  getCategoryById,
  resolveProductForm,
  validateProductForm,
  type ProductFieldDef,
  type ResolvedProductForm,
} from "@/lib/productCategories";

export interface BrandStoreOption {
  id: string;
  name: string;
  username: string;
  maisonId: string;
  logo?: string | null;
}

interface AddProductSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onProductCreated?: (artifactId: string, productTitle: string) => void;
  brandStores: BrandStoreOption[];
  defaultStoreId?: string | null;
  showStorePicker?: boolean;
  /** Pre-fill from reel or gallery */
  prefillVideoUri?: string | null;
  prefillImageUris?: string[];
}

type Step = "store" | "category" | "subcategory" | "details";

export function AddProductSheet({
  visible,
  onClose,
  onCreated,
  onProductCreated,
  brandStores,
  defaultStoreId,
  showStorePicker = true,
  prefillVideoUri,
  prefillImageUris,
}: AddProductSheetProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, createProduct, triggerHaptic } = useStore();

  const [step, setStep] = useState<Step>("store");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<ProductMediaItem[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | string[]>>({});
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [stockPerVariant, setStockPerVariant] = useState("10");
  const [returnPolicy, setReturnPolicy] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [loading, setLoading] = useState(false);

  const selectedStore = useMemo(
    () => brandStores.find((s) => s.id === selectedStoreId) || null,
    [brandStores, selectedStoreId]
  );

  const category = categoryId ? getCategoryById(categoryId) : null;
  const resolvedForm: ResolvedProductForm | null =
    categoryId && subcategoryId ? resolveProductForm(categoryId, subcategoryId) : null;

  useEffect(() => {
    if (!visible) return;

    const initialStore =
      defaultStoreId && brandStores.some((s) => s.id === defaultStoreId)
        ? defaultStoreId
        : brandStores.length === 1
          ? brandStores[0].id
          : null;

    const prefilled: ProductMediaItem[] = [];
    if (prefillVideoUri) prefilled.push({ uri: prefillVideoUri, type: "video" });
    (prefillImageUris || []).forEach((uri) => prefilled.push({ uri, type: "image" }));

    setSelectedStoreId(initialStore);
    setStep(showStorePicker && brandStores.length > 1 ? "store" : "category");
    setCategoryId(null);
    setSubcategoryId(null);
    setTitle("");
    setPrice("");
    setDescription("");
    setMedia(prefilled.slice(0, 6));
    setAttributeValues({});
    setSelectedSizes([]);
    setSelectedColors([]);
    setStockPerVariant("10");
    setReturnPolicy("RETURN");
  }, [visible, defaultStoreId, brandStores, showStorePicker, prefillVideoUri, prefillImageUris]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const goBack = () => {
    if (step === "details") setStep("subcategory");
    else if (step === "subcategory") setStep("category");
    else if (step === "category" && showStorePicker && brandStores.length > 1) setStep("store");
    else handleClose();
  };

  const handlePickMedia = async () => {
    triggerHaptic("light");
    const picked = await pickProductMediaFromLibrary(6 - media.length);
    if (picked.length) {
      setMedia((prev) => [...prev, ...picked].slice(0, 6));
    }
  };

  const removeMedia = (index: number) => {
    triggerHaptic("light");
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleChip = (list: string[], value: string, setter: (v: string[]) => void) => {
    triggerHaptic("light");
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const setFieldValue = (key: string, value: string | string[]) => {
    setAttributeValues((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublish = async () => {
    if (!currentUser?.id || !selectedStore || !resolvedForm) return;

    const validationError = validateProductForm(resolvedForm, {
      title,
      price,
      attributeValues,
      selectedSizes,
      mediaCount: media.length,
    });
    if (validationError) {
      Alert.alert("Missing info", validationError);
      return;
    }

    setLoading(true);
    triggerHaptic("medium");

    try {
      const payload = await buildProductCreatePayload({
        maisonId: selectedStore.maisonId || selectedStore.username,
        profileId: selectedStore.id,
        userId: currentUser.id,
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim() || undefined,
        form: resolvedForm,
        attributeValues,
        selectedSizes,
        selectedColors,
        stockPerVariant: parseInt(stockPerVariant, 10) || 10,
        media,
        returnPolicy,
      });

      const result = await createProduct(payload);
      if (result.success) {
        triggerHaptic("success");
        onClose();
        onCreated?.();
        if (result.artifactId) onProductCreated?.(result.artifactId, title.trim());
        Alert.alert(
          "Product listed",
          `"${title.trim()}" is live in ${selectedStore.name}.`
        );
      } else {
        Alert.alert("Could not list product", (result as any).error || "Try again.");
      }
    } catch (e) {
      Alert.alert(
        "Publish failed",
        e instanceof Error ? e.message : "Could not upload or save your product."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: ProductFieldDef) => {
    if (field.type === "select") {
      return (
        <View key={field.key} style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{field.label}{field.required ? " *" : ""}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(field.options || []).map((opt) => {
              const active = attributeValues[field.key] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFieldValue(field.key, opt)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (field.type === "multi-select") {
      const selected = (attributeValues[field.key] as string[]) || [];
      return (
        <View key={field.key} style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{field.label}{field.required ? " *" : ""}</Text>
          <View style={styles.chipWrap}>
            {(field.options || []).map((opt) => {
              const active = selected.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setFieldValue(
                      field.key,
                      active ? selected.filter((x) => x !== opt) : [...selected, opt]
                    )
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    return (
      <View key={field.key} style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>{field.label}{field.required ? " *" : ""}</Text>
        <TextInput
          style={[styles.input, field.type === "multiline" && styles.inputMultiline]}
          placeholder={field.placeholder || field.label}
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={(attributeValues[field.key] as string) || ""}
          onChangeText={(t) => setFieldValue(field.key, t)}
          keyboardType={field.type === "number" ? "numeric" : "default"}
          multiline={field.type === "multiline"}
          editable={!loading}
        />
      </View>
    );
  };

  const headerTitle =
    step === "store"
      ? "Choose store"
      : step === "category"
        ? "Category"
        : step === "subcategory"
          ? "Subcategory"
          : "Product details";

  const heroMedia = media[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={goBack} disabled={loading}>
                <Text style={styles.backText}>{step === "store" ? "Cancel" : "Back"}</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <View style={{ width: 52 }} />
            </View>

            {brandStores.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Lucide name="storefront-outline" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>No brand store yet</Text>
                <Text style={styles.emptySub}>Create a brand profile first to list products.</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {step === "store" && (
                  <>
                    <Text style={styles.stepHint}>Product appears only in the store you pick.</Text>
                    {brandStores.map((store) => {
                      const active = selectedStoreId === store.id;
                      return (
                        <TouchableOpacity
                          key={store.id}
                          style={[styles.storeRow, active && styles.storeRowActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setSelectedStoreId(store.id);
                          }}
                        >
                          <View style={styles.storeAvatar}>
                            {store.logo ? (
                              <Image source={{ uri: store.logo }} style={styles.storeAvatarImg} />
                            ) : (
                              <Text style={styles.storeAvatarText}>{store.name[0]?.toUpperCase()}</Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.storeName}>{store.name}</Text>
                            <Text style={styles.storeUser}>@{store.username}</Text>
                          </View>
                          {active && <Lucide name="checkmark-circle" size={22} color="#00f5ff" />}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[styles.primaryBtn, !selectedStoreId && styles.primaryBtnDisabled]}
                      disabled={!selectedStoreId}
                      onPress={() => setStep("category")}
                    >
                      <Text style={styles.primaryBtnText}>Continue</Text>
                    </TouchableOpacity>
                  </>
                )}

                {step === "category" && (
                  <>
                    {selectedStore && (
                      <View style={styles.selectedStoreBanner}>
                        <Lucide name="storefront-outline" size={16} color="#00f5ff" />
                        <Text style={styles.selectedStoreText}>{selectedStore.name}</Text>
                      </View>
                    )}
                    <View style={styles.categoryGrid}>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.categoryCard, categoryId === cat.id && styles.categoryCardActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setCategoryId(cat.id);
                            setSubcategoryId(null);
                            setAttributeValues({});
                            setSelectedSizes([]);
                            setSelectedColors([]);
                          }}
                        >
                          <Lucide
                            name={cat.icon as any}
                            size={22}
                            color={categoryId === cat.id ? "#00f5ff" : "rgba(255,255,255,0.5)"}
                          />
                          <Text
                            style={[styles.categoryLabel, categoryId === cat.id && styles.categoryLabelActive]}
                            numberOfLines={2}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, !categoryId && styles.primaryBtnDisabled]}
                      disabled={!categoryId}
                      onPress={() => setStep("subcategory")}
                    >
                      <Text style={styles.primaryBtnText}>Continue</Text>
                    </TouchableOpacity>
                  </>
                )}

                {step === "subcategory" && category && (
                  <>
                    <Text style={styles.stepHint}>{category.label} — pick a type</Text>
                    {category.subcategories.map((sub) => {
                      const active = subcategoryId === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[styles.storeRow, active && styles.storeRowActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setSubcategoryId(sub.id);
                            setAttributeValues({});
                            setSelectedSizes([]);
                            setSelectedColors([]);
                          }}
                        >
                          <Text style={[styles.storeName, { flex: 1 }]}>{sub.label}</Text>
                          {active && <Lucide name="checkmark-circle" size={22} color="#00f5ff" />}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[styles.primaryBtn, !subcategoryId && styles.primaryBtnDisabled]}
                      disabled={!subcategoryId}
                      onPress={() => setStep("details")}
                    >
                      <Text style={styles.primaryBtnText}>Continue</Text>
                    </TouchableOpacity>
                  </>
                )}

                {step === "details" && resolvedForm && (
                  <>
                    <TouchableOpacity style={styles.mediaPickerBtn} onPress={handlePickMedia} disabled={loading}>
                      {heroMedia ? (
                        <View>
                          {heroMedia.type === "video" ? (
                            <View style={styles.videoHero}>
                              <Lucide name="videocam" size={40} color="#fff" />
                              <Text style={styles.videoHeroText}>Video selected</Text>
                            </View>
                          ) : (
                            <Image source={{ uri: heroMedia.uri }} style={styles.heroImage} />
                          )}
                        </View>
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Lucide name="images-outline" size={32} color="rgba(255,255,255,0.4)" />
                          <Text style={styles.imageHint}>Add photos or videos (up to 6)</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {media.length > 0 && (
                      <ScrollView horizontal style={styles.thumbRow} showsHorizontalScrollIndicator={false}>
                        {media.map((item, i) => (
                          <View key={`${item.uri}_${i}`} style={styles.thumbWrap}>
                            {item.type === "video" ? (
                              <View style={styles.videoThumb}>
                                <Lucide name="play" size={18} color="#fff" />
                              </View>
                            ) : (
                              <Image source={{ uri: item.uri }} style={styles.thumb} />
                            )}
                            <TouchableOpacity style={styles.thumbRemove} onPress={() => removeMedia(i)}>
                              <Lucide name="close-circle" size={18} color="#ff3b30" />
                            </TouchableOpacity>
                          </View>
                        ))}
                        {media.length < 6 && (
                          <TouchableOpacity style={styles.addThumb} onPress={handlePickMedia}>
                            <Lucide name="add" size={24} color="rgba(255,255,255,0.5)" />
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    )}

                    <View style={styles.subcatPill}>
                      <Text style={styles.subcatPillText}>
                        {resolvedForm.categoryLabel} › {resolvedForm.subcategoryLabel}
                      </Text>
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Title *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Product name"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={title}
                        onChangeText={setTitle}
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Price (₹) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 4999"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Description</Text>
                      <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        placeholder="Describe your product..."
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>After-sale policy *</Text>
                      <Text style={styles.fieldHint}>
                        Fixed 7-day window for your store. Choose return refund or exchange per product.
                      </Text>
                      <View style={styles.chipWrap}>
                        {(["RETURN", "EXCHANGE"] as const).map((policy) => (
                          <TouchableOpacity
                            key={policy}
                            style={[styles.chip, returnPolicy === policy && styles.chipActive]}
                            onPress={() => {
                              triggerHaptic("light");
                              setReturnPolicy(policy);
                            }}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                returnPolicy === policy && styles.chipTextActive,
                              ]}
                            >
                              {policy === "RETURN" ? "7-day return" : "7-day exchange"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {resolvedForm.fields.map(renderField)}

                    {resolvedForm.sizeOptions && (
                      <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Sizes *</Text>
                        <View style={styles.chipWrap}>
                          {resolvedForm.sizeOptions.map((size) => (
                            <TouchableOpacity
                              key={size}
                              style={[styles.chip, selectedSizes.includes(size) && styles.chipActive]}
                              onPress={() => toggleChip(selectedSizes, size, setSelectedSizes)}
                            >
                              <Text style={[styles.chipText, selectedSizes.includes(size) && styles.chipTextActive]}>
                                {size}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {resolvedForm.colorOptions && (
                      <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Colors</Text>
                        <View style={styles.chipWrap}>
                          {resolvedForm.colorOptions.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[styles.chip, selectedColors.includes(color) && styles.chipActive]}
                              onPress={() => toggleChip(selectedColors, color, setSelectedColors)}
                            >
                              <Text style={[styles.chipText, selectedColors.includes(color) && styles.chipTextActive]}>
                                {color}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {(resolvedForm.sizeOptions || resolvedForm.colorOptions) && (
                      <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>Stock per variant</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="10"
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          value={stockPerVariant}
                          onChangeText={setStockPerVariant}
                          keyboardType="numeric"
                          editable={!loading}
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.primaryBtn, styles.publishBtn]}
                      onPress={handlePublish}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Publish to {selectedStore?.name}</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backText: { color: "rgba(255,255,255,0.65)", fontSize: 15, width: 52 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  stepHint: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 16, lineHeight: 18 },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  storeRowActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,245,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  storeAvatarImg: { width: 44, height: 44 },
  storeAvatarText: { color: "#00f5ff", fontWeight: "700", fontSize: 16 },
  storeName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  storeUser: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  selectedStoreBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  selectedStoreText: { color: "#00f5ff", fontSize: 13, fontWeight: "600" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  categoryCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: 8,
    minHeight: 88,
    justifyContent: "center",
  },
  categoryCardActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  categoryLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  categoryLabelActive: { color: "#fff" },
  subcatPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  subcatPillText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },
  mediaPickerBtn: { marginBottom: 12 },
  heroImage: { width: "100%", height: 180, borderRadius: 14 },
  videoHero: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  videoHeroText: { color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 13 },
  imagePlaceholder: {
    height: 180,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
  },
  imageHint: { color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 13 },
  thumbRow: { marginBottom: 12 },
  thumbWrap: { marginRight: 8, position: "relative" },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  videoThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbRemove: { position: "absolute", top: -6, right: -6 },
  addThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderColor: "rgba(0,245,255,0.45)",
  },
  chipText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#00f5ff" },
  primaryBtn: {
    backgroundColor: "#00f5ff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  publishBtn: { marginTop: 20 },
  primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },
  emptyWrap: { padding: 32, alignItems: "center" },
  emptyTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginTop: 12 },
  emptySub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
