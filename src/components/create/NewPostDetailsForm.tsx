import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { SearchPickerSheet, type SearchPickerItem } from "@/components/create/SearchPickerSheet";
import { TagPeopleSheet } from "@/components/create/TagPeopleSheet";
import { FaceTagEditor } from "@/components/create/FaceTagEditor";
import { CaptionComposerInput } from "@/components/create/CaptionComposerInput";
import { LocationPickerSheet } from "@/components/create/LocationPickerSheet";
import { MediaPeopleOverlay } from "@/components/post/MediaPeopleOverlay";
import { AddProductSheet, type BrandStoreOption } from "@/components/profile/AddProductSheet";
import { searchAudio } from "@/lib/postComposerSearch";
import {
  type PhotoTag,
  type CollabPartner,
  type VerifiedLocation,
} from "@/lib/postComposerTypes";
import type { PostEditState } from "@/lib/postEditState";
import { PostMediaPreview } from "@/components/create/PostMediaPreview";

export interface NewPostDetails {
  caption: string;
  audio: string;
  audioTrackId: string;
  photoTags: PhotoTag[];
  collabPartners: CollabPartner[];
  verifiedLocation: VerifiedLocation | null;
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
  photoTags: [],
  collabPartners: [],
  verifiedLocation: null,
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
  brandStores: BrandStoreOption[];
  defaultStoreId?: string | null;
  publishing?: boolean;
  editState?: PostEditState;
  initialAudio?: string;
  initialProductId?: string;
  initialProductTitle?: string;
  onBack: () => void;
  onShare: (details: NewPostDetails) => void;
}

