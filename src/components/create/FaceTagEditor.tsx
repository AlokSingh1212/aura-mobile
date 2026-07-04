import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Switch,
  LayoutChangeEvent,
  GestureResponderEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store/useStore";
import { MAX_PHOTO_TAGS, type PhotoTag } from "@/lib/postComposerTypes";
import { searchProfiles } from "@/lib/postComposerSearch";
import {
  detectFacesInPhoto,
  enrollFaceTagRecognition,
  fetchFaceTagSettings,
  type DetectedFace,
  type FaceMatchSuggestion,
} from "@/lib/faceTagApi";

interface FaceTagEditorProps {
  visible: boolean;
  imageUri: string;
  photoTags: PhotoTag[];
  onClose: () => void;
  onPhotoTagsChange: (tags: PhotoTag[]) => void;
}

export function FaceTagEditor({
  visible,
  imageUri,
  photoTags,
  onClose,
  onPhotoTagsChange,
}: FaceTagEditorProps) {
  const insets = useSafeAreaInsets();
  const { currentUser, activeProfile, triggerHaptic } = useStore();

  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [matches, setMatches] = useState<Record<string, FaceMatchSuggestion[]>>({});
  const [scanning, setScanning] = useState(false);
  const [activeFaceId, setActiveFaceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; title: string; subtitle: string; imageUri: string | null }[]
  >([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [faceOptIn, setFaceOptIn] = useState(false);
  const [loadingOptIn, setLoadingOptIn] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);

  const runScan = useCallback(async () => {
    if (!imageUri) return;
    setScanning(true);
    try {
      let scanUrl = imageUri;
      if (scanUrl.startsWith("file://") || scanUrl.startsWith("content://")) {
        Alert.alert(
          "Upload first",
          "Face scan works after your photo is uploaded. Tap faces on the image to tag manually, or share the post once media is on the server."
        );
        return;
      }
      const result = await detectFacesInPhoto({
        imageUrl: scanUrl,
        userId: currentUser?.id,
        profileId: activeProfile?.id,
      });
      if (result.success && result.faces?.length) {
        setFaces(result.faces);
        setMatches(result.matches || {});
        triggerHaptic("success");
      } else {
        Alert.alert(
          "No faces found",
          "Try better lighting, or tap directly on a face to tag someone."
        );
      }
    } catch {
      Alert.alert("Scan failed", "Could not analyze this photo. Tap a face to tag manually.");
    } finally {
      setScanning(false);
    }
  }, [activeProfile?.id, currentUser?.id, imageUri, triggerHaptic]);

  useEffect(() => {
    if (!visible) {
      setActiveFaceId(null);
      setQuery("");
      setResults([]);
      setFaces([]);
      setMatches({});
      setPendingPoint(null);
      return;
    }
    if (activeProfile?.id) {
      fetchFaceTagSettings(activeProfile.id).then((s) => setFaceOptIn(s.optIn));
    }
  }, [visible, activeProfile?.id]);

  useEffect(() => {
    if (visible && imageUri) {
      runScan();
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const profiles = await searchProfiles(query);
        setResults(
          profiles.map((p) => ({
            id: p.id,
            title: p.name,
            subtitle: `@${p.username}`,
            imageUri: p.logo,
          }))
        );
      } finally {
        setLoadingSearch(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  const tagAtPoint = (xPct: number, yPct: number, faceId?: string) => {
    setPendingPoint({ x: xPct, y: yPct });
    setActiveFaceId(faceId || `manual_${Date.now()}`);
    setQuery("");
  };

  const onImagePress = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const xPct = (locationX / layout.width) * 100;
    const yPct = (locationY / layout.height) * 100;

    const hitFace = faces.find((f) => {
      const dx = Math.abs(f.x - xPct);
      const dy = Math.abs(f.y - yPct);
      return dx < f.w * 0.55 && dy < f.h * 0.55;
    });

    tagAtPoint(xPct, yPct, hitFace?.id);
    triggerHaptic("light");
  };

  const applyTag = (item: { id: string; title: string; subtitle: string; imageUri: string | null }) => {
    if (photoTags.length >= MAX_PHOTO_TAGS) {
      Alert.alert("Limit reached", `Up to ${MAX_PHOTO_TAGS} people in one photo.`);
      return;
    }
    const username = item.subtitle.replace(/^@/, "");
    if (photoTags.some((p) => p.profileId === item.id)) {
      Alert.alert("Already tagged", `${item.title} is already in this photo.`);
      return;
    }

    const face = faces.find((f) => f.id === activeFaceId);
    const x = face?.x ?? pendingPoint?.x ?? 50;
    const y = face?.y ?? pendingPoint?.y ?? 50;

    const next: PhotoTag = {
      profileId: item.id,
      username,
      name: item.title,
      logo: item.imageUri,
      x: x ?? 50,
      y: y ?? 50,
      faceId: activeFaceId || undefined,
    };

    onPhotoTagsChange([...photoTags.filter((t) => t.faceId !== activeFaceId), next]);
    setActiveFaceId(null);
    setPendingPoint(null);
    setQuery("");
    triggerHaptic("success");
  };

  const applySuggestion = (faceId: string, suggestion: FaceMatchSuggestion) => {
    setActiveFaceId(faceId);
    applyTag({
      id: suggestion.profileId,
      title: suggestion.name,
      subtitle: `@${suggestion.username}`,
      imageUri: suggestion.logo,
    });
  };

  const removeTag = (profileId: string) => {
    onPhotoTagsChange(photoTags.filter((t) => t.profileId !== profileId));
  };

  const toggleOptIn = async (value: boolean) => {
    if (!currentUser?.id || !activeProfile?.id) {
      Alert.alert("Sign in required", "Sign in to manage face recognition settings.");
      return;
    }
    setLoadingOptIn(true);
    try {
      const result = await enrollFaceTagRecognition({
        userId: currentUser.id,
        profileId: activeProfile.id,
        avatarUrl: activeProfile.logo,
        optIn: value,
      });
      if (result.success) {
        setFaceOptIn(value);
        if (value) runScan();
      } else {
        Alert.alert("Could not update", result.error || "Try again.");
      }
    } finally {
      setLoadingOptIn(false);
    }
  };

  const activeSuggestions = activeFaceId ? matches[activeFaceId] || [] : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tag people</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Tap a face or anywhere on the photo. Names appear on the image like Instagram.
        </Text>

        <View style={styles.optInRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optInTitle}>Smart face matching</Text>
            <Text style={styles.optInSub}>
              Opt in so friends can get suggestions when you appear in their photos.
            </Text>
          </View>
          <Switch
            value={faceOptIn}
            onValueChange={toggleOptIn}
            disabled={loadingOptIn}
            trackColor={{ false: "#333", true: "#00f5ff" }}
          />
        </View>

        <View style={styles.mediaWrap} onLayout={onLayout}>
          <TouchableOpacity activeOpacity={1} onPress={onImagePress} style={styles.mediaTouch}>
            <Image source={{ uri: imageUri }} style={styles.media} contentFit="contain" />

            {faces.map((face) => {
              const tagged = photoTags.find((t) => t.faceId === face.id);
              if (tagged) return null;
              return (
                <TouchableOpacity
                  key={face.id}
                  style={[
                    styles.faceDot,
                    {
                      left: `${face.x}%`,
                      top: `${face.y}%`,
                      marginLeft: -14,
                      marginTop: -14,
                      borderColor: activeFaceId === face.id ? "#00f5ff" : "#fff",
                    },
                  ]}
                  onPress={() => tagAtPoint(face.x, face.y, face.id)}
                >
                  <View style={styles.faceDotInner} />
                </TouchableOpacity>
              );
            })}

            {photoTags.map((tag) =>
              typeof tag.x === "number" && typeof tag.y === "number" ? (
                <View
                  key={tag.profileId}
                  style={[
                    styles.tagAnchor,
                    {
                      left: `${tag.x}%`,
                      top: `${tag.y}%`,
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>{tag.username}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag.profileId)} hitSlop={8}>
                      <Lucide name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            )}
          </TouchableOpacity>

          {scanning ? (
            <View style={styles.scanOverlay}>
              <ActivityIndicator color="#00f5ff" />
              <Text style={styles.scanText}>Scanning faces…</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.rescanBtn} onPress={runScan} disabled={scanning}>
          <Lucide name="scan-outline" size={18} color="#00f5ff" />
          <Text style={styles.rescanText}>Scan again</Text>
        </TouchableOpacity>

        {activeFaceId ? (
          <View style={styles.picker}>
            {activeSuggestions.length > 0 ? (
              <View style={styles.suggestBlock}>
                <Text style={styles.suggestTitle}>Suggested</Text>
                {activeSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s.profileId}
                    style={styles.suggestRow}
                    onPress={() => applySuggestion(activeFaceId, s)}
                  >
                    {s.logo ? (
                      <Image source={{ uri: s.logo }} style={styles.suggestAvatar} />
                    ) : (
                      <View style={styles.suggestAvatarFallback}>
                        <Text style={styles.suggestInitial}>{s.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestName}>{s.name}</Text>
                      <Text style={styles.suggestUser}>@{s.username}</Text>
                    </View>
                    <Text style={styles.confidence}>{Math.round(s.confidence * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.searchRow}>
              <Lucide name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name or username"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={query}
                onChangeText={setQuery}
                autoFocus={!activeSuggestions.length}
              />
            </View>

            {loadingSearch ? (
              <ActivityIndicator color="#00f5ff" style={{ marginTop: 12 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 180 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultRow} onPress={() => applyTag(item)}>
                    {item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.suggestAvatar} />
                    ) : (
                      <View style={styles.suggestAvatarFallback}>
                        <Text style={styles.suggestInitial}>{item.title[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.suggestName}>{item.title}</Text>
                      <Text style={styles.suggestUser}>{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  query.trim() ? (
                    <Text style={styles.empty}>No profiles found</Text>
                  ) : (
                    <Text style={styles.empty}>Search to tag this person</Text>
                  )
                }
              />
            )}
          </View>
        ) : (
          <Text style={styles.footerHint}>
            {photoTags.length}/{MAX_PHOTO_TAGS} tagged · {faces.length} face(s) detected
          </Text>
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
  cancel: { color: "#fff", fontSize: 16, width: 64 },
  done: { color: "#00f5ff", fontSize: 16, fontWeight: "700", width: 64, textAlign: "right" },
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 10,
    lineHeight: 18,
  },
  optInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  optInTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  optInSub: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2, lineHeight: 15 },
  mediaWrap: {
    marginHorizontal: 16,
    aspectRatio: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaTouch: { flex: 1 },
  media: { width: "100%", height: "100%" },
  faceDot: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  faceDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  tagAnchor: {
    position: "absolute",
    transform: [{ translateX: -8 }, { translateY: -36 }],
    maxWidth: "70%",
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tagPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanText: { color: "#fff", fontSize: 13 },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  rescanText: { color: "#00f5ff", fontWeight: "600", fontSize: 14 },
  picker: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 4,
  },
  suggestBlock: { marginBottom: 10 },
  suggestTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  suggestAvatar: { width: 36, height: 36, borderRadius: 18 },
  suggestAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestInitial: { color: "#fff", fontWeight: "700" },
  suggestName: { color: "#fff", fontWeight: "600", fontSize: 14 },
  suggestUser: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
  confidence: { color: "#00f5ff", fontSize: 12, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
  footerHint: {
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
