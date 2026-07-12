import React, { useMemo } from "react";
import { LocationSearchPicker } from "@/components/shop/LocationSearchPicker";
import { countriesAsOptions } from "@/lib/worldLocations";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectIso: (isoCode: string) => void;
  title?: string;
};

/** Searchable world country list (~250 countries via country-state-city). */
export function CountrySearchPicker({
  visible,
  onClose,
  onSelectIso,
  title = "Select country",
}: Props) {
  const items = useMemo(() => countriesAsOptions(), []);

  return (
    <LocationSearchPicker
      visible={visible}
      title={title}
      items={items}
      searchPlaceholder="Search country or dial code"
      emptyText="No country found"
      onClose={onClose}
      onSelect={(item) => {
        onSelectIso(item.id);
        onClose();
      }}
    />
  );
}
