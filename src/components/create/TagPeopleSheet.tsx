import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { searchProfiles } from "@/lib/postComposerSearch";
import { MAX_POST_PEOPLE, type PostPersonTag } from "@/lib/postComposerTypes";

interface TagPeopleSheetProps {
  visible: boolean;
  selected: PostPersonTag[];
  onClose: () => void;
  onChange: (people: PostPersonTag[]) => void;
}

type TabKind = "tag" | "collab";

export function TagPeopleSheet({ visible, selected, onClose, onChange }: TagPeopleSheetProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKind>("tag");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; title: string; subtitle: string; imageUri: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const profiles = await searchProfiles(text);
      setResults(
        profiles.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `@${p.username}`,
          imageUri: p.logo,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setTab("tag");
      return;
    }
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [visible, query, runSearch]);

  const addPerson = (item: { id: string; title: string; subtitle: string }) => {
    if (selected.length >= MAX_POST_PEOPLE) {
      Alert.alert("Limit reached", `You can add up to ${MAX_POST_PEOPLE} tags and collabs combined.`);
      return;
    }
    const username = item.subtitle.replace(/^@/, "");
    if (selected.some((p) => p.profileId === item.id || p.username === username)) {
      Alert.alert("Already added", `@${username} is already on this post.`);
      return;
    }
    onChange([
      ...selected,
      {
        profileId: item.id,
        username,
        name: item.title,
        kind: tab,
      },
    ]);
  };

  const removePerson = (profileId: string) => {
    onChange(selected.filter((p) => p.profileId !== profileId));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tag people</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "tag" && styles.tabBtnActive]}
            onPress={() => setTab("tag")}
          >
            <Lucide name="person-outline" size={18} color={tab === "tag" ? "#ff9500" : "#fff"} />
            <Text style={[styles.tabText, tab === "tag" && styles.tabTextTag]}>Add tag</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "collab" && styles.tabBtnActive]}
            onPress={() => setTab("collab")}
          >
            <Lucide name="people-outline" size={18} color={tab === "collab" ? "#00f5ff" : "#fff"} />
            <Text style={[styles.tabText, tab === "collab" && styles.tabTextCollab]}>Collab</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.limitHint}>
          {selected.length}/{MAX_POST_PEOPLE} · tags and collabs combined
        </Text>

        {selected.length > 0 ? (
          <View style={styles.chipRow}>
            {selected.map((person) => (
              <View
                key={person.profileId}
                style={[styles.chip, person.kind === "collab" ? styles.chipCollab : styles.chipTag]}
              >
                <Text style={styles.chipText} numberOfLines={1}>
                  {person.kind === "collab" ? "Collab · " : ""}@{person.username}
                </Text>
                <TouchableOpacity onPress={() => removePerson(person.profileId)} hitSlop={8}>
                  <Lucide name="close-circle" size={16} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === "tag" ? "Search people to tag…" : "Search collab partners…"}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#00f5ff" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim() ? "No profiles found" : "Search by name or @username"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => addPerson(item)}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                ) : (
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconLetter}>{item.title[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <Lucide
                  name={tab === "collab" ? "people" : "person-add-outline"}
                  size={18}
                  color={tab === "collab" ? "#00f5ff" : "#ff9500"}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabBtnActive: { borderColor: "rgba(0,245,255,0.35)", backgroundColor: "rgba(0,245,255,0.08)" },
  tabText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabTextTag: { color: "#ff9500" },
  tabTextCollab: { color: "#00f5ff" },
  limitHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    maxWidth: "100%",
  },
  chipTag: { backgroundColor: "rgba(255,149,0,0.15)" },
  chipCollab: { backgroundColor: "rgba(0,245,255,0.12)" },
  chipText: { color: "#fff", fontSize: 13, fontWeight: "600", maxWidth: 160 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 24,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  thumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#111" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLetter: { color: "#fff", fontWeight: "700", fontSize: 16 },
  rowTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
