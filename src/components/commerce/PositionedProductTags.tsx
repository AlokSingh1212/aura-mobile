import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import type { StickerLayer } from "@/lib/createDraft";
import type { ProductSticker } from "@/lib/postEditState";
import { parseStoryLayers } from "@/lib/storyLayers";
import {
  getStickerProducts,
  productLayersFromMetadata,
} from "@/lib/productTagUtils";
import { ShoppableProductTag } from "@/components/commerce/ShoppableProductTag";
import { ShoppableProductSheet } from "@/components/commerce/ShoppableProductSheet";

type Props = {
  postId?: string;
  storyLayers?: unknown;
  fallbackProducts?: ProductSticker[];
  canvasWidth?: number;
  canvasHeight?: number;
  userId?: string;
  showCommission?: boolean;
  onOpenProduct?: (productId: string) => void;
};

export function PositionedProductTags({
  storyLayers,
  fallbackProducts = [],
  canvasWidth = 1080,
  canvasHeight = 1920,
  showCommission = false,
  onOpenProduct,
}: Props) {
  const [layoutW, setLayoutW] = useState(0);
  const [sheetProducts, setSheetProducts] = useState<ReturnType<typeof getStickerProducts>>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const scale = layoutW > 0 ? layoutW / canvasWidth : 1;

  const productLayers = useMemo(() => {
    const parsed = parseStoryLayers(storyLayers);
    if (parsed.some((l) => l.type === "product")) {
      return parsed.filter((l) => l.type === "product");
    }
    return productLayersFromMetadata(storyLayers, fallbackProducts, canvasWidth, canvasHeight);
  }, [storyLayers, fallbackProducts, canvasWidth, canvasHeight]);

  if (!productLayers.length) return null;

  const openSheet = (layer: StickerLayer) => {
    const products = getStickerProducts(layer);
    if (!products.length) return;
    setSheetProducts(products);
    setSheetOpen(true);
  };

  return (
    <>
      <View
        style={styles.overlay}
        onLayout={(e: LayoutChangeEvent) => setLayoutW(e.nativeEvent.layout.width)}
        pointerEvents="box-none"
      >
        {productLayers.map((layer) => {
          const products = getStickerProducts(layer);
          if (!products.length) return null;
          const s = layer.scale * scale;
          return (
            <View
              key={layer.id}
              style={{
                position: "absolute",
                left: layer.x * scale,
                top: layer.y * scale,
                transform: [{ scale: s }],
                zIndex: 12,
              }}
            >
              <ShoppableProductTag
                products={products}
                showCommission={showCommission}
                onPress={() => openSheet(layer)}
              />
            </View>
          );
        })}
      </View>
      <ShoppableProductSheet
        visible={sheetOpen}
        products={sheetProducts}
        onClose={() => setSheetOpen(false)}
        onSelectProduct={(p) => {
          if (onOpenProduct) onOpenProduct(p.productId);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
  },
});
