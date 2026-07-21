import { useMemo } from "react";
import type { ProfileCatalogProduct } from "@/lib/profileApi";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";

type UseProfileCatalogOptions = {
  userProfiles: any[];
  products: any[];
  profileProducts: ProfileCatalogProduct[];
  profileProductsMode: "store" | "aggregated" | "empty";
  username: string;
  profileName: string;
  activeProfile: any;
  isPersonalProfile: boolean;
};

export function useProfileCatalog({
  userProfiles,
  products,
  profileProducts,
  profileProductsMode,
  username,
  profileName,
  activeProfile,
  isPersonalProfile,
}: UseProfileCatalogOptions) {
  const personalProfile =
    userProfiles.find((p) => p.type === "PERSONAL") ||
    userProfiles.find((p) => p.type !== "BUSINESS") ||
    userProfiles[0];

  const brandProfiles = userProfiles.filter((p) => p.type === "BUSINESS");

  const brandStoreOptions: BrandStoreOption[] = useMemo(
    () =>
      brandProfiles.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        maisonId: p.maisonId || p.username,
        logo: p.logo,
      })),
    [brandProfiles]
  );

  const displayProducts = useMemo((): ProfileCatalogProduct[] => {
    if (profileProducts.length > 0) {
      return profileProducts;
    }
    return products
      .filter(
        (p) =>
          p.maisonId === username ||
          p.maison?.id === username ||
          (username === "rare_raven" &&
            (p.maisonId === "rare_raven" || p.maison?.id === "rare_raven" || !p.maisonId))
      )
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        images: p.images || [],
        maisonId: p.maisonId,
        storeName: p.maison?.name || profileName,
        storeUsername: p.maisonId || username,
        storeProfileId: activeProfile?.type === "BUSINESS" ? activeProfile.id : null,
      })) as ProfileCatalogProduct[];
  }, [profileProducts, products, username, profileName, activeProfile?.id, activeProfile?.type]);

  const showStoreLabelsOnProducts = profileProductsMode === "aggregated" || isPersonalProfile;

  return {
    personalProfile,
    brandProfiles,
    brandStoreOptions,
    displayProducts,
    showStoreLabelsOnProducts,
  };
}
