import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ComposerBottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onDone?: () => void;
  doneLabel?: string;
  cancelLabel?: string;
  height?: number | `${number}%`;
  children: React.ReactNode;
  headerStyle?: ViewStyle;
}

export function ComposerBottomSheet({
  visible,
  title,
  onClose,
  onDone,
  doneLabel = "Done",
  cancelLabel = "Cancel",
  height = "52%",
  children,
  headerStyle,
}: ComposerBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { height, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.handle} />
        {(title || onDone) && (
          <View style={[styles.header, headerStyle]}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>{cancelLabel}</Text>
            </TouchableOpacity>
            {title ? <Text style={styles.title}>{title}</Text> : <View style={{ flex: 1 }} />}
            {onDone ? (
              <TouchableOpacity onPress={onDone} hitSlop={8}>
                <Text style={styles.done}>{doneLabel}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 52 }} />
            )}
          </View>
        )}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#121212",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancel: { color: "#fff", fontSize: 16, width: 72 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  done: {
    color: "#0095f6",
    fontSize: 16,
    fontWeight: "700",
    width: 72,
    textAlign: "right",
  },
});
