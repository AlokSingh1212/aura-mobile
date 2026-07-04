import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { GlassView } from "expo-glass-effect";
import Lucide from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PostPerson } from "@/lib/postPeople";
import { roleLabel } from "@/lib/postPeople";

interface PostPeopleGlassSheetProps {
  visible: boolean;
  people: PostPerson[];
  onClose: () => void;
  onSelect: (person: PostPerson) => void;
}

function GlassPanel({ children, style }: { children: React.ReactNode; style?: object }) {
  if (Platform.OS === "ios") {
    return (
      <GlassView glassEffectStyle="regular" tintColor="rgba(8,4,21,0.55)" style={[styles.glass, style]}>
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.glass, styles.glassFallback, style]}>{children}</View>;
}

export function PostPeopleGlassSheet({
  visible,
  people,
  onClose,
  onSelect,
}: PostPeopleGlassSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.center, { paddingBottom: insets.bottom + 16 }]}>
        <GlassPanel>
          <View style={styles.header}>
            <Text style={styles.title}>People in this post</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Lucide name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Tap a profile to open</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {people.map((person) => (
              <TouchableOpacity
                key={`${person.profileId}-${person.username}`}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => onSelect(person)}
              >
                {person.logo ? (
                  <Image source={{ uri: person.logo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{person.name[0]?.toUpperCase() || "?"}</Text>
                  </View>
                )}
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {person.name}
                  </Text>
                  <Text style={styles.username} numberOfLines={1}>
                    @{person.username}
                  </Text>
                </View>
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>{roleLabel(person.roles)}</Text>
                </View>
                <Lucide name="chevron-forward" size={16} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassPanel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  center: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  glass: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    maxHeight: "62%",
  },
  glassFallback: {
    backgroundColor: "rgba(8,4,21,0.88)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  avatarFallback: {
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  username: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,245,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
  },
  roleText: {
    color: "#00f5ff",
    fontSize: 10,
    fontWeight: "700",
  },
});
