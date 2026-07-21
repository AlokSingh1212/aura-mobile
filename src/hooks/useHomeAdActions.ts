import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { API_HOST } from "@/constants/api";

type ProductSheetItem = {
  id: string;
  title: string;
  image: string;
  price: number;
};

type UseHomeAdActionsOptions = {
  products: any[];
  currentUser: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

function mapProductsForSheet(items: any[]): ProductSheetItem[] {
  return items.map((p: any) => ({
    id: p.id,
    title: p.title || p.name,
    image: p.images?.[0] || p.image || "",
    price: p.price || 0,
  }));
}

export function useHomeAdActions({ products, currentUser, triggerHaptic }: UseHomeAdActionsOptions) {
  const [browserModalVisible, setBrowserModalVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState("");
  const [productsSheetVisible, setProductsSheetVisible] = useState(false);
  const [productsSheetItems, setProductsSheetItems] = useState<ProductSheetItem[]>([]);

  const handleAdCtaPress = useCallback(
    async (ctaType: string, metadata: any) => {
      if (metadata.creativeId) {
        try {
          await fetch(`${API_HOST}/api/mobile/ads/click`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creativeId: metadata.creativeId,
              userId: currentUser?.id,
              cpcPrice: metadata.cpcPrice,
            }),
          });
        } catch (err) {
          console.warn("Ad click tracking failed:", err);
        }
      }

      switch (ctaType) {
        case "APPLY_NOW":
        case "LEARN_MORE":
        case "SIGN_UP":
          if (metadata.targetUrl) {
            setBrowserUrl(metadata.targetUrl);
            setBrowserModalVisible(true);
          }
          break;
        case "SHOP_NOW":
          if (metadata.associatedProducts?.length > 0) {
            const matchedProducts = products.filter((p: any) =>
              metadata.associatedProducts.includes(p.id)
            );
            setProductsSheetItems(
              matchedProducts.length > 0
                ? mapProductsForSheet(matchedProducts)
                : mapProductsForSheet(products.slice(0, 6))
            );
            setProductsSheetVisible(true);
          } else {
            setProductsSheetItems(mapProductsForSheet(products.slice(0, 6)));
            setProductsSheetVisible(true);
          }
          break;
        case "FOLLOW":
          triggerHaptic("heavy");
          Alert.alert("Followed!", "You are now following this brand.");
          break;
        default:
          if (metadata.targetUrl) {
            setBrowserUrl(metadata.targetUrl);
            setBrowserModalVisible(true);
          }
          break;
      }
    },
    [currentUser?.id, products, triggerHaptic]
  );

  return {
    browserModalVisible,
    setBrowserModalVisible,
    browserUrl,
    setBrowserUrl,
    productsSheetVisible,
    setProductsSheetVisible,
    productsSheetItems,
    setProductsSheetItems,
    handleAdCtaPress,
  };
}
