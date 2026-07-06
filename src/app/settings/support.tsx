import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgBodyText,
  IgRow,
} from "@/components/settings/InstagramSettingsUI";
import { IG } from "@/theme/settingsTheme";
import {
  createSupportTicket,
  fetchSupportTickets,
  sendSupportMessage,
  type SupportTicket,
} from "@/lib/supportApi";
import { useStore } from "@/store/useStore";

export default function SupportSettingsScreen() {
  const { currentUser, triggerHaptic } = useStore();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!currentUser?.id) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchSupportTickets();
      setTickets(list);
      if (selected) {
        const updated = list.find((t) => t.id === selected.id);
        if (updated) setSelected(updated);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, selected?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    setCreating(true);
    triggerHaptic("medium");
    try {
      const res = await createSupportTicket(subject.trim(), message.trim());
      if (res.success && res.ticket) {
        setSubject("");
        setMessage("");
        setSelected(res.ticket);
        await loadTickets();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSubmitting(true);
    triggerHaptic("light");
    try {
      const res = await sendSupportMessage(selected.id, reply.trim());
      if (res.success) {
        setReply("");
        await loadTickets();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (selected) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.flex} edges={["top"]}>
          <View style={styles.nav}>
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.navSide}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Lucide name="chevron-back" size={28} color={IG.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle} numberOfLines={1}>
              {selected.subject}
            </Text>
            <View style={styles.navSide} />
          </View>
          <Text style={styles.status}>Status: {selected.status.replace("_", " ")}</Text>
          <FlatList
            data={selected.messages}
            keyExtractor={(m) => m.id}
            style={styles.thread}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => (
              <View
                style={[styles.bubble, item.isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}
              >
                <Text style={[styles.bubbleText, item.isAdmin && styles.bubbleTextAdmin]}>
                  {item.content}
                </Text>
                <Text
                  style={[styles.bubbleTime, item.isAdmin && styles.bubbleTimeAdmin]}
                >
                  {new Date(item.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.replyRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply…"
                placeholderTextColor={IG.textSecondary}
                value={reply}
                onChangeText={setReply}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !reply.trim() && styles.sendBtnDisabled]}
                onPress={handleReply}
                disabled={submitting || !reply.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendLabel}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  if (!currentUser?.id) {
    return (
      <IgSettingsScreen title="Support">
        <IgBodyText>Sign in to open a support ticket or view your requests.</IgBodyText>
        <IgRow
          label="Email support"
          sublabel="support@auragram.vip"
          onPress={() =>
            Linking.openURL("mailto:support@auragram.vip?subject=AURA%20App%20Issue")
          }
          last
        />
      </IgSettingsScreen>
    );
  }

  return (
    <IgSettingsScreen title="Support">
      <IgBodyText>
        Open a ticket for order, account or app issues. Our team typically responds within 24 hours.
      </IgBodyText>

      <Text style={styles.sectionTitle}>New ticket</Text>
      <TextInput
        style={styles.input}
        placeholder="Subject"
        placeholderTextColor={IG.textSecondary}
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Describe your issue"
        placeholderTextColor={IG.textSecondary}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity
        style={[styles.primaryBtn, creating && styles.primaryBtnDisabled]}
        onPress={handleCreate}
        disabled={creating || !subject.trim() || !message.trim()}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Submit ticket</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your tickets</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={IG.text} />
      ) : tickets.length === 0 ? (
        <Text style={styles.empty}>No tickets yet.</Text>
      ) : (
        tickets.map((t) => (
          <IgRow
            key={t.id}
            label={t.subject}
            sublabel={`${t.status} · ${new Date(t.updatedAt).toLocaleDateString("en-IN")}`}
            onPress={() => {
              triggerHaptic("light");
              setSelected(t);
            }}
          />
        ))
      )}

      <IgRow
        label="Email support"
        sublabel="support@auragram.vip"
        onPress={() =>
          Linking.openURL("mailto:support@auragram.vip?subject=AURA%20App%20Issue")
        }
        last
      />
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IG.bg },
  flex: { flex: 1 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  navSide: { width: 44, alignItems: "flex-start" },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: IG.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: IG.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: IG.text,
    backgroundColor: IG.surface,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  primaryBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: IG.text,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "600" },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: IG.textSecondary,
    fontSize: 14,
  },
  status: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: IG.textSecondary,
    fontSize: 13,
  },
  thread: { flex: 1, paddingHorizontal: 16 },
  bubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: IG.accent,
  },
  bubbleAdmin: {
    alignSelf: "flex-start",
    backgroundColor: IG.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 20 },
  bubbleTextAdmin: { color: IG.text },
  bubbleTime: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 6 },
  bubbleTimeAdmin: { color: IG.textMuted },
  replyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IG.border,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: IG.text,
    backgroundColor: IG.surface,
  },
  sendBtn: {
    backgroundColor: IG.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendLabel: { color: "#fff", fontWeight: "600" },
});
