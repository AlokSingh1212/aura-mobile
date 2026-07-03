import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { ComposerShell } from "@/components/create/ComposerShell";
import { synthesizeProductFromPrompt } from "@/lib/aiProduct";
import { uploadAndPublish } from "@/lib/publishContent";
import { useCreateAuth } from "@/hooks/useCreateAuth";
import { useStore } from "@/store/useStore";
import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";

export default function AiCreateScreen() {
  const { ready, userId, profileId, profileName } = useCreateAuth();
  const { triggerHaptic, fetchProducts, currentUser, activeProfile } = useStore();
  const username = activeProfile?.username || currentUser?.name || "user";

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState("");
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    price: number;
    vibe: string;
    imageUrl: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert("Prompt required", "Describe your fashion design.");
      return;
    }
    setGenerating(true);
    setStep("Synthesizing blueprint and render…");
    try {
      triggerHaptic("medium");
      const product = await synthesizeProductFromPrompt(prompt.trim());
      setDraft(product);
      setTitle(product.title);
      setPrice(String(product.price));
      triggerHaptic("success");
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "AI synthesis failed.");
    } finally {
      setGenerating(false);
      setStep("");
    }
  };

  const handleSave = async () => {
    if (!draft || !title.trim()) return;
    setSaving(true);
    try {
      const parsedPrice = parseFloat(price) || draft.price;
      const res = await fetch(`${API_HOST}/api/mobile/products/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          maisonId: username,
          userId,
          title: title.trim(),
          price: parsedPrice,
          vibe: draft.vibe,
          type: "Fashion",
          images: [draft.imageUrl],
        }),
      });
      const data = await res.json();
      if (!data.success || !data.artifact) {
        throw new Error(data.error || "Could not save product.");
      }

      await uploadAndPublish(draft.imageUrl, "post", {
        userId,
        profileId,
        profileName,
        caption: `${title.trim()} · AI curated on AURA`,
        productId: data.artifact.id,
      });

      fetchProducts();
      triggerHaptic("success");
      Alert.alert("Live", "Product saved and posted to your grid.", [
        { text: "OK", onPress: () => router.replace("/account") },
      ]);
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  return (
    <ComposerShell
      title="AI Product"
      stepLabel={draft ? "Review & publish" : "Prompt"}
      rightLabel={draft ? "Publish" : undefined}
      onRightPress={draft ? handleSave : undefined}
      rightLoading={saving}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {!draft && !generating && (
          <>
            <Text style={styles.lead}>Describe a fashion piece. AURA generates title, price, image, and posts to your shop + grid.</Text>
            <TextInput
              style={styles.input}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="e.g. brutalist gold trench with modular cargo…"
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity style={styles.btn} onPress={handleGenerate}>
              <Text style={styles.btnText}>Generate</Text>
            </TouchableOpacity>
          </>
        )}

        {generating && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#00f5ff" />
            <Text style={styles.step}>{step}</Text>
          </View>
        )}

        {draft && !generating && (
          <>
            <Image source={{ uri: draft.imageUrl }} style={styles.preview} />
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#666" />
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ""))}
              placeholder="Price (INR)"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.desc}>{draft.description}</Text>
            <TouchableOpacity style={styles.secondary} onPress={() => setDraft(null)}>
              <Text style={styles.secondaryText}>Regenerate</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ComposerShell>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#080415", alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  lead: { color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    minHeight: 48,
  },
  btn: {
    backgroundColor: "#00f5ff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#080415", fontWeight: "700", fontSize: 16 },
  center: { alignItems: "center", paddingTop: 60 },
  step: { color: "#fff", marginTop: 16, fontSize: 14 },
  preview: { width: "100%", height: 280, borderRadius: 12, marginBottom: 16, backgroundColor: "#111" },
  desc: { color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 18, marginBottom: 16 },
  secondary: { padding: 14, alignItems: "center" },
  secondaryText: { color: "#00f5ff", fontWeight: "600" },
});
