import type { ProfileLike } from "@/lib/sessionIdentity";

export type ManagedStore = {
  profileId: string | null;
  maisonId: string;
  name: string;
  username: string;
  logo: string | null;
};

/** Stores the signed-in user can operate (brand profiles + product maisons). */
export function listManagedStores(
  userProfiles: ProfileLike[],
  products: { maison?: { id?: string; name?: string; logo?: string }; maisonId?: string; title?: string }[] = [],
  preferredMaisonId?: string
): ManagedStore[] {
  const byMaison = new Map<string, ManagedStore>();

  for (const p of userProfiles) {
    if (p.type !== "BUSINESS") continue;
    const maisonId = (p.maisonId || p.username || "").trim();
    if (!maisonId) continue;
    byMaison.set(maisonId, {
      profileId: p.id || null,
      maisonId,
      name: p.name || p.username || maisonId,
      username: p.username || maisonId,
      logo: p.logo ?? null,
    });
  }

  for (const product of products) {
    const maisonId = (product.maison?.id || product.maisonId || "").trim();
    if (!maisonId || byMaison.has(maisonId)) continue;
    byMaison.set(maisonId, {
      profileId: null,
      maisonId,
      name: product.maison?.name || maisonId,
      username: maisonId,
      logo: product.maison?.logo ?? null,
    });
  }

  const stores = Array.from(byMaison.values());
  if (preferredMaisonId) {
    stores.sort((a, b) => {
      if (a.maisonId === preferredMaisonId) return -1;
      if (b.maisonId === preferredMaisonId) return 1;
      return a.name.localeCompare(b.name);
    });
  } else {
    stores.sort((a, b) => a.name.localeCompare(b.name));
  }
  return stores;
}

export function resolveManagedStore(
  stores: ManagedStore[],
  maisonId: string | undefined
): ManagedStore | null {
  if (!stores.length) return null;
  if (maisonId) {
    const hit = stores.find((s) => s.maisonId === maisonId);
    if (hit) return hit;
  }
  return stores[0];
}
