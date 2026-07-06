import React, { useState } from "react";
import { Linking, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  IgSettingsScreen,
  IgRow,
  IgBodyText,
} from "@/components/settings/InstagramSettingsUI";
import { IG } from "@/theme/settingsTheme";

const FAQ = [
  {
    q: "How do I track my shop order?",
    a: "Go to Settings → Orders and payments → Orders, or open the receipt icon in the Shop tab.",
  },
  {
    q: "How do I switch between Personal and Maison profiles?",
    a: "Open Settings → Accounts Center → Profiles and tap the account you want to use.",
  },
  {
    q: "How do I archive a post?",
    a: "Tap ··· on your post and choose Archive. View archived content under Settings → Archives.",
  },
  {
    q: "How do saved products work?",
    a: "Heart a product on its page or save shop items to your wishlist. View under Settings → Saved → Products.",
  },
  {
    q: "How do I contact support?",
    a: "Go to Settings → Contact support to open a ticket, or email support@auragram.vip.",
  },
];

export default function HelpSettingsScreen() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <IgSettingsScreen title="Help">
      <IgBodyText>
        Find answers about shopping, creator tools, privacy and your AURA account.
      </IgBodyText>

      <IgRow
        label="Help Center"
        sublabel="Browse guides on the web"
        onPress={() => Linking.openURL("https://auragram.vip/help")}
      />
      <IgRow
        label="Contact support"
        sublabel="Open a ticket in the app"
        onPress={() => router.push("/settings/support" as any)}
      />
      <IgRow
        label="Report a problem"
        onPress={() => Linking.openURL("mailto:support@auragram.vip?subject=AURA%20App%20Issue")}
        last
      />

      <Text style={styles.faqTitle}>Popular topics</Text>
      {FAQ.map((item, idx) => (
        <View key={item.q}>
          <TouchableOpacity
            style={styles.faqHead}
            onPress={() => setOpen(open === idx ? null : idx)}
          >
            <Text style={styles.faqQ}>{item.q}</Text>
            <Lucide
              name={open === idx ? "chevron-up" : "chevron-down"}
              size={18}
              color={IG.chevron}
            />
          </TouchableOpacity>
          {open === idx ? <Text style={styles.faqA}>{item.a}</Text> : null}
        </View>
      ))}
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  faqTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: IG.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  faqHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  faqQ: { flex: 1, fontSize: 15, color: IG.text, paddingRight: 8 },
  faqA: {
    fontSize: 14,
    lineHeight: 20,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
});
