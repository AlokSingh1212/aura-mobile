import { City, Country, State, type ICity, type ICountry, type IState } from "country-state-city";
import type { ShippingAddress } from "@/lib/shopAddress";

export type LocationOption = {
  id: string;
  label: string;
  subtitle?: string;
};

export type PostalCodeRule = {
  label: string;
  placeholder: string;
  maxLength: number;
  pattern?: RegExp;
  keyboard: "default" | "number-pad";
};

const POSTAL_RULES: Record<string, PostalCodeRule> = {
  IN: {
    label: "Pincode",
    placeholder: "6-digit pincode",
    maxLength: 6,
    pattern: /^\d{6}$/,
    keyboard: "number-pad",
  },
  US: {
    label: "ZIP code",
    placeholder: "5 or 9 digit ZIP",
    maxLength: 10,
    pattern: /^\d{5}(-\d{4})?$/,
    keyboard: "number-pad",
  },
  GB: {
    label: "Postcode",
    placeholder: "e.g. SW1A 1AA",
    maxLength: 8,
    keyboard: "default",
  },
  CA: {
    label: "Postal code",
    placeholder: "e.g. K1A 0B1",
    maxLength: 7,
    keyboard: "default",
  },
  AU: {
    label: "Postcode",
    placeholder: "4-digit postcode",
    maxLength: 4,
    pattern: /^\d{4}$/,
    keyboard: "number-pad",
  },
  AE: {
    label: "Postal code",
    placeholder: "Optional",
    maxLength: 10,
    keyboard: "number-pad",
  },
};

const DEFAULT_POSTAL: PostalCodeRule = {
  label: "Postal code",
  placeholder: "Postal / ZIP code",
  maxLength: 12,
  keyboard: "default",
};

let countriesCache: ICountry[] | null = null;

export function getAllCountries(): ICountry[] {
  if (!countriesCache) {
    countriesCache = Country.getAllCountries().sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
  return countriesCache;
}

export function getCountryByIso(iso?: string | null): ICountry | undefined {
  if (!iso) return undefined;
  return getAllCountries().find((c) => c.isoCode === iso);
}

export function getStatesForCountry(countryIso?: string | null): IState[] {
  if (!countryIso) return [];
  return State.getStatesOfCountry(countryIso).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getStateByIso(countryIso?: string | null, stateIso?: string | null): IState | undefined {
  if (!countryIso || !stateIso) return undefined;
  return getStatesForCountry(countryIso).find((s) => s.isoCode === stateIso);
}

export function getCitiesForState(
  countryIso?: string | null,
  stateIso?: string | null
): ICity[] {
  if (!countryIso || !stateIso) return [];
  return City.getCitiesOfState(countryIso, stateIso).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getCitiesForCountry(countryIso?: string | null): ICity[] {
  if (!countryIso) return [];
  const fn = (City as { getCitiesOfCountry?: (iso: string) => ICity[] }).getCitiesOfCountry;
  if (!fn) return [];
  return fn(countryIso).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCitiesForAddress(
  countryIso?: string | null,
  stateIso?: string | null
): ICity[] {
  if (!countryIso) return [];
  if (stateIso) return getCitiesForState(countryIso, stateIso);
  if (getStatesForCountry(countryIso).length === 0) {
    return getCitiesForCountry(countryIso);
  }
  return [];
}

export function dialCodeForCountry(country?: ICountry | null): string {
  if (!country?.phonecode) return "+91";
  const code = String(country.phonecode).replace(/^\+/, "");
  return `+${code}`;
}

export function countriesAsOptions(query = ""): LocationOption[] {
  const q = query.trim().toLowerCase();
  return getAllCountries()
    .filter((c) => {
      if (!q) return true;
      const dial = dialCodeForCountry(c);
      return (
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        dial.includes(q) ||
        c.phonecode.includes(q.replace("+", ""))
      );
    })
    .map((c) => ({
      id: c.isoCode,
      label: `${c.flag} ${c.name}`,
      subtitle: dialCodeForCountry(c),
    }));
}

export function statesAsOptions(countryIso?: string | null, query = ""): LocationOption[] {
  const q = query.trim().toLowerCase();
  return getStatesForCountry(countryIso)
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.isoCode.toLowerCase().includes(q))
    .map((s) => ({
      id: s.isoCode,
      label: s.name,
      subtitle: s.isoCode,
    }));
}

export function citiesAsOptions(
  countryIso?: string | null,
  stateIso?: string | null,
  query = ""
): LocationOption[] {
  const q = query.trim().toLowerCase();
  return getCitiesForAddress(countryIso, stateIso)
    .filter((c) => !q || c.name.toLowerCase().includes(q))
    .map((c) => ({
      id: `${c.stateCode || "na"}-${c.name}`,
      label: c.name,
    }));
}

export function getPostalCodeRule(countryIso?: string | null): PostalCodeRule {
  if (!countryIso) return DEFAULT_POSTAL;
  return POSTAL_RULES[countryIso] || DEFAULT_POSTAL;
}

export function validatePostalCode(value: string, countryIso?: string | null): boolean {
  const clean = value.trim();
  if (!clean) {
    return countryIso === "AE";
  }
  const rule = getPostalCodeRule(countryIso);
  if (rule.pattern) return rule.pattern.test(clean);
  return clean.length >= 3 && clean.length <= rule.maxLength;
}

export function applyCountrySelection(
  countryIso: string,
  current?: Partial<ShippingAddress>
): Partial<ShippingAddress> {
  const country = getCountryByIso(countryIso);
  if (!country) return current || {};
  return {
    ...current,
    countryIso: country.isoCode,
    country: country.name,
    countryCode: dialCodeForCountry(country),
    state: "",
    stateIso: "",
    city: "",
    postalCode: current?.postalCode || "",
  };
}

export function applyStateSelection(
  countryIso: string,
  stateIso: string,
  current?: Partial<ShippingAddress>
): Partial<ShippingAddress> {
  const state = getStateByIso(countryIso, stateIso);
  if (!state) return current || {};
  return {
    ...current,
    stateIso: state.isoCode,
    state: state.name,
    city: "",
  };
}

export function applyCitySelection(
  cityName: string,
  current?: Partial<ShippingAddress>
): Partial<ShippingAddress> {
  return {
    ...current,
    city: cityName,
  };
}
