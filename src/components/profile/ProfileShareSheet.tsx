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
import Lucide from "@expo/vector-icons/Ionicons";
import type { NetworkProfile } from "@/lib/profileApi";
import { profileModalStyles as styles } from "@/components/profile/profileModalStyles";

type ProfileShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  shareSearch: string;
  onShareSearchChange: (text: string) => void;
  contacts: NetworkProfile[];
  loadingContacts: boolean;
  onShareToContact: (contact: NetworkProfile) => void;
  onAddFriend: () => void;
  onCopyLink: () => void;
  onAddToStory: () => void;
  onWhatsApp: () => void;
  onInstagram: () => void;
  onTelegram: () => void;
  onNativeShare: () => void;
  onShowQr?: () => void;
};

export function ProfileShareSheet({
  visible,
  onClose,
  shareSearch,
  onShareSearchChange,
  contacts,
  loadingContacts,
  onShareToContact,
  onAddFriend,
  onCopyLink,
  onAddToStory,
  onWhatsApp,
  onInstagram,
  onTelegram,
  onNativeShare,
  onShowQr,
}: ProfileShareSheetProps) {
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
      c.username.toLowerCase().includes(shareSearch.toLowerCase())
  );

  const rows: NetworkProfile[][] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    rows.push(filtered.slice(i, i + 3));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.bottomSheetBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.shareSheetContent} onStartShouldSetResponder={() => true}>
          <View style={styles.bottomSheetDragHandle} />

          <View style={styles.shareSearchRow}>
            <View style={styles.shareSearchBox}>
              <Lucide name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.shareSearchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardAppearance="dark"
                value={shareSearch}
                onChangeText={onShareSearchChange}
              />
            </View>
            <TouchableOpacity style={styles.shareAddFriendBtn} onPress={onAddFriend}>
              <Lucide name="person-add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.shareContactsContainer}>
            {loadingContacts ? (
              <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 24 }} />
            ) : filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                  {contacts.length === 0 ? "Follow people to share your profile via DM" : "No contacts found"}
                </Text>
              </View>
            ) : (
              rows.map((rowContacts, rowIndex) => (
                <View key={`row_${rowIndex}`} style={[styles.shareContactsRow, rowIndex > 0 && { marginTop: 20 }]}>
                  {rowContacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.shareContactCard}
                      onPress={() => onShareToContact(contact)}
                    >
                      {contact.avatar ? (
                        <Image source={{ uri: contact.avatar }} style={styles.shareContactAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.shareContactAvatar,
                            { backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
                          ]}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>{contact.name[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.shareContactName} numberOfLines={1}>
                        {contact.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {rowContacts.length < 3 &&
                    Array.from({ length: 3 - rowContacts.length }).map((_, placeholderIdx) => (
                      <View key={`placeholder_${placeholderIdx}`} style={{ width: 90 }} />
                    ))}
                </View>
              ))
            )}
          </View>

          <View style={styles.shareHorizontalDivider} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shareActionsScroll}>
            <TouchableOpacity style={styles.shareActionBtn} onPress={onCopyLink}>
              <View style={styles.shareActionCircle}>
                <Lucide name="link-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>Copy link</Text>
            </TouchableOpacity>

            {onShowQr ? (
              <TouchableOpacity style={styles.shareActionBtn} onPress={onShowQr}>
                <View style={styles.shareActionCircle}>
                  <Lucide name="qr-code-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.shareActionLabel}>QR code</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.shareActionBtn} onPress={onAddToStory}>
              <View style={styles.shareActionCircle}>
                <Lucide name="add-circle-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>Add to story</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={onWhatsApp}>
              <View style={[styles.shareActionCircle, { backgroundColor: "#25d366" }]}>
                <Lucide name="logo-whatsapp" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={onInstagram}>
              <View style={[styles.shareActionCircle, { backgroundColor: "#e1306c" }]}>
                <Lucide name="logo-instagram" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={onTelegram}>
              <View style={[styles.shareActionCircle, { backgroundColor: "#0088cc" }]}>
                <Lucide name="paper-plane-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareActionBtn} onPress={onNativeShare}>
              <View style={styles.shareActionCircle}>
                <Lucide name="share-social-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.shareActionLabel}>More</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
