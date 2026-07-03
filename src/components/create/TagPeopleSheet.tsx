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
import { MAX_PHOTO_TAGS, type PhotoTag, type CollabPartner } from "@/lib/postComposerTypes";

type Tab = "tag" | "collab";

interface TagPeopleSheetProps {
  visible: boolean;
  photoTags: PhotoTag[];
  collabPartner: CollabPartner | null;
  onClose: () => void;
  onPhotoTagsChange: (tags: PhotoTag[]) => void;
  onCollabChange: (partner: CollabPartner | null) => void;
}

/** Tag people in the photo + invite one collab partner — same place, two tabs. */
export function TagPeopleSheet({
  visible,
  photoTags,
  collabPartner,
  onClose,
  onPhotoTagsChange,
  onCollabChange,
}: TagPeopleSheetProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("tag");
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

  const addPhotoTag = (item: { id: string; title: string; subtitle: string; imageUri: string | null }) => {
    if (photoTags.length >= MAX_PHOTO_TAGS) {
      Alert.alert("Limit reached", `You can tag up to ${MAX_PHOTO_TAGS} people in the photo.`);
      return;
    }
    const username = item.subtitle.replace(/^@/, "");
    if (photoTags.some((p) => p.profileId === item.id)) {
      Alert.alert("Already tagged", `${item.title} is already tagged in this photo.`);
      return;
    }
    onPhotoTagsChange([
      ...photoTags,
      { profileId: item.id, username, name: item.title, logo: item.imageUri },
    ]);
  };

  const removePhotoTag = (profileId: string) => {
    onPhotoTagsChange(photoTags.filter((p) => p.profileId !== profileId));
  };

  const pickCollab = (item: { id: string; title: string; subtitle: string; imageUri: string | null }) => {
    onCollabChange({
      profileId: item.id,
      username: item.subtitle.replace(/^@/, ""),
      name: item.title,
      logo: item.imageUri,
      status: "pending",
    });
    onClose();
  };

  const onRowPress = (item: { id: string; title: string; subtitle: string; imageUri: string | null }) => {
    if (tab === "tag") addPhotoTag(item);
    else pickCollab(item);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tag people</Text>
          <View style={{ width: 64 }} />
        </View>

        <View style={styles.searchHeader}>
          <Lucide name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === "tag" && styles.tabActive]}
            onPress={() => setTab("tag")}
          >
            <Lucide name="person-outline" size={16} color={tab === "tag" ? "#ff9500" : "#fff"} />
            <Text style={[styles.tabText, tab === "tag" && styles.tabTextTag]}>In photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "collab" && styles.tabActiveCollab]}
            onPress={() => setTab("collab")}
          >
            <Lucide name="people-outline" size={16} color={tab === "collab" ? "#00f5ff" : "#fff"} />
            <Text style={[styles.tabText, tab === "collab" && styles.tabTextCollab]}>Collab</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          {tab === "tag"
            ? "Tag people who appear in your photo — they show as bubbles on the image."
            : "Invite an influencer as co-author — shows in the post header when they accept."}
        </Text>

        {tab === "tag" ? (
          <>
            <Text style={styles.limitHint}>
              {photoTags.length}/{MAX_PHOTO_TAGS} tagged in photo
            </Text>
            {photoTags.length > 0 ? (
              <View style={styles.chipRow}>
                {photoTags.map((person) => (
                  <View key={person.profileId} style={styles.chipTag}>
                    {person.logo ? (
                      <Image source={{ uri: person.logo }} style={styles.chipAvatar} />
                    ) : (
                      <View style={styles.chipAvatarFallback}>
                        <Text style={styles.chipInitial}>{person.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.chipText} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <TouchableOpacity onPress={() => removePhotoTag(person.profileId)} hitSlop={8}>
                      <Lucide name="close-circle" size={16} color="rgba(255,255,255,0.55)" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : collabPartner ? (
          <View style={styles.collabSelected}>
            {collabPartner.logo ? (
              <Image source={{ uri: collabPartner.logo }} style={styles.thumb} />
            ) : (
              <View style={styles.iconCircle}>
                <Text style={styles.iconLetter}>{collabPartner.name[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{collabPartner.name}</Text>
              <Text style={styles.rowSub}>@{collabPartner.username} · pending</Text>
            </View>
            <TouchableOpacity onPress={() => onCollabChange(null)} hitSlop={8}>
              <Lucide name="close-circle" size={22} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInputInner}
            placeholder={tab === "tag" ? "Search people…" : "Search influencer…"}
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
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
                {query.trim() ? "No profiles found" : "Search by name or username"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onRowPress(item)}>
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
                  name={tab === "tag" ? "person-add-outline" : "people"}
                  size={18}
                  color={tab === "tag" ? "#ff9500" : "#00f5ff"}
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
  cancelBtn: { color: "#fff", fontSize: 16, width: 64 },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "rgba(255,149,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,149,0,0.35)",
  },
  tabActiveCollab: {
    backgroundColor: "rgba(0,245,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  tabText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabTextTag: { color: "#ff9500" },
  tabTextCollab: { color: "#00f5ff" },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
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
  chipTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,149,0,0.15)",
    maxWidth: "100%",
  },
  chipAvatar: { width: 22, height: 22, borderRadius: 11 },
  chipAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipInitial: { color: "#fff", fontSize: 10, fontWeight: "700" },
  chipText: { color: "#fff", fontSize: 13, fontWeight: "600", maxWidth: 120 },
  collabSelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
  },
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
  searchInputInner: { flex: 1, color: "#fff", fontSize: 16 },
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
