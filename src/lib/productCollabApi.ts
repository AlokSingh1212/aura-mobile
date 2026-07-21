import { API_HOST } from "@/constants/api";
import { authHeaders } from "@/lib/apiClient";
import type { ProfileCatalogProduct } from "@/lib/profileApi";

export type ProductCollabAction = "accept" | "decline";

export type ProductCollabProduct = ProfileCatalogProduct & {
  collabId?: string;
  commissionRate?: number;
  affiliateCode?: string | null;
};

export async function fetchProductCollabForArtifact(opts: {
  profileId: string;
  artifactId: string;
  userId?: string;
  status?: string;
}): Promise<ProductCollabProduct | null> {
  const params = new URLSearchParams({
    profileId: opts.profileId,
    artifactId: opts.artifactId,
    status: opts.status || "ACCEPTED",
  });
  if (opts.userId) params.set("userId", opts.userId);

  const res = await fetch(`${API_HOST}/api/mobile/product-collab?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success || !Array.isArray(data.products) || !data.products.length) return null;

  const p = data.products[0];
  return {
    id: p.productId || p.id,
    collabId: p.id,
    title: p.title,
    price: p.price,
    images: p.images || [],
    vibe: p.vibe,
    maisonId: p.maisonId,
    storeName: p.storeName || p.maisonId,
    storeUsername: p.maisonId,
    storeProfileId: null,
    commissionRate: p.commissionRate,
    affiliateCode: p.affiliateCode,
  };
}

export async function fetchProductCollabs(opts: {
  userId?: string;
  profileId?: string;
  status?: string;
}): Promise<ProductCollabProduct[]> {
  const params = new URLSearchParams();
  if (opts.userId) params.set("userId", opts.userId);
  if (opts.profileId) params.set("profileId", opts.profileId);
  if (opts.status) params.set("status", opts.status);

  const res = await fetch(`${API_HOST}/api/mobile/product-collab?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success || !Array.isArray(data.products)) return [];

  return data.products.map((p: any) => ({
    id: p.productId || p.id,
    collabId: p.id,
    title: p.title,
    price: p.price,
    images: p.images || [],
    vibe: p.vibe,
    maisonId: p.maisonId,
    storeName: p.storeName || p.maisonId,
    storeUsername: p.maisonId,
    storeProfileId: null,
    commissionRate: p.commissionRate,
    affiliateCode: p.affiliateCode,
  }));
}

export async function requestProductCollabApi(opts: {
  userId: string;
  profileId: string;
  artifactId: string;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/product-collab`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      profileId: opts.profileId,
      artifactId: opts.artifactId,
      action: "request",
    }),
  });
  return res.json();
}

export async function respondProductCollabApi(opts: {
  userId: string;
  profileId: string;
  collabId: string;
  respondAction: ProductCollabAction;
}) {
  const res = await fetch(`${API_HOST}/api/mobile/product-collab`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      userId: opts.userId,
      profileId: opts.profileId,
      collabId: opts.collabId,
      action: "respond",
      respondAction: opts.respondAction,
    }),
  });
  return res.json();
}

export function confirmProductCollabAction(action: ProductCollabAction): Promise<boolean> {
  return new Promise((resolve) => {
    const { Alert } = require("react-native");
    Alert.alert(
      action === "accept" ? "Accept product collab?" : "Decline product collab?",
      action === "accept"
        ? "You'll earn commission after the return window once orders are delivered."
        : "You won't earn commission on this product.",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: action === "accept" ? "Accept" : "Decline",
          style: action === "accept" ? "default" : "destructive",
          onPress: () => resolve(true),
        },
      ]
    );
  });
}

export async function respondProductCollabWithConfirmation(opts: {
  userId: string;
  profileId: string;
  collabId: string;
  respondAction: ProductCollabAction;
}) {
  const confirmed = await confirmProductCollabAction(opts.respondAction);
  if (!confirmed) return { success: false, error: "cancelled" };
  const data = await respondProductCollabApi(opts);
  if (!data.success) {
    const { Alert } = require("react-native");
    Alert.alert("Product collab", data.error || "Could not update invite.");
  }
  return data;
}
