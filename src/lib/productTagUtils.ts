import type { StickerLayer, TaggedProduct } from "@/lib/createDraft";
import type { ProductSticker } from "@/lib/postEditState";

export type { TaggedProduct };

export function getStickerProducts(sticker: StickerLayer): TaggedProduct[] {
  if (sticker.meta?.products?.length) {
    return sticker.meta.products.map((p) => ({
      productId: p.productId,
      title: p.title,
      image: p.image,
      price: p.price,
    }));
  }
  if (sticker.meta?.productId) {
    return [
      {
        productId: sticker.meta.productId,
        title: sticker.text,
        image: sticker.meta.productImage || "",
        price: sticker.meta.productPrice,
      },
    ];
  }
  return [];
}

export function createProductTagSticker(
  products: ProductSticker[],
  canvasW: number,
  canvasH: number,
  position?: { x: number; y: number; scale?: number }
): StickerLayer {
  const tagged: TaggedProduct[] = products.map((p) => ({
    productId: p.productId,
    title: p.title,
    image: p.image,
    price: p.price,
  }));
  const lead = tagged[0];
  return {
    id: `pd_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: "product",
    text: lead?.title || "Products",
    x: position?.x ?? canvasW * 0.08,
    y: position?.y ?? canvasH * 0.62,
    scale: position?.scale ?? 1,
    meta: {
      products: tagged,
      productId: lead?.productId,
      productImage: lead?.image,
      productPrice: lead?.price,
    },
  };
}

export function mergeProductTagSticker(
  layers: StickerLayer[],
  products: ProductSticker[],
  canvasW: number,
  canvasH: number
): StickerLayer[] {
  const existing = layers.find((s) => s.type === "product");
  if (!existing) {
    return [...layers, createProductTagSticker(products, canvasW, canvasH)];
  }
  return layers.map((s) =>
    s.id === existing.id
      ? { ...createProductTagSticker(products, canvasW, canvasH, { x: s.x, y: s.y, scale: s.scale }), id: s.id }
      : s
  );
}

export function productLayersFromMetadata(
  storyLayers: unknown,
  fallbackProducts: ProductSticker[] = [],
  canvasW = 1080,
  canvasH = 1920
): StickerLayer[] {
  if (!Array.isArray(storyLayers)) {
    if (!fallbackProducts.length) return [];
    return [createProductTagSticker(fallbackProducts, canvasW, canvasH)];
  }
  const productStickers = (storyLayers as StickerLayer[]).filter((l) => l?.type === "product");
  if (productStickers.length) return productStickers;
  if (!fallbackProducts.length) return [];
  return [createProductTagSticker(fallbackProducts, canvasW, canvasH)];
}

export function allProductsFromLayers(layers: StickerLayer[]): ProductSticker[] {
  const out: ProductSticker[] = [];
  const seen = new Set<string>();
  for (const layer of layers) {
    if (layer.type !== "product") continue;
    for (const p of getStickerProducts(layer)) {
      if (seen.has(p.productId)) continue;
      seen.add(p.productId);
      out.push(p);
    }
  }
  return out;
}
