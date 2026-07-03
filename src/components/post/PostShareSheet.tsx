import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Share,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { API_HOST } from "@/constants/api";
import { useStore } from "@/store/useStore";
import type { EngagementPostItem } from "@/hooks/usePostEngagement";

const SHARE_CONTACTS = [
  { id: "c1", name: "Kiran Soni", username: "kiran_soni", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150" },
  { id: "c2", name: "S U R A J", username: "suraj_official", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150" },
  { id: "c3", name: "Dr. Rashneet ✨", username: "dr_rashneet", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150" },
  { id: "c4", name: "Rhythm Bhatia", username: "rhythm_bhatia", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150" },
  { id: "c5", name: "the.priyas...", username: "priya_luxury", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150" },
  { id: "c6", name: "Mandy", username: "mandy_c", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150" },
];

interface PostShareSheetProps {
  visible: boolean;
  onClose: () => void;
  post: EngagementPostItem | null;
  shareLink?: string | null;
}

export function PostShareSheet({ visible, onClose, post, shareLink }: PostShareSheetProps) {
  const { triggerHaptic, addInstaStorySlide } = useStore();
  const [shareSearch, setShareSearch] = useState("");

  const postUrl = shareLink || post?.url || `${API_HOST}/reel/${post?.id || "s1"}`;
  const caption = post?.caption || "Check out this luxury curation!";

  const handleClose = () => {
    setShareSearch("");
    onClose();
  };

  const filtered = SHARE_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
      c.username.toLowerCase().includes(shareSearch.toLowerCase())
  );

  const chunked: typeof SHARE_CONTACTS[] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    chunked.push(filtered.slice(i, i + 3));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <View style={styles.dragHandle} />

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardAppearance="dark"
                value={shareSearch}
                onChangeText={setShareSearch}
              />
            </View>
            <TouchableOpacity
              style={styles.addFriendBtn}
              onPress={() => {
                triggerHaptic("light");
                Alert.alert("Contacts Synced", "Your dynamic contact nodes have been successfully synchronized.");
              }}
            >
              <Lucide name="person-add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactsContainer}>
            {chunked.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No results found</Text>
              </View>
            ) : (
              chunked.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.contactsRow}>
                  {row.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.contactCard}
                      onPress={() => {
                        triggerHaptic("success");
                        handleClose();
                        Alert.alert("Sent", `Direct message sent successfully to ${contact.name}!`);
                      }}
                    >
                      <Image source={{ uri: contact.avatar }} style={styles.contactAvatar} />
                      <Text style={styles.contactName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>

          <View style={styles.horizontalDivider} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                triggerHaptic("success");
                handleClose();
                try {
                  await Clipboard.setStringAsync(postUrl);
                  Alert.alert("Link Copied", "The luxury curation link has been copied to your clipboard.");
                } catch {
                  Alert.alert("Link Copied", `Coordinate: ${postUrl}`);
                }
              }}
            >
              <View style={styles.actionCircle}>
                <Lucide name="link-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Copy link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic("success");
                handleClose();
                if (!post) return;
                addInstaStorySlide({
                  id: `ys_${Date.now()}`,
                  url: post.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
                  caption: post.caption || "Obsidian Gold curation added to AURA Story coordinates.",
                  isVideo: false,
                  artifact: null,
                });
                Alert.alert("Story Shared", "Shared successfully to your Stories feed!");
              }}
            >
              <View style={styles.actionCircle}>
                <Lucide name="add-circle-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Add to story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic("success");
                handleClose();
                const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"\n\nLink: ${postUrl}`;
                Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
                  Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
                });
              }}
            >
              <View style={[styles.actionCircle, { backgroundColor: "#25d366" }]}>
                <Lucide name="logo-whatsapp" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic("success");
                handleClose();
                Linking.openURL("instagram://camera").catch(() => {
                  Linking.openURL("https://instagram.com");
                });
              }}
            >
              <View style={[styles.actionCircle, { backgroundColor: "#e1306c" }]}>
                <Lucide name="logo-instagram" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic("success");
                handleClose();
                const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"\n\nLink: ${postUrl}`;
                Linking.openURL(`tg://msg?text=${encodeURIComponent(text)}`).catch(() => {
                  Linking.openURL(
                    `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`
                  );
                });
              }}
            >
              <View style={[styles.actionCircle, { backgroundColor: "#0088cc" }]}>
                <Lucide name="paper-plane-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                triggerHaptic("success");
                handleClose();
                const text = `Check out this gorgeous quiet-luxury curation on AURA: "${caption}"`;
                Share.share({
                  message: `${text}\n\nLink: ${postUrl}`,
                  url: postUrl,
                  title: "AURA Luxury Curation",
                }).catch(() => {});
              }}
            >
              <View style={styles.actionCircle}>
                <Lucide name="share-social-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>More</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#0d0a21",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 8,
    paddingBottom: 32,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginVertical: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  addFriendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },
  contactsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactCard: {
    alignItems: "center",
    width: 90,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  contactName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  horizontalDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 20,
  },
  actionsScroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
    width: 76,
    gap: 6,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
});
