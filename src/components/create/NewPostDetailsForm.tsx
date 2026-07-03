import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { CaptionText } from "@/components/CaptionText";
import { SearchPickerSheet, type SearchPickerItem } from "@/components/create/SearchPickerSheet";
import {
  searchAudio,
  searchLocations,
  searchProducts,
  searchProfiles,
  type ProductSearchResult,
} from "@/lib/postComposerSearch";

export interface NewPostDetails {
  caption: string;
  audio: string;
  audioTrackId: string;
  taggedPeople: string;
  location: string;
  locationId: string;
  aiLabel: boolean;
  productId: string;
  productTitle: string;
  audience: "everyone" | "followers" | "close_friends";
  shareToFeed: boolean;
  allowComments: boolean;
}

export const defaultPostDetails = (): NewPostDetails => ({
  caption: "",
  audio: "",
  audioTrackId: "",
  taggedPeople: "",
  location: "",
  locationId: "",
  aiLabel: false,
  productId: "",
  productTitle: "",
  audience: "everyone",
  shareToFeed: true,
  allowComments: true,
});

interface NewPostDetailsFormProps {
  mediaUris: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  username: string;
  userId?: string | null;
  profileId?: string | null;
  catalogProducts?: ProductSearchResult[];
  publishing?: boolean;
  onBack: () => void;
  onShare: (details: NewPostDetails) => void;
  onEditPhoto?: () => void;
}

type PickerKind = "audio" | "tag" | "location" | "product" | null;

