import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Lucide from "@expo/vector-icons/Ionicons";
import { ComposerShell } from "@/components/create/ComposerShell";
import { listDrafts, deleteDraft, type CreateDraft } from "@/lib/createDraft";
import { useCreateAuth } from "@/hooks/useCreateAuth";

const CREATE_OPTIONS = [
  { id: "reel", label: "Reel", icon: "film-outline", route: "/create/reel", desc: "Record · timeline · music · filters" },
  { id: "post", label: "Post", icon: "grid-outline", route: "/create/post", desc: "Carousel · filters · caption" },
  { id: "story", label: "Story", icon: "add-circle-outline", route: "/create/story", desc: "Stickers baked into image" },
  { id: "live", label: "Live", icon: "radio-outline", route: null, desc: "Agora broadcast · real session" },
  { id: "ai", label: "AI Product", icon: "sparkles-outline", route: "/create/ai", desc: "Prompt → product → grid post" },
] as const;

export default function CreateHubScreen() {
  const { ready } = useCreateAuth();
  const [drafts, setDrafts] = useState<CreateDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const refreshDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    const all = await listDrafts();
    setDrafts(all.filter((d) => d.status === "draft"));
    setLoadingDrafts(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) refreshDrafts();
    }, [ready, refreshDrafts])
  );

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  return (
    <ComposerShell title="Create" stepLabel="Instagram-level studio">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>New</Text>
        {CREATE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.option}
            onPress={() => {
              if (opt.id === "live") {
                router.push({ pathname: "/account", params: { openCreate: "live" } } as any);
                return;
              }
              router.push(opt.route as any);
            }}
          >
            <Lucide name={opt.icon as any} size={24} color={opt.id === "ai" ? "#00f5ff" : "#fff"} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionLabel, opt.id === "ai" && { color: "#00f5ff" }]}>{opt.label}</Text>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
            </View>
            <Lucide name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        ))}

        <Text style={[styles.section, { marginTop: 28 }]}>Drafts</Text>
        {loadingDrafts ? (
          <ActivityIndicator color="#00f5ff" style={{ marginTop: 12 }} />
        ) : drafts.length === 0 ? (
          <Text style={styles.emptyDrafts}>No drafts — start creating to save progress locally.</Text>
        ) : (
          drafts.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.draftRow}
              onPress={() => router.push(`/create/${d.kind}` as any)}
            >
              <Lucide
                name={d.kind === "reel" ? "film-outline" : d.kind === "story" ? "add-circle-outline" : "grid-outline"}
                size={20}
                color="#00f5ff"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.draftTitle}>{d.kind.charAt(0).toUpperCase() + d.kind.slice(1)} draft</Text>
                <Text style={styles.draftMeta}>{d.clips.length} clip(s) · {d.step}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteDraft(d.id).then(refreshDrafts)}>
                <Lucide name="trash-outline" size={18} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ComposerShell>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginBottom: 8,
  },
  optionLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  optionDesc: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  emptyDrafts: { color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 18 },
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "rgba(0,245,255,0.06)",
    borderRadius: 10,
    marginBottom: 8,
  },
  draftTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  draftMeta: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
});
