import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SettingsScaffold({ title, subtitle, children }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Lucide name="arrow-back" size={24} color={SHOP.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type RowProps = {
  icon?: React.ComponentProps<typeof Lucide>["name"];
  label: string;
  hint?: string;
  onPress?: () => void;
  chevron?: boolean;
  right?: React.ReactNode;
};

export function SettingsRow({ icon, label, hint, onPress, chevron, right }: RowProps) {
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Lucide name={icon} size={20} color={SHOP.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right}
      {chevron ? <Lucide name="chevron-forward" size={18} color={SHOP.textMuted} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

type ToggleProps = {
  icon?: React.ComponentProps<typeof Lucide>["name"];
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export function SettingsToggle({ icon, label, hint, value, onValueChange }: ToggleProps) {
  return (
    <SettingsRow
      icon={icon}
      label={label}
      hint={hint}
      right={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: SHOP.border, true: SHOP.primary }}
        />
      }
    />
  );
}

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SHOP.surface },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: SHOP.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
  },
  backBtn: { padding: 8, marginRight: 4 },
  title: { fontSize: 18, fontWeight: "800", color: SHOP.text },
  subtitle: { fontSize: 12, color: SHOP.textSecondary, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: SHOP.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: SHOP.bg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SHOP.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SHOP.border,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: SHOP.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "600", color: SHOP.text },
  rowHint: { fontSize: 11, color: SHOP.textSecondary, marginTop: 3, lineHeight: 15 },
});
