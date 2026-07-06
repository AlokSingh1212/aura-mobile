import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import {
  IgSettingsScreen,
  IgSectionTitle,
} from "@/components/settings/InstagramSettingsUI";
import { loadSocialGraph, unarchiveItem, type ArchivedItem } from "@/lib/socialGraph";
import { invalidateSocialGraphCache } from "@/lib/socialGraph";
import { IG } from "@/theme/settingsTheme";

type Tab = "all" | "post" | "story" | "reel";

export default function ArchivesSettingsScreen() {
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<ArchivedItem[]>([]);

  const refresh = useCallback(async () => {
    invalidateSocialGraphCache();
    const g = await loadSocialGraph();
    setItems(g.archived);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = items.filter((i) => tab === "all" || i.type === tab);

  return (
    <IgSettingsScreen title="Archives">
      <Text style={styles.intro}>
        Only you can see what you've archived. Unarchive to show on your profile again.
      </Text>

      <View style={styles.tabs}>
        {(
          [
            ["all", "All"],
            ["post", "Posts"],
            ["story", "Stories"],
            ["reel", "Reels"],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing archived</Text>
          <Text style={styles.emptySub}>
            Archive posts, stories and reels from the ··· menu on any content you created.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPh]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.type}>{item.type.toUpperCase()}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title || "Archived content"}
                </Text>
                {item.authorUsername ? (
                  <Text style={styles.sub}>@{item.authorUsername}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await unarchiveItem(item.id, item.type);
                  refresh();
                }}
              >
                <Text style={styles.unarchive}>Unarchive</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 14,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabs: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: IG.searchBg },
  tabActive: { backgroundColor: IG.accent },
  tabText: { color: IG.text, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  empty: { padding: 40, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: IG.text },
  emptySub: { fontSize: 14, color: IG.textSecondary, textAlign: "center", marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  thumb: { width: 56, height: 56, borderRadius: 6 },
  thumbPh: { backgroundColor: IG.searchBg },
  type: { fontSize: 10, fontWeight: "700", color: IG.textMuted },
  title: { fontSize: 14, fontWeight: "600", color: IG.text },
  sub: { fontSize: 12, color: IG.textSecondary },
  unarchive: { color: IG.accent, fontWeight: "700" },
});
