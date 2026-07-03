import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const CLIP_W = 72;

import type { ClipSegment } from "@/lib/createDraft";
import { REEL_EFFECTS } from "@/constants/reelStudio";

type Props = {
  clips: ClipSegment[];
  activeClipId: string | null;
  onSelectClip: (id: string) => void;
  onAddClip: () => void;
  onRemoveClip: (id: string) => void;
  filterId?: string;
  onFilterChange?: (id: string) => void;
  maxClips?: number;
};

const REEL_FILTERS = REEL_EFFECTS.map((fx) => ({ id: fx.id, name: fx.name }));

export function ReelTimelineEditor({
  clips,
  activeClipId,
  onSelectClip,
  onAddClip,
  onRemoveClip,
  filterId = "none",
  onFilterChange,
  maxClips = 5,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.meta}>{clips.length} clip{clips.length === 1 ? "" : "s"} · baked on export</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clipRow}>
        {clips.map((clip, index) => {
          const active = clip.id === activeClipId;
          return (
            <TouchableOpacity
              key={clip.id}
              style={[styles.clipCard, active && styles.clipCardActive]}
              onPress={() => onSelectClip(clip.id)}
              onLongPress={() => clips.length > 1 && onRemoveClip(clip.id)}
            >
              <View style={styles.clipThumb}>
                <Lucide name="film" size={22} color={active ? "#00f5ff" : "#888"} />
              </View>
              <Text style={styles.clipIndex}>{index + 1}</Text>
              {clips.length > 1 ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveClip(clip.id)}>
                  <Lucide name="close" size={12} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        })}
        {clips.length < maxClips ? (
          <TouchableOpacity style={styles.addClip} onPress={onAddClip}>
            <Lucide name="add" size={28} color="#00f5ff" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {onFilterChange ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {REEL_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filterId === f.id && styles.filterChipActive]}
              onPress={() => onFilterChange(f.id)}
            >
              <Text style={[styles.filterText, filterId === f.id && styles.filterTextActive]}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <Text style={styles.hint}>Long-press a clip to remove · filters & music saved to exported video</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  clipRow: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: "center",
  },
  clipCard: {
    width: CLIP_W,
    alignItems: "center",
    position: "relative",
  },
  clipCardActive: {
    transform: [{ scale: 1.04 }],
  },
  clipThumb: {
    width: CLIP_W,
    height: CLIP_W * 1.4,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  clipIndex: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  removeBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
  },
  addClip: {
    width: CLIP_W,
    height: CLIP_W * 1.4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(0,245,255,0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    color: "#00f5ff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  filterRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    maxHeight: 40,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  filterChipActive: {
    backgroundColor: "rgba(0,245,255,0.15)",
    borderWidth: 1,
    borderColor: "#00f5ff",
  },
  filterText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#00f5ff",
  },
  hint: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});
