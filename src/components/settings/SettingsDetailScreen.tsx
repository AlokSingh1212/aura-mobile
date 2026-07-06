import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IgSettingsScreen } from "@/components/settings/InstagramSettingsUI";
import { IG } from "@/theme/settingsTheme";

type Props = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function SettingsDetailScreen({ title, description, children }: Props) {
  return (
    <IgSettingsScreen title={title}>
      <Text style={styles.desc}>{description}</Text>
      {children}
    </IgSettingsScreen>
  );
}

export function SettingsComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <SettingsDetailScreen title={title} description={body}>
      <View style={styles.soon}>
        <Text style={styles.soonText}>More controls coming in the next release.</Text>
      </View>
    </SettingsDetailScreen>
  );
}

const styles = StyleSheet.create({
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  soon: { padding: 24, alignItems: "center" },
  soonText: { color: IG.textMuted, fontSize: 14 },
});
