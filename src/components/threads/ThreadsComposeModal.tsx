import React, { useState } from "react";
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
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { THREADS_THEME as T } from "@/constants/threadsTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  placeholder?: string;
  avatarUrl?: string | null;
  username?: string;
  replyTo?: string | null;
};

export function ThreadsComposeModal({
  visible,
  onClose,
  onSubmit,
  placeholder = "Start a thread…",
  avatarUrl,
  username,
  replyTo,
}: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setText("");
    onClose();
  };

  const initial = (username || "Y").charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{replyTo ? "Reply" : "New thread"}</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={!text.trim() || submitting}
              style={[styles.postBtn, (!text.trim() || submitting) && styles.postBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={T.bg} />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {replyTo ? (
            <Text style={styles.replyHint}>Replying to @{replyTo}</Text>
          ) : null}

          <View style={styles.composeRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={T.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              maxLength={500}
            />
          </View>

          <View style={styles.footer}>
            <Lucide name="image-outline" size={22} color={T.textMuted} />
            <Lucide name="pricetag-outline" size={22} color={T.textMuted} />
            <Text style={styles.charCount}>{text.length}/500</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    minHeight: 280,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.borderSubtle,
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
    backgroundColor: T.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    minWidth: 64,
    alignItems: "center",
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    color: T.bg,
    fontWeight: "800",
    fontSize: 13,
  },
  replyHint: {
    color: T.textMuted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  composeRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: T.primary,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    color: T.text,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  charCount: {
    marginLeft: "auto",
    color: T.textMuted,
    fontSize: 11,
  },
});
