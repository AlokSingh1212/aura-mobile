import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgToggle,
  IgCheckRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { useSettingsSection } from "@/hooks/useSettingsSection";
import { IG } from "@/theme/settingsTheme";

export default function ContentSettingsScreen() {
  const { data, patch } = useSettingsSection("content");
  const [word, setWord] = useState("");
  if (!data) return null;

  const addWord = () => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    if (data.mutedWords.includes(w)) {
      Alert.alert("Already added");
      return;
    }
    patch({ mutedWords: [...data.mutedWords, w] });
    setWord("");
  };

  const removeWord = (w: string) => {
    patch({ mutedWords: data.mutedWords.filter((x) => x !== w) });
  };

  return (
    <IgSettingsScreen title="Content preferences">
      <IgBodyText>
        Control what you see across feed, reels, live and shop recommendations.
      </IgBodyText>

      <IgSectionTitle>Sensitive content</IgSectionTitle>
      <IgCheckRow
        label="Less"
        hint="Limit sensitive posts and live content"
        selected={data.sensitiveContent === "less"}
        onPress={() => patch({ sensitiveContent: "less" })}
      />
      <IgCheckRow
        label="Standard"
        selected={data.sensitiveContent === "standard"}
        onPress={() => patch({ sensitiveContent: "standard" })}
      />
      <IgCheckRow
        label="More"
        hint="See more sensitive content in Explore"
        selected={data.sensitiveContent === "more"}
        onPress={() => patch({ sensitiveContent: "more" })}
        last
      />

      <IgSectionTitle>Political content</IgSectionTitle>
      <IgCheckRow
        label="Reduce political content"
        selected={data.politicalContent === "reduce"}
        onPress={() => patch({ politicalContent: "reduce" })}
      />
      <IgCheckRow
        label="Standard"
        selected={data.politicalContent === "standard"}
        onPress={() => patch({ politicalContent: "standard" })}
        last
      />

      <IgSectionTitle>Recommendations</IgSectionTitle>
      <IgToggle
        label="Shop recommendations"
        hint="Personalized products from AURA Shop"
        value={data.shopRecommendations}
        onValueChange={(v) => patch({ shopRecommendations: v })}
      />
      <IgToggle
        label="Live show recommendations"
        value={data.liveRecommendations}
        onValueChange={(v) => patch({ liveRecommendations: v })}
        last
      />

      <IgSectionTitle>Hidden Words</IgSectionTitle>
      <View style={styles.wordRow}>
        <TextInput
          style={styles.input}
          placeholder="Add word or phrase"
          placeholderTextColor={IG.textMuted}
          value={word}
          onChangeText={setWord}
          onSubmitEditing={addWord}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addWord}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
      {data.mutedWords.map((w, idx) => (
        <TouchableOpacity key={w} style={styles.chip} onPress={() => removeWord(w)}>
          <Text style={styles.chipText}>{w} ×</Text>
        </TouchableOpacity>
      ))}
      {data.mutedWords.length === 0 ? (
        <Text style={styles.hint}>Comments and messages containing these words will be hidden.</Text>
      ) : null}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  wordRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: IG.searchBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: IG.text,
  },
  addBtn: { justifyContent: "center", paddingHorizontal: 12 },
  addText: { color: IG.accent, fontWeight: "700" },
  chip: {
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: IG.searchBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: { color: IG.text, fontSize: 14 },
  hint: { color: IG.textMuted, fontSize: 13, paddingHorizontal: 16, paddingBottom: 16 },
});
