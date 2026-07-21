import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SafeVideoPlayer } from "@/components/SafeVideoPlayer";
import Lucide from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { PollComposerSheet, formatPollForCaption, type ReelPoll } from "@/components/create/PollComposerSheet";
import { ReelRemixPickerSheet } from "@/components/create/ReelRemixPickerSheet";
import { CaptionComposerInput } from "@/components/create/CaptionComposerInput";
import { TagPeopleSheet } from "@/components/create/TagPeopleSheet";
import { LocationPickerSheet } from "@/components/create/LocationPickerSheet";
import { AddProductSheet, type BrandStoreOption } from "@/components/profile/AddProductSheet";
import { PostProductSheet } from "@/components/create/PostProductSheet";
import { DraggableProductTagEditor } from "@/components/commerce/DraggableProductTagEditor";
import type { ProductSticker } from "@/lib/postEditState";
import { createProductTagSticker } from "@/lib/productTagUtils";
import { STORY_CANVAS_W, STORY_CANVAS_H } from "@/lib/storyLayers";
import type { StickerLayer } from "@/lib/createDraft";
import type { PhotoTag, CollabPartner, VerifiedLocation } from "@/lib/postComposerTypes";

export interface ReelShareDetails {
  caption: string;
  poll: ReelPoll | null;
  prompt: string;
  hashtags: string[];
  photoTags: PhotoTag[];
  collabPartners: CollabPartner[];
  verifiedLocation: VerifiedLocation | null;
  productId: string;
  productTitle: string;
  productStickers: ProductSticker[];
  productTagPos: { x: number; y: number; scale: number };
  customCoverUri?: string;
  remixSourceId?: string | null;
  /** ISO timestamp — omit for immediate publish */
  scheduledPublishAt?: string | null;
}

export const defaultReelShareDetails = (): ReelShareDetails => ({
  caption: "",
  poll: null,
  prompt: "",
  hashtags: [],
  photoTags: [],
  collabPartners: [],
  verifiedLocation: null,
  productId: "",
  productTitle: "",
  productStickers: [],
  productTagPos: { x: STORY_CANVAS_W * 0.08, y: STORY_CANVAS_H * 0.62, scale: 1 },
  customCoverUri: undefined,
  remixSourceId: null,
  scheduledPublishAt: null,
});

export function buildReelPublishExtras(details: ReelShareDetails): {
  productStickers: ProductSticker[];
  storyLayers: StickerLayer[];
  remixSourceId?: string;
} {
  const storyLayers = details.productStickers.length
    ? [createProductTagSticker(details.productStickers, STORY_CANVAS_W, STORY_CANVAS_H, details.productTagPos)]
    : [];
  return {
    productStickers: details.productStickers,
    storyLayers,
    remixSourceId: details.remixSourceId || undefined,
  };
}

interface ReelShareStepProps {
  previewUri: string;
  userId: string;
  brandStores: BrandStoreOption[];
  defaultStoreId?: string | null;
  publishing?: boolean;
  onBack: () => void;
  onSaveDraft: (details: ReelShareDetails) => void;
  onShare: (details: ReelShareDetails) => void;
}

function SharePreview({ uri }: { uri: string }) {
  return <SafeVideoPlayer source={uri} playing style={styles.previewVideo} contentFit="cover" />;
}

