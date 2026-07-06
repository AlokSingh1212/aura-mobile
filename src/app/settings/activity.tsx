import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgSectionTitle,
  IgRow,
} from "@/components/settings/InstagramSettingsUI";
import { loadMergedActivity, clearLocalActivity, type ActivityEntry } from "@/lib/activityLog";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

type Tab = "all" | "interactions" | "shop" | "watch";

export default function ActivitySettingsScreen() {
  const { currentUser, activeProfile } = useStore();
  const userId = currentUser?.id || activeProfile?.userId;
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await loadMergedActivity(userId);
    setItems(list);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = items.filter((item) => {
    if (tab === "all") return true;
    if (tab === "interactions") return ["like", "comment", "save"].includes(item.type);
    if (tab === "shop") return ["shop_view", "purchase", "search"].includes(item.type);
    if (tab === "watch") return item.type === "view";
    return true;
  });

  return (
    <IgSettingsScreen title="Your activity">
      <IgSectionTitle>Activity type</IgSectionTitle>
      <View style={styles.tabs}>
        {(
          [
            ["all", "All"],
            ["interactions", "Interactions"],
            ["shop", "Shop"],
            ["watch", "Watch history"],
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

      <IgRow
        label="Download your information"
        onPress={() => router.push("/settings/data" as any)}
      />
      <IgRow
        label="Clear local activity cache"
        onPress={async () => {
          await clearLocalActivity();
          refresh();
        }}
        last
      />

      {loading ? (
        <ActivityIndicator color={IG.accent} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No activity in this category yet.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => item.targetId && router.push("/" as any)}
            >
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPh]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.sub} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: IG.searchBg,
  },
  tabActive: { backgroundColor: IG.accent },
  tabText: { color: IG.text, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  empty: { color: IG.textSecondary, textAlign: "center", padding: 32 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  thumb: { width: 48, height: 48, borderRadius: 6 },
  thumbPh: { backgroundColor: IG.searchBg },
  title: { fontSize: 14, fontWeight: "600", color: IG.text },
  sub: { fontSize: 13, color: IG.textSecondary, marginTop: 2 },
  date: { fontSize: 11, color: IG.textMuted, marginTop: 4 },
});
