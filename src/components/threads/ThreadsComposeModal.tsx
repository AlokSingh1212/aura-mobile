import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  STORY_ACCENT,
  STORY_ACCENT_PURPLE,
  STORY_GRADIENT,
  THREADS_THEME as T,
} from "@/constants/threadsTheme";
import { StoryGradientRing } from "@/components/threads/StoryGradientRing";
import { useThreadsInsets } from "@/components/threads/ThreadsScreenShell";
import { ExploreProductsSheet } from "@/components/ExploreProductsSheet";
import { uploadMediaFromUri } from "@/lib/uploadMedia";
import { useStore } from "@/store/useStore";
import { CaptionComposerInput } from "@/components/create/CaptionComposerInput";

export type ThreadComposePayload = {
  content: string;
  mediaUrls?: string[];
  productId?: string;
};

type TaggedProduct = {
  id: string;
  title: string;
  image: string;
  price: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ThreadComposePayload) => Promise<void>;
  placeholder?: string;
  avatarUrl?: string | null;
  username?: string;
  replyTo?: string | null;
  /** Hide product tag on replies (Meta-style: tags on root posts). */
  allowProductTag?: boolean;
};

const MAX_IMAGES = 4;

export function ThreadsComposeModal({
  visible,
  onClose,
  onSubmit,
  placeholder = "Start a thread…",
  avatarUrl,
  username,
  replyTo,
  allowProductTag = true,
}: Props) {
  const triggerHaptic = useStore((s) => s.triggerHaptic);
  const storeProducts = useStore((s) => s.products);
  const fetchProducts = useStore((s) => s.fetchProducts);
  const formatPrice = useStore((s) => s.formatPrice);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [taggedProduct, setTaggedProduct] = useState<TaggedProduct | null>(null);
  const [productSheetVisible, setProductSheetVisible] = useState(false);
  const { bottom } = useThreadsInsets();

  useEffect(() => {
    if (visible) {
      fetchProducts().catch(() => {});
    }
  }, [visible, fetchProducts]);

  const productSheetItems = useMemo(
    () =>
      (storeProducts || []).slice(0, 40).map((p: any) => ({
        id: String(p.id),
        title: p.title || "Product",
        image: p.images?.[0] || p.image || "",
        price: typeof p.price === "number" ? p.price : parseFloat(p.price) || 0,
      })),
    [storeProducts]
  );

  const resetForm = useCallback(() => {
    setText("");
    setMediaUris([]);
    setTaggedProduct(null);
    setProductSheetVisible(false);
  }, []);

  const handleClose = () => {
    if (submitting || uploadingMedia) return;
    resetForm();
    onClose();
  };

  const handlePickGallery = async () => {
    if (mediaUris.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can attach up to ${MAX_IMAGES} photos per thread.`);
      return;
    }

    triggerHaptic("light");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Gallery access", "Allow photo access to attach images to your thread.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - mediaUris.length,
      });

      if (!result.canceled && result.assets?.length) {
        const uris = result.assets.map((a) => a.uri).filter(Boolean);
        setMediaUris((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
      }
    } catch {
      Alert.alert("Gallery error", "Could not open your photo library.");
    }
  };

  const handlePickProduct = () => {
    triggerHaptic("light");
    if (!productSheetItems.length) {
      Alert.alert("No products", "Browse the shop first — products will appear here to tag.");
      return;
    }
    setProductSheetVisible(true);
  };

  const handlePost = async () => {
    const hasContent = !!text.trim() || mediaUris.length > 0 || !!taggedProduct;
    if (!hasContent || submitting || uploadingMedia) return;

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (mediaUris.length) {
        setUploadingMedia(true);
        uploadedUrls = await Promise.all(
          mediaUris.map((uri) => uploadMediaFromUri(uri, "post"))
        );
        setUploadingMedia(false);
      }

      await onSubmit({
        content: text.trim(),
        mediaUrls: uploadedUrls.length ? uploadedUrls : undefined,
        productId: taggedProduct?.id,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not post thread";
      Alert.alert("Post failed", msg);
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  const initial = (username || "Y").charAt(0).toUpperCase();
  const canPost = (!!text.trim() || mediaUris.length > 0 || !!taggedProduct) && !submitting && !uploadingMedia;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) }]}>
            <LinearGradient
              colors={[...STORY_GRADIENT.colors]}
              start={STORY_GRADIENT.start}
              end={STORY_GRADIENT.end}
              style={styles.handle}
            />
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} disabled={submitting}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{replyTo ? "Reply" : "New thread"}</Text>
              <TouchableOpacity onPress={handlePost} disabled={!canPost}>
                {canPost ? (
                  <LinearGradient
                    colors={[...STORY_GRADIENT.colors]}
                    start={STORY_GRADIENT.start}
                    end={STORY_GRADIENT.end}
                    style={styles.postBtn}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.postBtnText}>
                        {uploadingMedia ? "Upload…" : "Post"}
                      </Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.postBtn, styles.postBtnDisabled]}>
                    <Text style={[styles.postBtnText, { opacity: 0.5 }]}>Post</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {replyTo ? (
              <Text style={styles.replyHint}>
                Replying to <Text style={styles.replyMention}>@{replyTo}</Text>
              </Text>
            ) : null}

            <View style={styles.composeRow}>
              <StoryGradientRing size={44} ringWidth={2.5}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}
              </StoryGradientRing>
              <View style={{ flex: 1 }}>
                <CaptionComposerInput
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholder}
                  maxLength={500}
                  minHeight={100}
                />
              </View>
            </View>

            {mediaUris.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaPreviewRow}
              >
                {mediaUris.map((uri) => (
                  <View key={uri} style={styles.mediaThumbWrap}>
                    <Image source={{ uri }} style={styles.mediaThumb} />
                    <TouchableOpacity
                      style={styles.mediaRemove}
                      onPress={() => setMediaUris((prev) => prev.filter((u) => u !== uri))}
                    >
                      <Lucide name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {taggedProduct ? (
              <View style={styles.taggedProduct}>
                {taggedProduct.image ? (
                  <Image source={{ uri: taggedProduct.image }} style={styles.taggedImg} />
                ) : null}
                <View style={styles.taggedMeta}>
                  <Lucide name="pricetag" size={12} color={STORY_ACCENT_PURPLE} />
                  <Text style={styles.taggedTitle} numberOfLines={1}>
                    {taggedProduct.title}
                  </Text>
                  <Text style={styles.taggedPrice}>
                    {formatPrice ? formatPrice(taggedProduct.price) : `₹${taggedProduct.price}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setTaggedProduct(null)}>
                  <Lucide name="close-circle" size={20} color={T.textMuted} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={handlePickGallery}
                disabled={submitting || mediaUris.length >= MAX_IMAGES}
              >
                <Lucide
                  name="image-outline"
                  size={22}
                  color={mediaUris.length >= MAX_IMAGES ? T.textMuted : STORY_ACCENT}
                />
              </TouchableOpacity>
              {allowProductTag ? (
                <TouchableOpacity
                  style={styles.footerBtn}
                  onPress={handlePickProduct}
                  disabled={submitting || !!taggedProduct}
                >
                  <Lucide
                    name="pricetag-outline"
                    size={22}
                    color={taggedProduct ? T.textMuted : STORY_ACCENT_PURPLE}
                  />
                </TouchableOpacity>
              ) : null}
              <Text style={styles.charCount}>{text.length}/500</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ExploreProductsSheet
        visible={productSheetVisible}
        products={productSheetItems}
        onClose={() => setProductSheetVisible(false)}
        onProductPress={(productId) => {
          const picked = productSheetItems.find((p) => p.id === productId);
          if (picked) {
            triggerHaptic("success");
            setTaggedProduct(picked);
          }
          setProductSheetVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: T.surfaceElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    minHeight: 280,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSubtle,
  },
  cancel: {
    color: T.textSecondary,
    fontSize: 14,
  },
  title: {
    color: T.text,
    fontSize: 15,
    fontWeight: "700",
  },
  postBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 64,
    alignItems: "center",
  },
  postBtnDisabled: {
    backgroundColor: T.surface,
    borderRadius: 16,
  },
  postBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  replyHint: {
    color: T.textMuted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  replyMention: {
    color: STORY_ACCENT,
    fontWeight: "600",
  },
  composeRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: STORY_ACCENT,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    color: T.text,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
  },
  mediaPreviewRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  mediaThumbWrap: {
    position: "relative",
  },
  mediaThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: T.surface,
  },
  mediaRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  taggedProduct: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    gap: 10,
  },
  taggedImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  taggedMeta: {
    flex: 1,
    gap: 2,
  },
  taggedTitle: {
    color: T.text,
    fontSize: 12,
    fontWeight: "700",
  },
  taggedPrice: {
    color: STORY_ACCENT_PURPLE,
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  footerBtn: {
    padding: 8,
  },
  charCount: {
    marginLeft: "auto",
    color: T.textMuted,
    fontSize: 11,
    paddingRight: 4,
  },
});
