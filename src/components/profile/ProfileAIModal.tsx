import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { profilePortalStyles as portalStyles } from "@/components/profile/profilePortalStyles";

type GeneratedProduct = {
  image: string;
  description?: string;
};

type ProfileAIModalProps = {
  visible: boolean;
  topInset: number;
  aiPrompt: string;
  aiProgress: number;
  aiGenerating: boolean;
  aiStep: string;
  generatedProduct: GeneratedProduct | null;
  aiTitle: string;
  aiPrice: string;
  onClose: () => void;
  onStartGeneration: () => void;
  onMintProduct: () => void;
  onRegenerate: () => void;
  setAiPrompt: (v: string) => void;
  setAiTitle: (v: string) => void;
  setAiPrice: (v: string) => void;
};

export function ProfileAIModal({
  visible,
  topInset,
  aiPrompt,
  aiProgress,
  aiGenerating,
  aiStep,
  generatedProduct,
  aiTitle,
  aiPrice,
  onClose,
  onStartGeneration,
  onMintProduct,
  onRegenerate,
  setAiPrompt,
  setAiTitle,
  setAiPrice,
}: ProfileAIModalProps) {
  return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={[portalStyles.editModalContainer, { paddingTop: topInset }]}>
          <View style={{ flex: 1 }}>
            <View style={portalStyles.editModalNavBar}>
              <TouchableOpacity onPress={onClose}>
                <Text style={portalStyles.editModalCancelText}>Back</Text>
              </TouchableOpacity>
              <Text style={portalStyles.editModalTitle}>AI Design Assistant</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={portalStyles.editModalScroll} showsVerticalScrollIndicator={false}>
              {!generatedProduct && !aiGenerating && (
                <>
                  <Text style={{ color: "#00f5ff", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AURA Deep-Fashion Architect</Text>
                  <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Synthesize Sovereign Blueprints</Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24, lineHeight: 18 }}>
                    Describe your high-fidelity fashion vision. AURA-AI will dynamically synthesize ambient textures, geometry mesh models, and calculate market metrics immediately.
                  </Text>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Design Prompt</Text>
                    <TextInput
                      style={[portalStyles.inputField, { height: 80, textAlignVertical: "top" }]}
                      value={aiPrompt}
                      onChangeText={setAiPrompt}
                      multiline
                      numberOfLines={4}
                      placeholder="e.g. brutalist trench coat in liquid gold mercury drape fabric with modular cargo modules..."
                      placeholderTextColor="#8e8e8e"
                    />
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 }}
                    onPress={onStartGeneration}
                  >
                    <Text style={{ color: "#000000", fontSize: 14, fontWeight: "bold" }}>Synthesize Fashion Blueprint</Text>
                  </TouchableOpacity>
                </>
              )}

              {aiGenerating && (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 }}>
                  <ActivityIndicator size="large" color="#00f5ff" style={{ marginBottom: 24 }} />
                  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>AURA AI is curating...</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", paddingHorizontal: 30, marginBottom: 30, height: 40 }}>{aiStep}</Text>
                  
                  {/* Custom progress HUD */}
                  <View style={{ width: "80%", height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ width: `${aiProgress}%`, height: "100%", backgroundColor: "#00f5ff" }} />
                  </View>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontFamily: "monospace", marginTop: 10 }}>{aiProgress}% COMPLETE</Text>
                </View>
              )}

              {generatedProduct && !aiGenerating && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={{ color: "#00f5ff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Synthesis Successful</Text>
                  <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Synthesized Artifact Render</Text>

                  <View style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
                    <Image source={{ uri: generatedProduct.image }} style={{ width: "100%", height: 260 }} />
                    <View style={{ padding: 16, backgroundColor: "#0b071e" }}>
                      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{aiTitle}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>{generatedProduct.description}</Text>
                    </View>
                  </View>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Generated Title Override</Text>
                    <TextInput
                      style={portalStyles.inputField}
                      value={aiTitle}
                      onChangeText={setAiTitle}
                    />
                  </View>

                  <View style={portalStyles.inputGroup}>
                    <Text style={portalStyles.inputLabel}>Hydrate Price Override (INR)</Text>
                    <TextInput
                      style={portalStyles.inputField}
                      value={aiPrice}
                      onChangeText={price => setAiPrice(price.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={() => onRegenerate()}
                    >
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Regenerate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: "#00f5ff", paddingVertical: 14, borderRadius: 8, alignItems: "center" }}
                      onPress={onMintProduct}
                    >
                      <Text style={{ color: "#000000", fontSize: 13, fontWeight: "bold" }}>Hydrate to Ledger</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

  );
}
