import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { IgSettingsScreen } from "@/components/settings/InstagramSettingsUI";
import { fetchSavedPosts, unsavePost, type SavedPost } from "@/lib/settingsApi";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

type Tab = "all" | "posts" | "products" | "reels";

export default function SavedSettingsScreen() {
  const { currentUser, activeProfile, wishlist, fetchWishlist, toggleWishlist, formatPrice, triggerHaptic } =
    useStore();
  const userId = currentUser?.id || activeProfile?.userId || "";
  const [tab, setTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (userId) {
      await fetchWishlist(userId);
      setPosts(await fetchSavedPosts(userId));
    }
    setLoading(false);
  }, [userId, fetchWishlist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reelPosts = posts.filter((p) => p.type === "reel");
  const feedPosts = posts.filter((p) => p.type !== "reel" && p.type !== "product");
  const showProducts = tab === "all" || tab === "products";
  const showPosts = tab === "all" || tab === "posts";
  const showReels = tab === "all" || tab === "reels";

  return (
    <IgSettingsScreen title="Saved">
      <View style={styles.tabs}>
        {(
          [
            ["all", "All"],
            ["posts", "Posts"],
            ["reels", "Reels"],
            ["products", "Products"],
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

      {loading ? (
        <ActivityIndicator color={IG.accent} style={{ marginTop: 24 }} />
      ) : (
        <>
          {showProducts && wishlist.length > 0 && (
            <>
              <Text style={styles.section}>Shop wishlist</Text>
              {wishlist.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                >
                  <Image
                    source={{ uri: item.images?.[0] }}
                    style={styles.thumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.sub}>{formatPrice(item.price)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => userId && toggleWishlist(userId, item.id).then(refresh)}
                  >
                    <Text style={styles.action}>Remove</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}

          {showPosts && feedPosts.length > 0 && (
            <>
              <Text style={styles.section}>Saved posts</Text>
              {feedPosts.map((item) => (
                <View key={item.id} style={styles.row}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.ph]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.caption || "Saved post"}
                    </Text>
                    <Text style={styles.sub}>@{item.authorUsername}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      triggerHaptic("light");
                      if (userId) await unsavePost(userId, item.postId);
                      refresh();
                    }}
                  >
                    <Text style={styles.action}>Unsave</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {showReels && reelPosts.length > 0 && (
            <>
              <Text style={styles.section}>Saved reels</Text>
              {reelPosts.map((item) => (
                <View key={item.id} style={styles.row}>
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.ph]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Reel by @{item.authorUsername}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      if (userId) await unsavePost(userId, item.postId);
                      refresh();
                    }}
                  >
                    <Text style={styles.action}>Unsave</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {!wishlist.length && !posts.length && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySub}>
                Save posts, reels and products to view them here.
              </Text>
            </View>
          )}
        </>
      )}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: IG.searchBg },
  tabActive: { backgroundColor: IG.accent },
  tabText: { color: IG.text, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: IG.text,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  thumb: { width: 52, height: 52, borderRadius: 6 },
  ph: { backgroundColor: IG.searchBg },
  title: { fontSize: 14, fontWeight: "600", color: IG.text },
  sub: { fontSize: 12, color: IG.textSecondary, marginTop: 2 },
  action: { color: IG.accent, fontWeight: "700" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: IG.text },
  emptySub: { fontSize: 14, color: IG.textSecondary, textAlign: "center", marginTop: 8 },
});
