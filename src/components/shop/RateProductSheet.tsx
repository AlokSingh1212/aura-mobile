import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";

type Props = {
  visible: boolean;
  productTitle?: string;
  onClose: () => void;
  onSubmit: (rating: number, content: string) => Promise<void>;
};

export function RateProductSheet({ visible, productTitle, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!visible) {
      setRating(0);
      setContent("");
      setError("");
    }
  }, [visible]);

  const submit = async () => {
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    if (content.trim().length < 10) {
      setError("Write at least 10 characters about your experience.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(rating, content.trim());
      onClose();
    } catch (e: any) {
      setError(e?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate this product</Text>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color={SHOP.textSecondary} />
            </TouchableOpacity>
          </View>

          {productTitle ? (
            <Text style={styles.product} numberOfLines={2}>
              {productTitle}
            </Text>
          ) : null}

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                <Lucide
                  name={n <= rating ? "star" : "star-outline"}
                  size={36}
                  color={n <= rating ? SHOP.star : SHOP.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 0 ? "Tap to rate" : `${rating} out of 5`}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Share details about quality, fit, delivery…"
            placeholderTextColor={SHOP.textMuted}
            multiline
            maxLength={500}
            value={content}
            onChangeText={setContent}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={SHOP.accentText} />
            ) : (
              <Text style={styles.submitText}>Submit review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: "700", color: SHOP.text },
  product: { fontSize: 13, color: SHOP.textSecondary, marginBottom: 12 },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  ratingHint: {
    textAlign: "center",
    fontSize: 13,
    color: SHOP.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    minHeight: 100,
    padding: 12,
    fontSize: 14,
    color: SHOP.text,
    textAlignVertical: "top",
  },
  error: { color: SHOP.red, fontSize: 12, marginTop: 8 },
  submitBtn: {
    backgroundColor: SHOP.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { fontWeight: "800", fontSize: 15, color: SHOP.accentText },
});
