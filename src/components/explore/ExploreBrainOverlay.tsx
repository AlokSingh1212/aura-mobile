import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  fetchExploreBrowse,
  searchExplore,
  type ExploreCreator,
  type ExploreGridItem,
  type ExploreHashtag,
  type ExploreTile,
} from "@/lib/exploreApi";
import { postEngagementEvents } from "@/lib/reelsSessionApi";

type Props = {
  visible: boolean;
  userId?: string;
  bottomInset: number;
  onClose: () => void;
  onGridItemPress: (item: ExploreGridItem) => void;
  onCreatorPress: (username: string) => void;
  triggerHaptic: (type: "light" | "medium" | "heavy") => void;
};

function logExploreTap(
  userId: string | undefined,
  contentId: string,
  creatorId?: string | null,
  metadata?: Record<string, unknown>
) {
  if (!userId) return;
  postEngagementEvents({
    userId,
    events: [
      {
        surface: "explore",
        eventType: "impression",
        contentId,
        contentType: "post",
        creatorId: creatorId ?? null,
        metadata,
      },
    ],
  });
}

export function ExploreBrainOverlay({
  visible,
  userId,
  bottomInset,
  onClose,
  onGridItemPress,
  onCreatorPress,
  triggerHaptic,
}: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<ExploreHashtag[]>([]);
  const [creators, setCreators] = useState<ExploreCreator[]>([]);
  const [personalized, setPersonalized] = useState<ExploreTile[]>([]);
  const [searchTiles, setSearchTiles] = useState<ExploreTile[]>([]);
  const [grid, setGrid] = useState<ExploreGridItem[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBrowse = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExploreBrowse(userId);
      if (data.success) {
        setHashtags(data.trending?.hashtags || []);
        setCreators(data.trending?.creators || []);
        setPersonalized(data.personalized || []);
        setGrid(data.grid || []);
        setSearchTiles([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      setQuery("");
      loadBrowse();
    }
  }, [visible, loadBrowse]);

  useEffect(() => {
    if (!visible) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      if (trimmed.length === 0) loadBrowse();
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchExplore(userId, trimmed);
        if (data.success) {
          setGrid(data.grid || []);
          setSearchTiles(data.tiles || []);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, visible, userId, loadBrowse]);

  if (!visible) return null;

  const showPersonalized = query.trim().length < 2 && personalized.length > 0;
  const showTrending = query.trim().length < 2;

  return (
    <View style={[styles.panel, { bottom: bottomInset }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Lucide name="search" size={20} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search AURA — creators, #tags, products..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading && grid.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#00f5ff" size="large" />
          </View>
        ) : (
          <FlatList
            data={grid}
            numColumns={3}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridContent}
            ListHeaderComponent={
              <>
                {searchTiles.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top matches</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileRow}>
                      {searchTiles.map((tile) => (
                        <TouchableOpacity
                          key={tile.id}
                          style={styles.tileCard}
                          onPress={() => {
                            triggerHaptic("light");
                            if (tile.type === "creator") {
                              onCreatorPress(tile.query || tile.label);
                            } else if (tile.query) {
                              setQuery(tile.query);
                            }
                          }}
                        >
                          {tile.coverUrl ? (
                            <Image source={{ uri: tile.coverUrl }} style={styles.tileCover} />
                          ) : (
                            <View style={[styles.tileCover, styles.tileCoverPlaceholder]}>
                              <Lucide name="pricetag-outline" size={22} color="#00f5ff" />
                            </View>
                          )}
                          <Text style={styles.tileLabel} numberOfLines={1}>{tile.label}</Text>
                          {tile.subtitle ? (
                            <Text style={styles.tileSub} numberOfLines={1}>{tile.subtitle}</Text>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {showTrending && hashtags.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {hashtags.map((h) => (
                        <TouchableOpacity
                          key={h.tag}
                          style={styles.chip}
                          onPress={() => {
                            triggerHaptic("light");
                            setQuery(h.tag);
                          }}
                        >
                          <Text style={styles.chipText}>#{h.tag}</Text>
                          <Text style={styles.chipMeta}>{h.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {showTrending && creators.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rising creators</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.creatorRow}>
                      {creators.map((c) => (
                        <TouchableOpacity
                          key={c.profileId}
                          style={styles.creatorCell}
                          onPress={() => {
                            triggerHaptic("medium");
                            logExploreTap(userId, `creator_${c.profileId}`, c.profileId, { explore: "trending_creator" });
                            onCreatorPress(c.username);
                          }}
                        >
                          <Image source={{ uri: c.avatar }} style={styles.creatorAvatar} />
                          <Text style={styles.creatorName} numberOfLines={1}>{c.username}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {showPersonalized ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Picked for you</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tileRow}>
                      {personalized.map((tile) => (
                        <TouchableOpacity
                          key={tile.id}
                          style={[styles.tileCard, styles.tileCardPersonalized]}
                          onPress={() => {
                            triggerHaptic("light");
                            logExploreTap(userId, tile.id, tile.profileId, { tileType: tile.type, personalized: true });
                            if (tile.type === "creator") {
                              onCreatorPress(tile.query || tile.label);
                            } else if (tile.query) {
                              setQuery(tile.query);
                            }
                          }}
                        >
                          {tile.coverUrl ? (
                            <Image source={{ uri: tile.coverUrl }} style={styles.tileCover} />
                          ) : (
                            <View style={[styles.tileCover, styles.tileCoverPlaceholder]}>
                              <Lucide name="sparkles" size={20} color="#a855f7" />
                            </View>
                          )}
                          <Text style={styles.tileLabel} numberOfLines={1}>{tile.label}</Text>
                          {tile.subtitle ? (
                            <Text style={styles.tileSub} numberOfLines={2}>{tile.subtitle}</Text>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <Text style={[styles.sectionTitle, { marginHorizontal: 12, marginBottom: 8 }]}>
                  {query.trim().length >= 2 ? "Results" : "Explore"}
                </Text>
              </>
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim().length >= 2 ? "No results — try another search" : "Nothing to explore yet"}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic("light");
                  logExploreTap(userId, item.id, item.creator?.id, { isVideo: item.isVideo });
                  onGridItemPress(item);
                }}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.gridImg} contentFit="cover" />
                {item.isVideo ? (
                  <View style={styles.playBadge}>
                    <Lucide name="play" size={14} color="#fff" />
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#080415",
    zIndex: 200,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    padding: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 12,
    marginBottom: 10,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
  },
  chipText: {
    color: "#00f5ff",
    fontWeight: "700",
    fontSize: 13,
  },
  chipMeta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 2,
  },
  creatorRow: {
    paddingHorizontal: 12,
    gap: 14,
  },
  creatorCell: {
    alignItems: "center",
    width: 72,
  },
  creatorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#a855f7",
    backgroundColor: "#222",
  },
  creatorName: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    maxWidth: 72,
    textAlign: "center",
  },
  tileRow: {
    paddingHorizontal: 12,
    gap: 10,
  },
  tileCard: {
    width: 132,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 10,
  },
  tileCardPersonalized: {
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
  },
  tileCover: {
    width: "100%",
    height: 72,
    borderRadius: 8,
    backgroundColor: "#222",
    marginBottom: 8,
  },
  tileCoverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  tileSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 3,
  },
  gridContent: {
    paddingBottom: 24,
  },
  gridItem: {
    width: "33.33%",
    aspectRatio: 0.72,
    padding: 1,
  },
  gridImg: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  playBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    padding: 4,
  },
  empty: {
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    padding: 32,
  },
});
