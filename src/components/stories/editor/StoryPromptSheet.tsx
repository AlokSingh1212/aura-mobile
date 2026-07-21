import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";

export type StoryPromptKind = "poll" | "question" | "add_yours" | "hashtag" | "emoji_slider";

export type StoryPromptResult =
  | { kind: "poll"; question: string; options: [string, string] }
  | { kind: "question"; question: string }
  | { kind: "add_yours"; prompt: string }
  | { kind: "hashtag"; tag: string }
  | { kind: "emoji_slider"; emoji: string };

type Props = {
  visible: boolean;
  kind: StoryPromptKind;
  onClose: () => void;
  onSubmit: (result: StoryPromptResult) => void;
};

export function StoryPromptSheet({ visible, kind, onClose, onSubmit }: Props) {
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");

  const title =
    kind === "poll"
      ? "Create poll"
      : kind === "question"
        ? "Ask a question"
        : kind === "add_yours"
          ? "Add Yours prompt"
          : kind === "hashtag"
            ? "Add hashtag"
            : "Emoji slider";

  const handleDone = () => {
    const p = primary.trim();
    if (!p && kind !== "emoji_slider") return;

    if (kind === "poll") {
      const o1 = p || "Yes";
      const o2 = secondary.trim() || "No";
      onSubmit({ kind, question: p || "Which do you prefer?", options: [o1, o2] });
    } else if (kind === "question") {
      onSubmit({ kind, question: p });
    } else if (kind === "add_yours") {
      onSubmit({ kind, prompt: p });
    } else if (kind === "hashtag") {
      onSubmit({ kind, tag: p.replace(/^#/, "") });
    } else {
      onSubmit({ kind, emoji: p || "😍" });
    }
    setPrimary("");
    setSecondary("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{title}</Text>
            <TextInput
              style={styles.input}
              placeholder={
                kind === "poll"
                  ? "Question"
                  : kind === "hashtag"
                    ? "Tag name"
                    : kind === "emoji_slider"
                      ? "Emoji (e.g. 😍)"
                      : "Text"
              }
              placeholderTextColor="#999"
              value={primary}
              onChangeText={setPrimary}
              autoFocus
              maxLength={280}
            />
            {kind === "poll" ? (
              <TextInput
                style={styles.input}
                placeholder="Option 2"
                placeholderTextColor="#999"
                value={secondary}
                onChangeText={setSecondary}
                maxLength={80}
              />
            ) : null}
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneText}>Add to story</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 32,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 12 },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
    marginBottom: 12,
  },
  doneBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
