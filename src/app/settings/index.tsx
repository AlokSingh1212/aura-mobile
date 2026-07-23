import React, { useMemo, useState } from "react";
import { Text, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import {
  IgSettingsScreen,
  IgRow,
  IgSectionTitle,
  IgDivider,
} from "@/components/settings/InstagramSettingsUI";
import {
  SETTINGS_MENU,
  filterSettingsMenu,
  groupSettingsMenu,
} from "@/constants/settingsMenu";
import { useStore } from "@/store/useStore";
import { IG } from "@/theme/settingsTheme";

export default function SettingsHubScreen() {
  const { triggerHaptic, currentUser, activeProfile, authLogOut } = useStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterSettingsMenu(query), [query]);
  const sections = useMemo(() => groupSettingsMenu(filtered), [filtered]);

  const displayName =
    activeProfile?.name || currentUser?.name || activeProfile?.username || "Your profile";
  const avatar = activeProfile?.logo || currentUser?.avatar;

  const open = (route: string) => {
    triggerHaptic("light");
    router.push(route as any);
  };

  const handleLogOut = () => {
    triggerHaptic("medium");
    Alert.alert(
      "Log Out",
      `Are you sure you want to log out of @${activeProfile?.username || currentUser?.username || "your account"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            authLogOut();
            router.replace("/(auth)/login" as any);
          },
        },
      ]
    );
  };

  const handleLogOutAll = () => {
    triggerHaptic("heavy");
    Alert.alert(
      "Log Out All Accounts",
      "This will clear all saved sessions from this device. You will need to log back in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out All",
          style: "destructive",
          onPress: () => {
            authLogOut();
            router.replace("/(auth)/login" as any);
          },
        },
      ]
    );
  };

  return (
    <IgSettingsScreen
      title="Settings and activity"
      showSearch
      searchQuery={query}
      onSearchChange={setQuery}
    >
      <IgRow
        label="Accounts Center"
        sublabel="Password, security, personal details, ad preferences and verified"
        avatarUri={avatar || undefined}
        avatarInitial={!avatar ? displayName[0]?.toUpperCase() : undefined}
        onPress={() => open("/settings/accounts")}
      />

      <IgDivider />

      {sections.map((section) => (
        <React.Fragment key={section.title}>
          <IgSectionTitle>{section.title}</IgSectionTitle>
          {section.items.map((item, idx) => {
            if (item.id === "accounts-center") return null;
            const onPress =
              item.id === "logout"
                ? handleLogOut
                : item.id === "logout-all"
                ? handleLogOutAll
                : item.route
                ? () => open(item.route!)
                : undefined;

            return (
              <IgRow
                key={item.id}
                label={
                  item.id === "logout"
                    ? `Log out @${activeProfile?.username || currentUser?.username || "account"}`
                    : item.label
                }
                sublabel={item.sublabel}
                danger={item.danger}
                last={idx === section.items.length - 1}
                onPress={onPress}
              />
            );
          })}
          <IgDivider />
        </React.Fragment>
      ))}

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No settings match "{query}"</Text>
      ) : null}

      <Text style={styles.meta}>AURAGRAM · Settings sync on this device</Text>
    </IgSettingsScreen>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: IG.textSecondary,
    textAlign: "center",
    padding: 32,
    fontSize: 15,
  },
  meta: {
    color: IG.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
