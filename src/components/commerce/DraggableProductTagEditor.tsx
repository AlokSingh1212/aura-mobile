import React, { useEffect, useRef } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import type { ProductSticker } from "@/lib/postEditState";
import { ShoppableProductTag } from "@/components/commerce/ShoppableProductTag";

type Props = {
  products: ProductSticker[];
  canvasW: number;
  canvasH: number;
  x: number;
  y: number;
  scale?: number;
  onMove: (x: number, y: number) => void;
};

export function DraggableProductTagEditor({
  products,
  canvasW,
  canvasH,
  x,
  y,
  scale = 1,
  onMove,
}: Props) {
  const [layoutW, setLayoutW] = React.useState(0);
  const viewScale = layoutW > 0 ? layoutW / canvasW : 1;
  const posRef = useRef({ x, y });

  useEffect(() => {
    posRef.current = { x, y };
  }, [x, y]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const start = posRef.current;
        const nx = Math.max(0, Math.min(canvasW - 60, start.x + g.dx / viewScale));
        const ny = Math.max(0, Math.min(canvasH - 120, start.y + g.dy / viewScale));
        onMove(nx, ny);
      },
      onPanResponderRelease: (_, g) => {
        const start = posRef.current;
        const nx = Math.max(0, Math.min(canvasW - 60, start.x + g.dx / viewScale));
        const ny = Math.max(0, Math.min(canvasH - 120, start.y + g.dy / viewScale));
        posRef.current = { x: nx, y: ny };
        onMove(nx, ny);
      },
    })
  ).current;

  if (!products.length) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}
      pointerEvents="box-none"
    >
      <View
        style={{
          position: "absolute",
          left: x * viewScale,
          top: y * viewScale,
          transform: [{ scale }],
          zIndex: 20,
        }}
        {...pan.panHandlers}
      >
        <ShoppableProductTag products={products} />
      </View>
    </View>
  );
}
