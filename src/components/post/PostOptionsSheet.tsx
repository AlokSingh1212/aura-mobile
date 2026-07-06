import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import type { EngagementPostItem } from "@/hooks/usePostEngagement";

interface PostOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  post: EngagementPostItem | null;
  isOwnPost: boolean;
  onSave: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onHide?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
}

export function PostOptionsSheet({
  visible,
  onClose,
  post,
  isOwnPost,
  onSave,
  onShare,
  onCopyLink,
  onDelete,
  onArchive,
  onHide,
  onMute,
  onBlock,
}: PostOptionsSheetProps) {
  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <View style={styles.group}>
            <OptionRow icon="bookmark-outline" label="Save to collection" onPress={() => { onClose(); onSave(); }} />
            <Divider />
            <OptionRow icon="share-social-outline" label="Share to..." onPress={() => { onClose(); onShare(); }} />
            <Divider />
            <OptionRow icon="link-outline" label="Copy link" onPress={() => { onClose(); onCopyLink(); }} />
          </View>

          {isOwnPost ? (
            <View style={[styles.group, { marginTop: 10 }]}>
              {onArchive ? (
                <>
                  <OptionRow
                    icon="archive-outline"
                    label="Archive"
                    onPress={() => {
                      onClose();
                      onArchive();
                    }}
                  />
                  <Divider />
                </>
              ) : null}
              <OptionRow
                icon="trash-outline"
                label="Delete post"
                destructive
                onPress={() => {
                  onClose();
                  onDelete();
                }}
              />
            </View>
          ) : (
            <View style={[styles.group, { marginTop: 10 }]}>
              <OptionRow
                icon="eye-off-outline"
                label="Hide post"
                onPress={() => {
                  onClose();
                  onHide?.();
                }}
              />
              {onMute ? (
                <>
                  <Divider />
                  <OptionRow
                    icon="volume-mute-outline"
                    label="Mute"
                    onPress={() => {
                      onClose();
                      onMute();
                    }}
                  />
                </>
              ) : null}
              {onBlock ? (
                <>
                  <Divider />
                  <OptionRow
                    icon="ban-outline"
                    label="Block"
                    destructive
                    onPress={() => {
                      onClose();
                      onBlock();
                    }}
                  />
                </>
              ) : null}
              <Divider />
              <OptionRow
                icon="flag-outline"
                label="Report"
                destructive
                onPress={onClose}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function OptionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Lucide name={icon as any} size={22} color={destructive ? "#fb923c" : "#fff"} />
      <Text style={[styles.rowText, destructive && { color: "#fb923c" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginVertical: 10,
  },
  group: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 52,
  },
});