export function NewPostDetailsForm({
  mediaUris,
  activeIndex,
  onActiveIndexChange,
  username,
  brandStores,
  defaultStoreId,
  publishing,
  editState,
  initialAudio = "",
  initialProductId = "",
  initialProductTitle = "",
  onBack,
  onShare,
}: NewPostDetailsFormProps) {
  const [details, setDetails] = useState<NewPostDetails>(() => ({
    ...defaultPostDetails(),
    audio: initialAudio,
    productId: initialProductId,
    productTitle: initialProductTitle,
  }));
  const [showAudience, setShowAudience] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showTagSheet, setShowTagSheet] = useState(false);
  const [showFaceTagEditor, setShowFaceTagEditor] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const previewUri = mediaUris[activeIndex] ?? mediaUris[0];
  const patch = (p: Partial<NewPostDetails>) => setDetails((d) => ({ ...d, ...p }));

  const audienceLabel =
    details.audience === "everyone"
      ? "Everyone"
      : details.audience === "followers"
        ? "Followers"
        : "Close Friends";

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

  const tagCollabLabel = (() => {
    const parts: string[] = [];
    if (details.photoTags.length) parts.push(`${details.photoTags.length} in photo`);
    if (details.collabPartners.length) {
      parts.push(
        details.collabPartners.length === 1
          ? `collab @${details.collabPartners[0].username}`
          : `${details.collabPartners.length} collabs`
      );
    }
    return parts.length ? parts.join(" · ") : "Tag people & collab";
  })();

  const tagCollabActive = details.photoTags.length > 0 || details.collabPartners.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Lucide name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New post</Text>
        <TouchableOpacity onPress={() => onShare(details)} disabled={publishing} hitSlop={12}>
          {publishing ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Text style={styles.shareHeaderBtn}>Share</Text>
          )}
        </TouchableOpacity>
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
            <View style={styles.thumbWrap}>
              {editState ? (
                <PostMediaPreview
                  uri={previewUri}
                  edit={editState}
                  photoTags={details.photoTags}
                  aspectRatio={1}
                />
              ) : (
                <TouchableOpacity activeOpacity={0.95} onPress={() => setShowFaceTagEditor(true)}>
                  <Image source={{ uri: previewUri }} style={styles.thumb} />
                  <MediaPeopleOverlay photoTags={details.photoTags} />
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <CaptionComposerInput
              value={details.caption}
              onChangeText={(caption) => patch({ caption })}
              placeholder="Write a caption…"
              minHeight={100}
            />
          </View>
        </View>

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

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowAudioPicker(true)}>
          <View style={styles.optionLeft}>
            <Lucide name="musical-notes-outline" size={23} color={details.audio ? "#00f5ff" : "#fff"} />
            <Text style={[styles.optionText, details.audio && styles.optionTextActive]}>
              {details.audio || "Add audio"}
            </Text>
          </View>
          {details.audio ? (
            <TouchableOpacity onPress={() => patch({ audio: "", audioTrackId: "" })} hitSlop={8}>
              <Lucide name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : (
            <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowFaceTagEditor(true)}>
          <View style={styles.optionLeft}>
            <Lucide
              name="people-outline"
              size={23}
              color={tagCollabActive ? "#00f5ff" : "#fff"}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionText, tagCollabActive && styles.optionTextActive]}>
                {tagCollabLabel}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  setShowTagSheet(true);
                }}
                hitSlop={8}
              >
                <Text style={styles.collabLink}>
                  {details.collabPartners.length ? "Edit collab partners" : "Invite collab partners"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowLocationSheet(true)}>
          <View style={styles.optionLeft}>
            <Lucide name="location-outline" size={23} color={details.verifiedLocation ? "#00f5ff" : "#fff"} />
            <Text style={[styles.optionText, details.verifiedLocation && styles.optionTextActive]}>
              {details.verifiedLocation?.label || "Add location"}
            </Text>
          </View>
          {details.verifiedLocation ? (
            <TouchableOpacity onPress={() => patch({ verifiedLocation: null })} hitSlop={8}>
              <Lucide name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : (
            <Lucide name="chevron-forward" size={21} color="rgba(255,255,255,0.3)" />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.optionRow}>
          <View style={[styles.optionLeft, { alignItems: "flex-start" }]}>
            <Lucide name="sparkles-outline" size={23} color={details.aiLabel ? "#4a90d9" : "#fff"} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionText}>Add AI label</Text>
              <Text style={styles.optionSub}>Shows viewers this post includes AI-generated content.</Text>
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
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => {
                if (!brandStores.length) {
                  Alert.alert("Create a brand store first", "Add products from a brand profile store.");
                  return;
                }
                setShowAddProduct(true);
              }}
            >
              <Lucide name="bag-handle-outline" size={20} color={details.productId ? "#00f5ff" : "#fff"} />
              <Text style={[styles.listTitle, { marginLeft: 10, flex: 1 }]} numberOfLines={1}>
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

      <SearchPickerSheet
        visible={showAudioPicker}
        title="Add audio"
        placeholder="Search songs and sounds…"
        minQueryLength={0}
        onClose={() => setShowAudioPicker(false)}
        onSelect={(item) => {
          patch({
            audio: item.subtitle ? `${item.title} · ${item.subtitle}` : item.title,
            audioTrackId: item.id,
          });
        }}
        search={searchAudioItems}
      />

      <FaceTagEditor
        visible={showFaceTagEditor}
        imageUri={previewUri || ""}
        photoTags={details.photoTags}
        onClose={() => setShowFaceTagEditor(false)}
        onPhotoTagsChange={(photoTags) => patch({ photoTags })}
      />

      <TagPeopleSheet
        visible={showTagSheet}
        photoTags={details.photoTags}
        collabPartners={details.collabPartners}
        onClose={() => setShowTagSheet(false)}
        onPhotoTagsChange={(photoTags) => patch({ photoTags })}
        onCollabChange={(collabPartners) => patch({ collabPartners })}
      />

      <LocationPickerSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onSelect={(verifiedLocation) => patch({ verifiedLocation })}
      />

      <AddProductSheet
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        brandStores={brandStores}
        defaultStoreId={defaultStoreId}
        showStorePicker={brandStores.length > 1}
        prefillImageUris={mediaUris.slice(0, 3)}
        onProductCreated={(artifactId, productTitle) => {
          patch({ productId: artifactId, productTitle });
          setShowAddProduct(false);
        }}
      />
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
  shareHeaderBtn: { color: "#0095f6", fontSize: 16, fontWeight: "700" },
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
  thumbWrap: { position: "relative", width: 64, height: 64, borderRadius: 4, overflow: "hidden" },
  thumb: { width: 64, height: 64, borderRadius: 4, backgroundColor: "#111" },
  captionInput: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    minHeight: 64,
    textAlignVertical: "top",
  },
  captionPreview: { paddingHorizontal: 16, paddingTop: 8 },
  captionPreviewText: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(74,144,217,0.15)",
  },
  aiBadgeText: { color: "#4a90d9", fontSize: 12, fontWeight: "700" },
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
  collabLink: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
  optionSub: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 3, lineHeight: 18 },
  optionValue: { color: "rgba(255,255,255,0.45)", fontSize: 15 },
  inlineChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  personChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,149,0,0.15)",
  },
  personChipCollab: { backgroundColor: "rgba(0,245,255,0.12)" },
  personChipText: { color: "#fff", fontSize: 12, fontWeight: "600", maxWidth: 140 },
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
