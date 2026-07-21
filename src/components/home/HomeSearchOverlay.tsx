import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";

type HomeSearchOverlayProps = {
  visible: boolean;
  onClose: () => void;
  searchTiles: any[];
  activeSearchQuery: string;
  onSearchQuery: (query: string) => void;
  onSearchClear: () => void;
  listData: any[];
  loadingFeedItems: boolean;
  handleOpenFeedReel?: (item: any) => void;
  bottomBarHeight: number;
};

type SearchTab = "Top" | "Accounts" | "Products" | "Tags";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - 16) / 3;

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes(".mp4") || u.includes(".mov") || u.includes(".webm") || u.includes(".m4v");
}

export function HomeSearchOverlay({
  visible,
  onClose,
  searchTiles = [],
  activeSearchQuery = "",
  onSearchQuery,
  onSearchClear,
  listData = [],
  loadingFeedItems = false,
  handleOpenFeedReel,
  bottomBarHeight,
}: HomeSearchOverlayProps) {
  const [query, setQuery] = useState(activeSearchQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>("Top");
  const inputRef = useRef<TextInput>(null);

  // Focus and initialize query ONLY when modal is opened
  useEffect(() => {
    if (visible) {
      setQuery(activeSearchQuery);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (text.trim() === "") {
      onSearchClear();
    } else {
      onSearchQuery(text);
    }
  };

  const handleClear = () => {
    setQuery("");
    onSearchClear();
    inputRef.current?.focus();
  };

  const handleMediaPress = (item: any) => {
    const isVideo = isVideoUrl(item.content?.videoUrl || item.content?.mediaUrl);
    if (isVideo && handleOpenFeedReel) {
      onClose();
      handleOpenFeedReel(item);
    } else {
      onClose();
      router.push(`/post/${item.id}`);
    }
  };

  const handleTagPress = (tag: string) => {
    setQuery(`#${tag}`);
    onSearchQuery(`#${tag}`);
  };

  // Group search tiles by type
  const creators = useMemo(
    () => searchTiles.filter((t) => t.type === "creator"),
    [searchTiles]
  );
  const products = useMemo(
    () => searchTiles.filter((t) => t.type === "product"),
    [searchTiles]
  );
  const hashtags = useMemo(
    () => searchTiles.filter((t) => t.type === "hashtag"),
    [searchTiles]
  );

  // Grid/Feed items
  const mediaGridItems = useMemo(() => {
    return listData.filter(
      (item) => item.type === "CREATOR_POST" || item.type === "CREATOR_COMMERCE"
    );
  }, [listData]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          {/* Top Search Bar Row */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Lucide name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Lucide name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search creators, tags, products..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={query}
                onChangeText={handleTextChange}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear}>
                  <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Tabs Selector */}
          <View style={styles.tabsRow}>
            {(["Top", "Accounts", "Products", "Tags"] as SearchTab[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingFeedItems && query.length >= 2 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#00f5ff" size="large" />
            </View>
          ) : query.trim().length < 2 ? (
            <View style={styles.emptyWrap}>
              <Lucide name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>Type at least 2 characters to search AURA</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomBarHeight + 60 }]}
            >
              {activeTab === "Top" && (
                <>
                  {/* Creators Scroll */}
                  {creators.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Lucide name="people" size={18} color="#00f5ff" />
                        <Text style={styles.sectionTitle}>Profiles</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {creators.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.creatorCard}
                            onPress={() => {
                              onClose();
                              router.push(`/profile/${c.label}`);
                            }}
                          >
                            <Image source={{ uri: c.coverUrl }} style={styles.creatorAvatar} />
                            <Text style={styles.creatorName} numberOfLines={1}>
                              {c.label}
                            </Text>
                            <Text style={styles.creatorSub} numberOfLines={1}>
                              {c.subtitle}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Products Scroll */}
                  {products.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Lucide name="bag-handle" size={18} color="#a855f7" />
                        <Text style={styles.sectionTitle}>Products</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {products.map((p) => {
                          const productId = p.id.replace("search_product_", "");
                          return (
                            <TouchableOpacity
                              key={p.id}
                              style={styles.productCard}
                              onPress={() => {
                                onClose();
                                router.push(`/product/${productId}`);
                              }}
                            >
                              <Image source={{ uri: p.coverUrl }} style={styles.productImage} />
                              <View style={styles.productMeta}>
                                <Text style={styles.productTitle} numberOfLines={1}>
                                  {p.label}
                                </Text>
                                <Text style={styles.productMaison} numberOfLines={1}>
                                  {p.subtitle}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Hashtags Wrap */}
                  {hashtags.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Lucide name="pricetag" size={18} color="#3b82f6" />
                        <Text style={styles.sectionTitle}>Tags</Text>
                      </View>
                      <View style={styles.tagsContainer}>
                        {hashtags.map((h) => (
                          <TouchableOpacity
                            key={h.id}
                            style={styles.tagChip}
                            onPress={() => handleTagPress(h.query || h.label)}
                          >
                            <Text style={styles.tagTextLabel}>{h.label}</Text>
                            <Text style={styles.tagTextSubtitle}>{h.subtitle}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Grid media posts */}
                  {mediaGridItems.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Lucide name="grid" size={18} color="#00f5ff" />
                        <Text style={styles.sectionTitle}>Matching Reels & Posts</Text>
                      </View>
                      <View style={styles.gridContainer}>
                        {mediaGridItems.map((item) => {
                          const mediaUrl = item.content?.mediaUrl || item.content?.videoUrl || "";
                          const isVideo = isVideoUrl(item.content?.videoUrl || item.content?.mediaUrl);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.gridTile}
                              onPress={() => handleMediaPress(item)}
                            >
                              <Image source={{ uri: mediaUrl }} style={styles.gridTileImage} />
                              {isVideo && (
                                <View style={styles.videoBadge}>
                                  <Lucide name="play" size={14} color="#FFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </>
              )}

              {activeTab === "Accounts" && (
                <View style={styles.tabContentList}>
                  {creators.length === 0 ? (
                    <Text style={styles.emptyText}>No accounts found.</Text>
                  ) : (
                    creators.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.listUserRow}
                        onPress={() => {
                          onClose();
                          router.push(`/profile/${c.label}`);
                        }}
                      >
                        <Image source={{ uri: c.coverUrl }} style={styles.listAvatar} />
                        <View style={styles.listTextContainer}>
                          <Text style={styles.listUsername}>@{c.label}</Text>
                          <Text style={styles.listSubText}>{c.subtitle}</Text>
                        </View>
                        <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {activeTab === "Products" && (
                <View style={styles.tabContentList}>
                  {products.length === 0 ? (
                    <Text style={styles.emptyText}>No products found.</Text>
                  ) : (
                    <View style={styles.verticalProductGrid}>
                      {products.map((p) => {
                        const productId = p.id.replace("search_product_", "");
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={styles.verticalProductCard}
                            onPress={() => {
                              onClose();
                              router.push(`/product/${productId}`);
                            }}
                          >
                            <Image source={{ uri: p.coverUrl }} style={styles.verticalProductImage} />
                            <Text style={styles.verticalProductTitle} numberOfLines={1}>
                              {p.label}
                            </Text>
                            <Text style={styles.verticalProductMaison} numberOfLines={1}>
                              {p.subtitle}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {activeTab === "Tags" && (
                <View style={styles.tabContentList}>
                  {hashtags.length === 0 ? (
                    <Text style={styles.emptyText}>No hashtags found.</Text>
                  ) : (
                    hashtags.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={styles.listHashtagRow}
                        onPress={() => handleTagPress(h.query || h.label)}
                      >
                        <View style={styles.hashtagIconBox}>
                          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>#</Text>
                        </View>
                        <View style={styles.listTextContainer}>
                          <Text style={styles.hashtagTitle}>{h.label}</Text>
                          <Text style={styles.hashtagSubText}>{h.subtitle}</Text>
                        </View>
                        <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#05030f",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    padding: 2,
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
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#05030f",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#00f5ff",
  },
  tabText: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#00f5ff",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    opacity: 0.8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12,
  },
  creatorCard: {
    width: 90,
    alignItems: "center",
  },
  creatorAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#222",
    marginBottom: 6,
  },
  creatorName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  creatorSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textAlign: "center",
    width: "100%",
  },
  productCard: {
    width: 120,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  productImage: {
    width: 120,
    height: 120,
    backgroundColor: "#222",
  },
  productMeta: {
    padding: 8,
  },
  productTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  productMaison: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  tagTextLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  tagTextSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    marginTop: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    padding: 4,
  },
  gridTileImage: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#222",
  },
  videoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 12,
  },
  tabContentList: {
    paddingTop: 8,
  },
  listUserRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#222",
  },
  listTextContainer: {
    flex: 1,
  },
  listUsername: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listSubText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  verticalProductGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  verticalProductCard: {
    width: (width - 36) / 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  verticalProductImage: {
    width: "100%",
    height: (width - 36) / 2,
    backgroundColor: "#222",
  },
  verticalProductTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  verticalProductMaison: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 2,
  },
  listHashtagRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  hashtagIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  hashtagTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  hashtagSubText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
});