export function NewPostDetailsForm({
  mediaUris,
  activeIndex,
  onActiveIndexChange,
  username,
  userId,
  profileId,
  catalogProducts = [],
  publishing,
  onBack,
  onShare,
  onEditPhoto,
}: NewPostDetailsFormProps) {
  const [details, setDetails] = useState<NewPostDetails>(defaultPostDetails);
  const [showAudience, setShowAudience] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activePicker, setActivePicker] = useState<PickerKind>(null);

  const previewUri = mediaUris[activeIndex] ?? mediaUris[0];
  const patch = (p: Partial<NewPostDetails>) => setDetails((d) => ({ ...d, ...p }));

  const audienceLabel =
    details.audience === "everyone"
      ? "Everyone"
      : details.audience === "followers"
        ? "Followers"
        : "Close Friends";

  const catalogItems = catalogProducts;

  const searchAudioItems = useCallback(async (q: string): Promise<SearchPickerItem[]> => {
    const tracks = await searchAudio(q);
    return tracks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.artist,
      imageUri: t.cover,
      icon: "musical-notes-outline" as const,
    }));
  }, []);

  const searchTagItems = useCallback(async (q: string): Promise<SearchPickerItem[]> => {
    const profiles = await searchProfiles(q);
    return profiles.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `@${p.username}`,
      imageUri: p.logo,
      icon: "person-outline" as const,
    }));
  }, []);

  const searchLocationItems = useCallback(async (q: string): Promise<SearchPickerItem[]> => {
    const locations = await searchLocations(q);
    return locations.map((loc) => ({
      id: loc.id,
      title: loc.label,
      subtitle: loc.fullName,
      icon: "location-outline" as const,
    }));
  }, []);

  const searchProductItems = useCallback(
    async (q: string): Promise<SearchPickerItem[]> => {
      const fromCatalog = q.trim()
        ? catalogItems.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()))
        : catalogItems;
      const remote = await searchProducts(q, userId || undefined);
      const merged = new Map<string, ProductSearchResult>();
      for (const p of [...fromCatalog, ...remote]) merged.set(p.id, p);
      return Array.from(merged.values()).map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.price != null ? `₹${p.price.toLocaleString()}` : undefined,
        imageUri: p.images?.[0] || null,
        icon: "pricetag-outline" as const,
      }));
    },
    [catalogItems, userId]
  );

  const handlePickerSelect = (kind: PickerKind, item: SearchPickerItem) => {
    if (!kind) return;
    if (kind === "audio") {
      patch({ audio: item.subtitle ? `${item.title} · ${item.subtitle}` : item.title, audioTrackId: item.id });
    } else if (kind === "tag") {
      const usernameTag = item.subtitle?.replace(/^@/, "") || item.title;
      const existing = details.taggedPeople
        ? details.taggedPeople.split(",").map((s) => s.trim())
        : [];
      if (!existing.includes(usernameTag)) {
        existing.push(usernameTag);
      }
      const joined = existing.join(", ");
      patch({
        taggedPeople: joined,
        caption: details.caption.includes(`@${usernameTag}`)
          ? details.caption
          : `${details.caption} @${usernameTag}`.trim(),
      });
    } else if (kind === "location") {
      patch({ location: item.title, locationId: item.id });
    } else if (kind === "product") {
      patch({ productId: item.id, productTitle: item.title });
    }
  };

  const pickerConfig = {
    audio: {
      title: "Add audio",
      placeholder: "Search songs and sounds…",
      minQueryLength: 0,
      search: searchAudioItems,
    },
    tag: {
      title: "Tag people",
      placeholder: "Search by name or @username",
      minQueryLength: 1,
      search: searchTagItems,
    },
    location: {
      title: "Add location",
      placeholder: "Search places worldwide…",
      minQueryLength: 2,
      search: searchLocationItems,
    },
    product: {
      title: "Add product",
      placeholder: "Search your catalog or marketplace…",
      minQueryLength: 0,
      search: searchProductItems,
    },
  } as const;

  const activeConfig = activePicker ? pickerConfig[activePicker] : null;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Lucide name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {mediaUris.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselRow}>
            {mediaUris.map((uri, i) => (
              <TouchableOpacity key={uri + i} onPress={() => onActiveIndexChange(i)}>
                <Image source={{ uri }} style={[styles.carouselThumb, i === activeIndex && styles.carouselThumbActive]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.captionRow}>
          {previewUri ? (
            <TouchableOpacity onPress={onEditPhoto} disabled={!onEditPhoto}>
              <Image source={{ uri: previewUri }} style={styles.thumb} />
            </TouchableOpacity>
          ) : null}
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={details.caption}
            onChangeText={(caption) => patch({ caption })}
            multiline
            maxLength={2200}
          />
        </View>

        {details.caption ? (
          <View style={styles.captionPreview}>
            <CaptionText caption={details.caption} style={styles.captionPreviewText} />
          </View>
        ) : null}

        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() =>
              Alert.alert("Poll", "Add a poll to your caption?", [
                { text: "Cancel", style: "cancel" },
                { text: "Add", onPress: () => patch({ caption: `${details.caption}\n\n📊 Poll: `.trim() }) },
              ])
            }
          >
            <Lucide name="list-outline" size={17} color="#fff" />
            <Text style={styles.chipText}>Poll</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() =>
              Alert.alert("Prompt", "Add an engagement prompt?", [
                { text: "Cancel", style: "cancel" },
                { text: "Add", onPress: () => patch({ caption: `${details.caption}\n\n💬 `.trim() }) },
              ])
            }
          >
            <Lucide name="chatbubble-ellipses-outline" size={17} color="#fff" />
            <Text style={styles.chipText}>Prompt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setActivePicker("audio")}>
          <View style={styles.optionLeft}>
            <Lucide name="musical-notes-outline" size={23} color={details.audio ? "#00f5ff" : "#fff"} />
            <Text style={[styles.optionText, details.audio && styles.optionTextActive]}>
              {details.audio || "Add audio"}
            </Text>
          </View>
          <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        {details.audio ? (
          <View style={styles.selectionBar}>
            <Lucide name="musical-note" size={18} color="#00f5ff" />
            <Text style={styles.selectionText} numberOfLines={1}>
              {details.audio}
            </Text>
            <TouchableOpacity onPress={() => patch({ audio: "", audioTrackId: "" })}>
              <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setActivePicker("tag")}>
          <View style={styles.optionLeft}>
            <Lucide name="person-outline" size={23} color={details.taggedPeople ? "#ff9500" : "#fff"} />
            <Text style={[styles.optionText, details.taggedPeople && { color: "#ff9500" }]}>
              {details.taggedPeople
                ? `Tagged ${details.taggedPeople.split(",").map((u) => `@${u.trim()}`).join(", ")}`
                : "Tag people"}
            </Text>
          </View>
          <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setActivePicker("location")}>
          <View style={styles.optionLeft}>
            <Lucide name="location-outline" size={23} color={details.location ? "#00f5ff" : "#fff"} />
            <Text style={[styles.optionText, details.location && styles.optionTextActive]}>
              {details.location || "Add location"}
            </Text>
          </View>
          <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.optionRow}>
          <View style={[styles.optionLeft, { alignItems: "flex-start" }]}>
            <Lucide name="sparkles-outline" size={23} color="#fff" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionText}>Add AI Label</Text>
              <Text style={styles.optionSub}>
                Label realistic content made with AI.{" "}
                <Text style={styles.link}>Learn more</Text>
              </Text>
            </View>
          </View>
          <Switch
            value={details.aiLabel}
            onValueChange={(aiLabel) => patch({ aiLabel })}
            trackColor={{ false: "#333", true: "#4a90d9" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowAudience(!showAudience)}>
          <View style={styles.optionLeft}>
            <Lucide name="eye-outline" size={23} color="#fff" />
            <Text style={styles.optionText}>Audience</Text>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>{audienceLabel}</Text>
            <Lucide name={showAudience ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>

        {showAudience ? (
          <View style={styles.expandPanel}>
            {(
              [
                { key: "everyone" as const, label: "Everyone", icon: "globe-outline" },
                { key: "followers" as const, label: "Followers", icon: "people-outline" },
                { key: "close_friends" as const, label: "Close Friends", icon: "star-outline" },
              ] as const
            ).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.listItem, details.audience === opt.key && styles.listItemActive]}
                onPress={() => {
                  patch({ audience: opt.key });
                  setShowAudience(false);
                }}
              >
                <Lucide name={opt.icon} size={20} color={details.audience === opt.key ? "#00f5ff" : "#fff"} />
                <Text style={[styles.listTitle, { marginLeft: 10, flex: 1 }]}>{opt.label}</Text>
                {details.audience === opt.key ? (
                  <Lucide name="checkmark" size={18} color="#00f5ff" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Lucide name="at-outline" size={23} color="#fff" />
            <Text style={styles.optionText}>Also share on…</Text>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>@{username}</Text>
            <Switch
              value={details.shareToFeed}
              onValueChange={(shareToFeed) => patch({ shareToFeed })}
              trackColor={{ false: "#333", true: "#4a90d9" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowMore(!showMore)}>
          <View style={styles.optionLeft}>
            <Lucide name="ellipsis-horizontal" size={23} color={showMore ? "#00f5ff" : "#fff"} />
            <Text style={[styles.optionText, showMore && styles.optionTextActive]}>More options</Text>
          </View>
          <Lucide name={showMore ? "chevron-down" : "chevron-forward"} size={21} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        {showMore ? (
          <View style={styles.expandPanel}>
            {onEditPhoto ? (
              <TouchableOpacity style={styles.listItem} onPress={onEditPhoto}>
                <Lucide name="color-wand-outline" size={20} color="#00f5ff" />
                <Text style={[styles.listTitle, { marginLeft: 10, flex: 1 }]}>Edit photo & filters</Text>
                <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.listItem} onPress={() => setActivePicker("product")}>
              <Lucide name="bag-handle-outline" size={20} color={details.productId ? "#00f5ff" : "#fff"} />
              <Text style={[styles.listTitle, { marginLeft: 10, flex: 1 }]}>
                {details.productTitle || "Add product"}
              </Text>
              {details.productId ? (
                <TouchableOpacity
                  onPress={() => patch({ productId: "", productTitle: "" })}
                  hitSlop={8}
                >
                  <Lucide name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ) : (
                <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              )}
            </TouchableOpacity>

            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Lucide name="chatbox-outline" size={23} color="#fff" />
                <Text style={styles.optionText}>Allow comments</Text>
              </View>
              <Switch
                value={details.allowComments}
                onValueChange={(allowComments) => patch({ allowComments })}
                trackColor={{ false: "#333", true: "#4a90d9" }}
                thumbColor="#fff"
              />
            </View>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.shareWrap}>
        <TouchableOpacity
          style={[styles.shareBtn, publishing && { opacity: 0.6 }]}
          onPress={() => onShare(details)}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {activeConfig && activePicker ? (
        <SearchPickerSheet
          visible
          title={activeConfig.title}
          placeholder={activeConfig.placeholder}
          minQueryLength={activeConfig.minQueryLength}
          onClose={() => setActivePicker(null)}
          onSelect={(item) => handlePickerSelect(activePicker, item)}
          search={activeConfig.search}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1 },
  carouselRow: { paddingHorizontal: 16, paddingTop: 12, maxHeight: 72 },
  carouselThumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#111",
  },
  carouselThumbActive: { borderWidth: 2, borderColor: "#00f5ff" },
  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  thumb: { width: 64, height: 64, borderRadius: 4, backgroundColor: "#111" },
  captionInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    minHeight: 64,
    textAlignVertical: "top",
  },
  captionPreview: { paddingHorizontal: 16, paddingTop: 8 },
  captionPreviewText: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  chipsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginTop: 12, marginBottom: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  chipText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  optionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionText: { color: "#fff", fontSize: 16, flexShrink: 1 },
  optionTextActive: { color: "#00f5ff" },
  optionSub: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 3, lineHeight: 18 },
  optionValue: { color: "rgba(255,255,255,0.45)", fontSize: 15 },
  link: { color: "#4a90d9" },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 10,
  },
  selectionText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  expandPanel: { marginHorizontal: 16, marginBottom: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  listItemActive: { backgroundColor: "rgba(0,245,255,0.08)" },
  listTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  shareWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  shareBtn: {
    backgroundColor: "#4a90d9",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
