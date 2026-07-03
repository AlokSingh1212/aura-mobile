import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { REEL_EFFECTS } from "@/constants/reelStudio";

type Props = {
  activeFilter: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function EffectsDrawer({ activeFilter, onSelect, onClose }: Props) {
  return (
    <View style={styles.drawer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Effects</Text>
          <Text style={styles.subtitle}>{REEL_EFFECTS.length} filters · saved on export</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Lucide name="close-circle" size={26} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {REEL_EFFECTS.map((fx) => {
          const active = activeFilter === fx.id;
          return (
            <TouchableOpacity
              key={fx.id}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onSelect(fx.id)}
            >
              <View style={[styles.preview, { backgroundColor: fx.previewColor === "transparent" ? "#222" : fx.previewColor }]}>
                <Lucide name={fx.icon as any} size={22} color={active ? "#00f5ff" : "#fff"} />
              </View>
              <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>{fx.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "58%",
    backgroundColor: "#080415",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 24,
  },
  card: { width: "22%", alignItems: "center", marginBottom: 8 },
  cardActive: { transform: [{ scale: 1.05 }] },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 6,
  },
  name: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "600", textAlign: "center" },
  nameActive: { color: "#00f5ff" },
});