export function buildReelCaption(details: ReelShareDetails): string {
  const parts: string[] = [];
  if (details.caption.trim()) parts.push(details.caption.trim());
  if (details.hashtags.length) parts.push(details.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  if (details.prompt.trim()) parts.push(`💬 ${details.prompt.trim()}`);
  if (details.poll) parts.push(formatPollForCaption(details.poll));
  return parts.join("\n\n").trim();
}

function scheduleInHours(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

function scheduleTomorrowMorning(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function formatScheduleLabel(iso: string | null | undefined): string {
  if (!iso) return "Post now";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "Post now";
  return at.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReelShareStep({
  previewUri,
  userId,
  brandStores,
  defaultStoreId,
  publishing,
  onBack,
  onSaveDraft,
  onShare,
}: ReelShareStepProps) {
  const [details, setDetails] = useState<ReelShareDetails>(defaultReelShareDetails());
  const [showPoll, setShowPoll] = useState(false);
  const [showTagSheet, setShowTagSheet] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showTagProducts, setShowTagProducts] = useState(false);
  const [hashtagDraft, setHashtagDraft] = useState("");
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [showRemixPicker, setShowRemixPicker] = useState(false);

  const patch = (p: Partial<ReelShareDetails>) => setDetails((d) => ({ ...d, ...p }));

  const handleEditCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        patch({ customCoverUri: result.assets[0].uri });
      }
    } catch (err) {
      console.warn("Cover picking failed:", err);
    }
  };

  const tagLabel =
    details.photoTags.length || details.collabPartners.length
      ? `${details.photoTags.length ? `${details.photoTags.length} tagged` : ""}${
          details.collabPartners.length
            ? `${details.photoTags.length ? " · " : ""}${details.collabPartners.length} collab${details.collabPartners.length > 1 ? "s" : ""}`
            : ""
        }`
      : "Tag people";

  const addHashtag = () => {
    setShowHashtagInput(!showHashtagInput);
  };

  const handleAddHashtag = () => {
    const tag = hashtagDraft.trim().replace(/^#/, "");
    if (!tag) return;
    if (!details.hashtags.includes(tag)) {
      patch({ hashtags: [...details.hashtags, tag] });
    }
    setHashtagDraft("");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12}>
          <Lucide name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New reel</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          {details.customCoverUri ? (
            <Image source={{ uri: details.customCoverUri }} style={styles.previewVideo} />
          ) : (
            <SharePreview uri={previewUri} />
          )}
          <TouchableOpacity style={styles.previewOverlayTop} onPress={() => patch({ customCoverUri: undefined })}>
            <Text style={styles.previewOverlayText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewOverlayBottom} onPress={handleEditCover}>
            <Text style={styles.previewOverlayText}>Edit cover</Text>
          </TouchableOpacity>
          {details.productStickers.length > 0 ? (
            <DraggableProductTagEditor
              products={details.productStickers}
              canvasW={STORY_CANVAS_W}
              canvasH={STORY_CANVAS_H}
              x={details.productTagPos.x}
              y={details.productTagPos.y}
              scale={details.productTagPos.scale}
              onMove={(x, y) =>
                patch({ productTagPos: { ...details.productTagPos, x, y } })
              }
            />
          ) : null}
        </View>

        <View style={styles.captionContainer}>
          <CaptionComposerInput
            value={details.caption}
            onChangeText={(caption) => patch({ caption })}
            placeholder="Add a caption…"
            minHeight={80}
          />
        </View>

        <View style={styles.chipsRow}>
          <TouchableOpacity style={styles.chip} onPress={addHashtag}>
            <Text style={styles.hashIcon}>#</Text>
            <Text style={styles.chipText}>Hashtags</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, details.poll && styles.chipActive]} onPress={() => setShowPoll(true)}>
            <Lucide name="list-outline" size={17} color="#fff" />
            <Text style={styles.chipText}>{details.poll ? "Edit poll" : "Poll"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() =>
              Alert.alert("Prompt", "Add an engagement prompt to your reel.", [
                { text: "Cancel", style: "cancel" },
                { text: "What do you think?", onPress: () => patch({ prompt: "What do you think?" }) },
                { text: "Rate 1–10", onPress: () => patch({ prompt: "Rate this 1–10" }) },
              ])
            }
          >
            <Lucide name="chatbubble-ellipses-outline" size={17} color="#fff" />
            <Text style={styles.chipText}>Prompt</Text>
          </TouchableOpacity>
        </View>

        {showHashtagInput && (
          <View style={styles.hashtagInputContainer}>
            <TextInput
              style={styles.hashtagTextInput}
              placeholder="Enter custom hashtag..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={hashtagDraft}
              onChangeText={setHashtagDraft}
              onSubmitEditing={handleAddHashtag}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addHashtagBtn} onPress={handleAddHashtag}>
              <Lucide name="add-circle" size={24} color="#00f5ff" />
            </TouchableOpacity>
          </View>
        )}

        {details.hashtags.length ? (
          <View style={styles.hashtagRow}>
            {details.hashtags.map((h) => (
              <TouchableOpacity
                key={h}
                style={styles.hashtagChip}
                onPress={() => patch({ hashtags: details.hashtags.filter((x) => x !== h) })}
              >
                <Text style={styles.hashtagText}>#{h}</Text>
                <Lucide name="close" size={12} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {details.poll ? (
          <View style={styles.pollPreview}>
            <Text style={styles.pollQuestion}>{details.poll.question}</Text>
            {details.poll.options.map((opt) => (
              <View key={opt} style={styles.pollOption}>
                <Text style={styles.pollOptionText}>{opt}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => patch({ poll: null })}>
              <Text style={styles.removePoll}>Remove poll</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowTagSheet(true)}>
          <Lucide name="person-outline" size={22} color="#fff" />
          <Text style={styles.optionText}>{tagLabel}</Text>
          <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowLocation(true)}>
          <Lucide name="location-outline" size={22} color="#fff" />
          <Text style={styles.optionText}>{details.verifiedLocation?.label || "Add location"}</Text>
          <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => setShowMore(!showMore)}>
          <Lucide name="ellipsis-horizontal" size={22} color="#fff" />
          <Text style={styles.optionText}>More options</Text>
          <Lucide name={showMore ? "chevron-down" : "chevron-forward"} size={20} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>

        {showMore ? (
          <>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                Alert.alert("Schedule post", "Choose when this reel goes live.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Post now", onPress: () => patch({ scheduledPublishAt: null }) },
                  { text: "In 1 hour", onPress: () => patch({ scheduledPublishAt: scheduleInHours(1) }) },
                  {
                    text: "Tomorrow 9 AM",
                    onPress: () => patch({ scheduledPublishAt: scheduleTomorrowMorning() }),
                  },
                ]);
              }}
            >
              <Lucide name="time-outline" size={22} color="#fff" />
              <Text style={styles.optionText}>Schedule · {formatScheduleLabel(details.scheduledPublishAt)}</Text>
              <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowRemixPicker(true)}
            >
              <Lucide name="git-branch-outline" size={22} color="#fff" />
              <Text style={styles.optionText}>
                {details.remixSourceId ? "Remix linked" : "Remix"}
              </Text>
              <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (!brandStores.length) {
                  Alert.alert("Create a brand store first");
                  return;
                }
                setShowTagProducts(true);
              }}
            >
              <Lucide name="pricetag-outline" size={22} color="#fff" />
              <Text style={styles.optionText}>
                {details.productStickers.length
                  ? `${details.productStickers.length} product${details.productStickers.length === 1 ? "" : "s"} tagged`
                  : "Tag products"}
              </Text>
              <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                if (!brandStores.length) {
                  Alert.alert("Create a brand store first");
                  return;
                }
                setShowAddProduct(true);
              }}
            >
              <Lucide name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.optionText}>Create new product</Text>
              <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn} onPress={() => onSaveDraft(details)} disabled={publishing}>
          <Text style={styles.draftBtnText}>Save draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={() => onShare(details)} disabled={publishing}>
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.shareBtnText}>{details.scheduledPublishAt ? "Schedule" : "Share"}</Text>
          )}
        </TouchableOpacity>
      </View>

      <PollComposerSheet
        visible={showPoll}
        initial={details.poll}
        onClose={() => setShowPoll(false)}
        onSave={(poll) => patch({ poll })}
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
        visible={showLocation}
        onClose={() => setShowLocation(false)}
        onSelect={(verifiedLocation) => patch({ verifiedLocation })}
      />

      <PostProductSheet
        visible={showTagProducts}
        brandStores={brandStores}
        userId={userId}
        selected={details.productStickers}
        onClose={() => setShowTagProducts(false)}
        onChange={(productStickers) =>
          patch({
            productStickers,
            productId: productStickers[0]?.productId || "",
            productTitle: productStickers[0]?.title || "",
          })
        }
        onDone={() => setShowTagProducts(false)}
      />

      <AddProductSheet
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        brandStores={brandStores}
        defaultStoreId={defaultStoreId}
        showStorePicker={brandStores.length > 1}
        prefillVideoUri={previewUri}
        onProductCreated={(artifactId, productTitle) => {
          patch({ productId: artifactId, productTitle });
          setShowAddProduct(false);
        }}
      />

      <ReelRemixPickerSheet
        visible={showRemixPicker}
        userId={userId}
        onClose={() => setShowRemixPicker(false)}
        onSelect={(reelId) => patch({ remixSourceId: reelId })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  scroll: { flex: 1 },
  previewCard: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 280,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  previewVideo: { width: "100%", height: "100%" },
  previewOverlayTop: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewOverlayBottom: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewOverlayText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  captionInput: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chipsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginTop: 8 },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  hashtagTextInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  addHashtagBtn: {
    paddingLeft: 8,
  },
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
  chipActive: { borderColor: "#0095f6", backgroundColor: "rgba(0,149,246,0.12)" },
  chipText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hashIcon: { color: "#fff", fontSize: 16, fontWeight: "800" },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginTop: 10 },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,149,246,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hashtagText: { color: "#0095f6", fontSize: 13, fontWeight: "600" },
  pollPreview: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pollQuestion: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 10 },
  pollOption: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  pollOptionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  removePoll: { color: "#ff6b6b", fontSize: 13, marginTop: 6, textAlign: "center" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  optionText: { color: "#fff", fontSize: 16, flex: 1 },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  draftBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  draftBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  shareBtn: {
    flex: 1,
    backgroundColor: "#0095f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
