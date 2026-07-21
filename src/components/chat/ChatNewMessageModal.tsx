import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { Avatar } from "@/components/ui/Avatar";

type SuggestedProfile = {
  id: string;
  userId?: string;
  name: string;
  username: string;
  logo?: string;
  avatar?: string;
};

type GroupMember = {
  userId: string;
  name: string;
  username: string;
};

type ChatNewMessageModalProps = {
  visible: boolean;
  mode: "direct" | "group";
  searchNewChat: string;
  loadingSuggested: boolean;
  suggestedProfiles: SuggestedProfile[];
  groupSelectedMembers: GroupMember[];
  triggerHaptic: (style: any) => void;
  onClose: () => void;
  onModeChange: (mode: "direct" | "group") => void;
  onSearchChange: (text: string) => void;
  onSelectProfile: (profile: SuggestedProfile) => void;
  onCreateGroup: () => void;
};

export function ChatNewMessageModal({
  visible,
  mode,
  searchNewChat,
  loadingSuggested,
  suggestedProfiles,
  groupSelectedMembers,
  triggerHaptic,
  onClose,
  onModeChange,
  onSearchChange,
  onSelectProfile,
  onCreateGroup,
}: ChatNewMessageModalProps) {
  const selectedIds = new Set(groupSelectedMembers.map((m) => m.userId));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.newChatOverlay}>
        <SafeAreaView style={styles.newChatSafeArea}>
          <View style={styles.newChatHeader}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic("light");
                onClose();
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.newChatTitle}>{mode === "group" ? "New group" : "New Message"}</Text>
            {mode === "group" ? (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic("medium");
                  onCreateGroup();
                }}
                disabled={groupSelectedMembers.length < 1}
              >
                <Text
                  style={{
                    color: groupSelectedMembers.length < 1 ? "rgba(255,255,255,0.3)" : "#00f5ff",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Create
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === "direct" && styles.modeChipActive]}
              onPress={() => onModeChange("direct")}
            >
              <Text style={[styles.modeChipText, mode === "direct" && styles.modeChipTextActive]}>Direct</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === "group" && styles.modeChipActive]}
              onPress={() => onModeChange("group")}
            >
              <Text style={[styles.modeChipText, mode === "group" && styles.modeChipTextActive]}>Group</Text>
            </TouchableOpacity>
          </View>

          {mode === "group" && groupSelectedMembers.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow}>
              {groupSelectedMembers.map((member) => (
                <View key={member.userId} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>@{member.username}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.newChatSearchContainer}>
            <Text style={styles.newChatSearchTo}>{mode === "group" ? "Add:" : "To:"}</Text>
            <TextInput
              style={styles.newChatSearchInput}
              placeholder={mode === "group" ? "Search people to add…" : "Search profiles..."}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={searchNewChat}
              onChangeText={onSearchChange}
              autoFocus
            />
          </View>

          {loadingSuggested ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="small" color="#00f5ff" />
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
              <Text style={styles.newChatSuggestedTitle}>
                {searchNewChat ? "SEARCH RESULTS" : mode === "group" ? "SUGGESTED (search to add)" : "SUGGESTED"}
              </Text>
              {suggestedProfiles.length === 0 ? (
                <Text style={styles.newChatEmptyText}>No profiles found.</Text>
              ) : (
                suggestedProfiles.map((profile) => {
                  const isSelected = profile.userId ? selectedIds.has(profile.userId) : false;
                  return (
                    <TouchableOpacity
                      key={profile.id}
                      style={[styles.newChatUserRow, isSelected && styles.newChatUserRowSelected]}
                      onPress={() => onSelectProfile(profile)}
                    >
                      <Avatar
                        uri={profile.logo || profile.avatar}
                        name={profile.name}
                        size={44}
                        style={styles.newChatAvatar as any}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.newChatName}>{profile.name}</Text>
                        <Text style={styles.newChatUsername}>@{profile.username}</Text>
                      </View>
                      {mode === "group" && isSelected ? (
                        <Lucide name="checkmark-circle" size={22} color="#00f5ff" />
                      ) : (
                        <Lucide name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  newChatOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  newChatSafeArea: { flex: 1, backgroundColor: "#0a0a0a", marginTop: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  newChatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  newChatTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  modeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  modeChipActive: { borderColor: "#00f5ff", backgroundColor: "rgba(0,245,255,0.1)" },
  modeChipText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  modeChipTextActive: { color: "#00f5ff" },
  selectedRow: { paddingHorizontal: 16, paddingTop: 10, maxHeight: 44 },
  selectedChip: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: { color: "#00f5ff", fontSize: 12, fontWeight: "600" },
  newChatSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  newChatSearchTo: { color: "rgba(255,255,255,0.5)", fontSize: 16 },
  newChatSearchInput: { flex: 1, color: "#fff", fontSize: 16 },
  newChatSuggestedTitle: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  newChatEmptyText: { color: "rgba(255,255,255,0.4)", paddingHorizontal: 16, paddingTop: 8 },
  newChatUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newChatUserRowSelected: { backgroundColor: "rgba(0,245,255,0.06)" },
  newChatAvatar: { width: 44, height: 44, borderRadius: 22 },
  newChatAvatarFallback: { backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  newChatName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  newChatUsername: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 },
});
