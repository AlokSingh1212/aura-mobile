import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgRow,
  IgCheckRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { IG } from "@/theme/settingsTheme";
import {
  loadSocialGraph,
  type SocialUser,
  invalidateSocialGraphCache,
} from "@/lib/socialGraph";
import {
  fetchProfileNetwork,
  fetchSuggestedProfiles,
  type NetworkProfile,
} from "@/lib/profileApi";
import { useStore } from "@/store/useStore";

type ListKind = "blocked" | "muted" | "closeFriends" | "favorites";

type Props = {
  title: string;
  kind: ListKind;
  emptyTitle: string;
  emptyBody: string;
  addLabel: string;
  onAdd: (user: Omit<SocialUser, "addedAt">) => Promise<unknown>;
  onRemove: (profileId: string) => Promise<unknown>;
  removeLabel?: string;
  intro?: string;
};

export function SettingsUserListScreen({
  title,
  kind,
  emptyTitle,
  emptyBody,
  addLabel,
  onAdd,
  onRemove,
  removeLabel = "Remove",
  intro,
}: Props) {
  const { activeProfile, triggerHaptic } = useStore();
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [candidates, setCandidates] = useState<NetworkProfile[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    invalidateSocialGraphCache();
    const g = await loadSocialGraph();
    setUsers(g[kind]);
  }, [kind]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openPicker = async () => {
    if (!activeProfile?.id) return;
    setPickerOpen(true);
    setLoadingPicker(true);
    try {
      const following = await fetchProfileNetwork(activeProfile.id, "following", activeProfile.id);
      const suggested = following.length < 4 ? await fetchSuggestedProfiles(activeProfile.id, 12) : [];
      const map = new Map<string, NetworkProfile>();
      [...following, ...suggested].forEach((p) => map.set(p.id, p));
      setCandidates([...map.values()]);
    } finally {
      setLoadingPicker(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const existing = new Set(users.map((u) => u.profileId));
    return candidates.filter((c) => {
      if (existing.has(c.id)) return false;
      if (!q) return true;
      return (
        c.username.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      );
    });
  }, [candidates, query, users]);

  const pickUser = async (p: NetworkProfile) => {
    triggerHaptic("light");
    await onAdd({
      profileId: p.id,
      username: p.username,
      name: p.name,
      avatar: p.avatar,
    });
    setPickerOpen(false);
    setQuery("");
    refresh();
  };

  const removeUser = async (profileId: string) => {
    triggerHaptic("medium");
    await onRemove(profileId);
    refresh();
  };

  return (
    <>
      <IgSettingsScreen title={title}>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}

        <IgRow label={addLabel} onPress={openPicker} />

        {users.length === 0 ? (
          <View style={styles.empty}>
            <Lucide name="people-outline" size={48} color={IG.textMuted} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyBody}>{emptyBody}</Text>
          </View>
        ) : (
          users.map((u, idx) => (
            <View key={u.profileId} style={[styles.userRow, idx === users.length - 1 && styles.last]}>
              <TouchableOpacity
                style={styles.userMain}
                onPress={() => router.push(`/profile/${u.username}` as any)}
              >
                {u.avatar ? (
                  <Image source={{ uri: u.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPh}>
                    <Text style={styles.initial}>{u.name[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.username}</Text>
                  <Text style={styles.sub}>{u.name}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeUser(u.profileId)} style={styles.removeBtn}>
                <Text style={styles.removeText}>{removeLabel}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </IgSettingsScreen>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHead}>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <Lucide name="close" size={28} color={IG.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{addLabel}</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.searchWrap}>
            <Lucide name="search" size={18} color={IG.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search accounts"
              placeholderTextColor={IG.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          {loadingPicker ? (
            <ActivityIndicator color={IG.accent} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filteredCandidates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickRow} onPress={() => pickUser(item)}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPh}>
                      <Text style={styles.initial}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.username}</Text>
                    <Text style={styles.sub}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyBody}>No accounts to show. Follow creators first.</Text>
              }
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  empty: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: IG.text, marginTop: 8 },
  emptyBody: { fontSize: 14, color: IG.textSecondary, textAlign: "center", padding: 16 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  last: { borderBottomWidth: 0 },
  userMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: IG.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: IG.text, fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "600", color: IG.text },
  sub: { fontSize: 13, color: IG.textSecondary },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { color: IG.accent, fontWeight: "700", fontSize: 14 },
  modal: { flex: 1, backgroundColor: IG.bg, paddingTop: 48 },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: IG.text },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: IG.searchBg,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: IG.text, fontSize: 16 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
});

export function SettingsChoiceScreen({
  title,
  intro,
  options,
  value,
  onChange,
}: {
  title: string;
  intro?: string;
  options: { key: string; label: string; hint?: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <IgSettingsScreen title={title}>
      {intro ? <IgBodyText>{intro}</IgBodyText> : null}
      {options.map((opt, idx) => (
        <IgCheckRow
          key={opt.key}
          label={opt.label}
          hint={opt.hint}
          selected={value === opt.key}
          last={idx === options.length - 1}
          onPress={() => onChange(opt.key)}
        />
      ))}
    </IgSettingsScreen>
  );
}
