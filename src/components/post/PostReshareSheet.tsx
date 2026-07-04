import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { resharePost, removeReshare } from "@/lib/profileApi";
import { repostMediaLabel, resolveReshareSourceId } from "@/lib/postRepost";

export interface ReshareTarget {
  id: string;
  caption?: string;
  mediaUrl?: string;
  thumbnail?: string;
  authorUsername?: string;
  repostOf?: {
    postId: string;
    authorUsername: string;
    mediaType?: "post" | "reel" | "product";
  } | null;
}

interface PostReshareSheetProps {
  visible: boolean;
  onClose: () => void;
  target: ReshareTarget | null;
  existingRepostId?: string | null;
  onComplete?: (result: { repostId?: string; repostCount?: number; removed?: boolean }) => void;
}

export function PostReshareSheet({
  visible,
  onClose,
  target,
  existingRepostId,
  onComplete,
}: PostReshareSheetProps) {
  const { triggerHaptic, currentUser, activeProfile } = useStore();
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);

  const sourceId = target ? resolveReshareSourceId(target) : "";
  const previewUrl = target?.thumbnail || target?.mediaUrl || "";
  const originalAuthor =
    target?.repostOf?.authorUsername || target?.authorUsername || "creator";
  const mediaLabel = repostMediaLabel(target?.repostOf?.mediaType);

  const handleClose = () => {
    setQuote("");
    onClose();
  };

  const handleReshare = async () => {
    if (!target || !currentUser?.id || !activeProfile?.id) {
      Alert.alert("Sign in required", "Sign in to reshare to your profile.");
      return;
    }
    setBusy(true);
    try {
      const result = await resharePost({
        userId: currentUser.id,
        profileId: activeProfile.id,
        sourcePostId: sourceId,
        quoteCaption: quote,
      });
      if (result.success) {
        triggerHaptic("success");
        onComplete?.({
          repostId: result.repostId,
          repostCount: result.repostCount,
        });
        handleClose();
        Alert.alert(
          result.alreadyReposted ? "Already on your profile" : "Reshared",
          result.alreadyReposted
            ? "This is already on your profile grid."
            : "This now appears on your profile for your followers."
        );
      } else {
        Alert.alert("Could not reshare", result.error || "Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!existingRepostId || !currentUser?.id) return;
    setBusy(true);
    try {
      const result = await removeReshare({
        userId: currentUser.id,
        repostId: existingRepostId,
      });
      if (result.success) {
        triggerHaptic("medium");
        onComplete?.({ repostCount: result.repostCount, removed: true });
        handleClose();
        Alert.alert("Removed", "Reshare removed from your profile.");
      } else {
        Alert.alert("Could not remove", result.error || "Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>Reshare to profile</Text>
          <Text style={styles.subtitle}>
            {mediaLabel} by @{originalAuthor} will appear on your profile grid.
          </Text>

          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.preview} contentFit="cover" />
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Add an optional note…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={quote}
            onChangeText={setQuote}
            multiline
            maxLength={2200}
            keyboardAppearance="dark"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={handleReshare}
          >
            {busy ? (
              <ActivityIndicator color="#080415" />
            ) : (
              <>
                <Lucide name="repeat" size={18} color="#080415" />
                <Text style={styles.primaryBtnText}>Reshare</Text>
              </>
            )}
          </TouchableOpacity>

          {existingRepostId ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              disabled={busy}
              onPress={handleRemove}
            >
              <Text style={styles.secondaryBtnText}>Remove from your profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 18,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  input: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: "#080415",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
