import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import Lucide from "@expo/vector-icons/Ionicons";
import type { DrawStroke } from "@/lib/createDraft";
import { STORY_DRAW_COLORS } from "@/components/stories/editor/storyEditorConstants";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type Props = {
  visible: boolean;
  canvasWidth: number;
  canvasHeight: number;
  initialStrokes?: DrawStroke[];
  onClose: () => void;
  onDone: (strokes: DrawStroke[]) => void;
};

type BrushTool = "fine" | "marker" | "neon" | "eraser";

export function StoryDrawOverlay({
  visible,
  canvasWidth,
  canvasHeight,
  initialStrokes = [],
  onClose,
  onDone,
}: Props) {
  const [strokes, setStrokes] = useState<DrawStroke[]>(initialStrokes);
  const [current, setCurrent] = useState<DrawStroke | null>(null);
  const [color, setColor] = useState("#ffffff");
  const [tool, setTool] = useState<BrushTool>("fine");
  const [brushSize, setBrushSize] = useState(0.35);

  const scaleX = canvasWidth / SCREEN_W;
  const scaleY = canvasHeight / SCREEN_H;

  const widthForTool = () => {
    const base = tool === "marker" ? 8 : tool === "neon" ? 5 : tool === "eraser" ? 12 : 3;
    return base * (0.6 + brushSize * 1.4);
  };

  const strokeColor = tool === "eraser" ? "rgba(0,0,0,0)" : color;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrent({
          points: [{ x: locationX * scaleX, y: locationY * scaleY }],
          color: strokeColor,
          width: widthForTool(),
        });
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrent((prev) =>
          prev
            ? {
                ...prev,
                points: [...prev.points, { x: locationX * scaleX, y: locationY * scaleY }],
              }
            : prev
        );
      },
      onPanResponderRelease: () => {
        setCurrent((prev) => {
          if (prev && prev.points.length > 1) {
            setStrokes((s) => [...s, prev]);
          }
          return null;
        });
      },
    })
  ).current;

  const previewScale = Math.min(SCREEN_W / canvasWidth, (SCREEN_H * 0.85) / canvasHeight);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.topTools}>
          {(
            [
              { id: "fine", icon: "brush" },
              { id: "marker", icon: "color-fill" },
              { id: "neon", icon: "sparkles" },
              { id: "eraser", icon: "eraser" },
            ] as const
          ).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.toolBtn, tool === t.id && styles.toolBtnActive]}
              onPress={() => setTool(t.id)}
            >
              <Lucide name={t.icon as any} size={22} color={tool === t.id ? "#111" : "#fff"} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.doneTop} onPress={() => onDone(strokes)}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>

        <View style={styles.sizeRail}>
          <View style={[styles.sizeThumb, { top: `${(1 - brushSize) * 80}%` }]} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={(e) => {
              const y = e.nativeEvent.locationY;
              setBrushSize(Math.max(0, Math.min(1, 1 - y / 120)));
            }}
          />
        </View>

        <View
          style={[
            styles.drawSurface,
            { width: canvasWidth * previewScale, height: canvasHeight * previewScale },
          ]}
          {...pan.panHandlers}
        >
          <Svg width="100%" height="100%">
            {[...strokes, ...(current ? [current] : [])].map((stroke, i) => (
              <Polyline
                key={`d_${i}`}
                points={stroke.points
                  .map((p) => `${p.x * previewScale},${p.y * previewScale}`)
                  .join(" ")}
                fill="none"
                stroke={stroke.color === "rgba(0,0,0,0)" ? "#000" : stroke.color}
                strokeWidth={stroke.width * previewScale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={stroke.color === "rgba(0,0,0,0)" ? 0 : 1}
              />
            ))}
          </Svg>
        </View>

        <View style={styles.colorRow}>
          <TouchableOpacity style={styles.eyedropper}>
            <Lucide name="color-wand" size={20} color="#fff" />
          </TouchableOpacity>
          {STORY_DRAW_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotOn]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  topTools: {
    position: "absolute",
    top: 56,
    left: 16,
    flexDirection: "row",
    gap: 10,
    zIndex: 10,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnActive: { backgroundColor: "rgba(255,255,255,0.95)" },
  doneTop: { position: "absolute", top: 56, right: 16, zIndex: 10 },
  doneText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  sizeRail: {
    position: "absolute",
    left: 8,
    top: "30%",
    width: 36,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    zIndex: 5,
  },
  sizeThumb: {
    position: "absolute",
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  drawSurface: {
    alignSelf: "center",
    marginTop: 100,
    backgroundColor: "transparent",
  },
  colorRow: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  eyedropper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotOn: { borderColor: "#fff" },
});
