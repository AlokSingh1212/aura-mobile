import React, { useState, useEffect } from "react";
import { PostProductSheet } from "@/components/create/PostProductSheet";
import type { BrandStoreOption } from "@/components/profile/AddProductSheet";
import type { ProductSticker } from "@/lib/postEditState";

type Props = {
  visible: boolean;
  userId: string;
  brandStores: BrandStoreOption[];
  initialSelected?: ProductSticker[];
  onClose: () => void;
  onPickProducts: (products: ProductSticker[]) => void;
};

export function StoryProductPicker({
  visible,
  userId,
  brandStores,
  initialSelected = [],
  onClose,
  onPickProducts,
}: Props) {
  const [selected, setSelected] = useState<ProductSticker[]>(initialSelected);

  useEffect(() => {
    if (visible) setSelected(initialSelected);
  }, [visible, initialSelected]);

  return (
    <PostProductSheet
      visible={visible}
      brandStores={brandStores}
      userId={userId}
      selected={selected}
      onClose={onClose}
      onChange={setSelected}
      onDone={() => {
        if (selected.length) onPickProducts(selected);
        onClose();
      }}
    />
  );
}
