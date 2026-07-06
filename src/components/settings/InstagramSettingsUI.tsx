import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Switch,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { IG } from "@/theme/settingsTheme";
import { useEnforcedSettings } from "@/context/SettingsEnforcementContext";

type ScreenProps = {
  title?: string;
  children: React.ReactNode;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  largeTitle?: string;
};

export function IgSettingsScreen({
  title = "Settings and activity",
  children,
  showSearch,
  searchQuery = "",
  onSearchChange,
  largeTitle,
}: ScreenProps) {
  const { a11y } = useEnforcedSettings();
  const fontScale = a11y.largerText ? 1.12 : 1;

  return (
    <View style={[styles.root, a11y.highContrast && styles.rootContrast]}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.nav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.navSide}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Lucide name="chevron-back" size={28} color={IG.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { fontSize: 16 * fontScale }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.navSide} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {largeTitle ? (
            <Text style={[styles.largeTitle, { fontSize: 26 * fontScale }]}>{largeTitle}</Text>
          ) : null}

          {showSearch && onSearchChange ? (
            <View style={styles.searchWrap}>
              <Lucide name="search" size={18} color={IG.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={IG.textMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          ) : null}

          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type RowProps = {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  rightText?: string;
  avatarUri?: string;
  avatarInitial?: string;
  last?: boolean;
};

export function IgRow({
  label,
  sublabel,
  onPress,
  danger,
  showChevron = true,
  rightText,
  avatarUri,
  avatarInitial,
  last,
}: RowProps) {
  const inner = (
    <View style={[styles.row, last && styles.rowLast]}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : avatarInitial ? (
        <View style={styles.avatarPh}>
          <Text style={styles.avatarInitial}>{avatarInitial}</Text>
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.dangerLabel]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
      {showChevron && onPress ? (
        <Lucide name="chevron-forward" size={18} color={IG.chevron} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

export function IgSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function IgDivider() {
  return <View style={styles.sectionGap} />;
}

type ToggleProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
};

export function IgToggle({ label, hint, value, onValueChange, last }: ToggleProps) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowSub}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#363636", true: IG.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

export function IgBodyText({ children }: { children: string }) {
  return <Text style={styles.bodyText}>{children}</Text>;
}

type CheckRowProps = {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
};

export function IgCheckRow({ label, hint, selected, onPress, last }: CheckRowProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.row, last && styles.rowLast]}>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{label}</Text>
          {hint ? <Text style={styles.rowSub}>{hint}</Text> : null}
        </View>
        {selected ? <Lucide name="checkmark" size={22} color={IG.accent} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: IG.bg },
  rootContrast: { backgroundColor: "#000000" },
  safe: { flex: 1 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
  },
  navSide: { width: 52, alignItems: "center", justifyContent: "center" },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: IG.text,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },
  largeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: IG.text,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: IG.searchBg,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IG.text,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: IG.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionGap: { height: IG.sectionGap },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IG.border,
    minHeight: 48,
  },
  rowLast: { borderBottomWidth: 0 },
  rowBody: { flex: 1, paddingRight: 8 },
  rowLabel: { fontSize: 16, color: IG.text, lineHeight: 20 },
  rowSub: { fontSize: 13, color: IG.textSecondary, marginTop: 3, lineHeight: 17 },
  dangerLabel: { color: IG.danger },
  rightText: { fontSize: 14, color: IG.textSecondary, marginRight: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: IG.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: IG.text, fontSize: 16, fontWeight: "700" },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: IG.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
