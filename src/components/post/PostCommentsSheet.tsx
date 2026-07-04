import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import type { EngagementPostItem } from "@/hooks/usePostEngagement";
import { CaptionText } from "@/components/CaptionText";
import { openHashtag, openProfile } from "@/lib/postNavigation";

const { height } = Dimensions.get("window");

interface PostCommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  post: EngagementPostItem | null;
  comments: any[];
  authorLabel: string;
  onAddComment: (text: string) => void;
}

export function PostCommentsSheet({
  visible,
  onClose,
  post,
  comments,
  authorLabel,
  onAddComment,
}: PostCommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { height: height * 0.72, paddingBottom: insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Lucide name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.commentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authorLabel[0]?.toUpperCase() || "A"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>
                  {authorLabel} <Text style={styles.badge}>Author</Text>
                </Text>
                <CaptionText
                  caption={post.caption || "—"}
                  style={styles.commentText}
                  onHashtagPress={openHashtag}
                  onMentionPress={openProfile}
                />
              </View>
            </View>

            <View style={styles.separator} />

            {comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <View style={[styles.avatar, { backgroundColor: "#3b82f6" }]}>
                  <Text style={styles.avatarText}>{c.username[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.username}>{c.username}</Text>
                  <CaptionText
                    caption={c.text}
                    style={styles.commentText}
                    onHashtagPress={openHashtag}
                    onMentionPress={openProfile}
                  />
                  <Text style={styles.time}>{c.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => {
                if (!text.trim()) return;
                onAddComment(text.trim());
                setText("");
              }}
            />
            <TouchableOpacity
              disabled={!text.trim()}
              onPress={() => {
                if (!text.trim()) return;
                onAddComment(text.trim());
                setText("");
              }}
            >
              <Text style={[styles.postBtn, !text.trim() && { opacity: 0.35 }]}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0b071e",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#00f5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#000", fontWeight: "700", fontSize: 13 },
  username: { color: "#fff", fontWeight: "700", fontSize: 13, marginBottom: 2 },
  badge: { color: "rgba(255,255,255,0.45)", fontWeight: "500", fontSize: 11 },
  commentText: { color: "#fff", fontSize: 14, lineHeight: 19 },
  time: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 10,
  },
  postBtn: { color: "#00f5ff", fontWeight: "700", fontSize: 14 },
});
