import { uploadMediaFromUri } from "@/lib/uploadMedia";
import {
  buildVariantsFromSelections,
  type ResolvedProductForm,
} from "@/lib/productCategories";

import type { ProductMediaItem } from "@/lib/createMediaPicker";

export interface PublishProductPayload {
  maisonId: string;
  profileId: string;
  userId: string;
  title: string;
  price: number;
  description?: string;
  form: ResolvedProductForm;
  attributeValues: Record<string, string | string[]>;
  selectedSizes: string[];
  selectedColors: string[];
  stockPerVariant: number;
  media: ProductMediaItem[];
  returnPolicy?: "RETURN" | "EXCHANGE";
}

export interface PublishProductResult {
  success: boolean;
  artifactId?: string;
  error?: string;
}

function isVideoUri(uri: string): boolean {
  return /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(uri) || uri.includes("video");
}

export async function uploadProductMedia(
  media: ProductMediaItem[]
): Promise<{ images: string[]; videoUrl?: string }> {
  const images: string[] = [];
  let videoUrl: string | undefined;

  for (const item of media) {
    const isVideo = item.type === "video" || isVideoUri(item.uri);
    const url = await uploadMediaFromUri(item.uri, isVideo ? "reel" : "post");
    if (isVideo) {
      if (!videoUrl) videoUrl = url;
      else images.push(url);
    } else {
      images.push(url);
    }
  }

  if (!images.length && videoUrl) {
    images.push(videoUrl);
  }

  return { images, videoUrl };
}

export async function buildProductCreatePayload(
  input: PublishProductPayload
): Promise<Record<string, unknown>> {
  const { images, videoUrl } = await uploadProductMedia(input.media);
  const variants = buildVariantsFromSelections(
    input.form,
    input.selectedSizes,
    input.selectedColors,
    input.price,
    input.stockPerVariant
  );

  return {
    maisonId: input.maisonId,
    profileId: input.profileId,
    userId: input.userId,
    title: input.title.trim(),
    price: input.price,
    vibe: input.form.vibeDefault,
    type: input.form.artifactType,
    description: input.description?.trim() || undefined,
    images,
    videoUrl: videoUrl || undefined,
    arMetadata: {
      categoryId: input.form.categoryId,
      categoryLabel: input.form.categoryLabel,
      subcategoryId: input.form.subcategoryId,
      subcategoryLabel: input.form.subcategoryLabel,
      attributes: input.attributeValues,
      sizes: input.selectedSizes,
      colors: input.selectedColors,
    },
    variants,
    returnPolicy: input.returnPolicy === "EXCHANGE" ? "EXCHANGE" : "RETURN",
  };
}
