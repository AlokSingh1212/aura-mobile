import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { SHOP } from "@/theme/shopTheme";
import { LocationSearchPicker } from "@/components/shop/LocationSearchPicker";
import type { ShippingAddress } from "@/lib/shopAddress";
import {
  applyCitySelection,
  applyCountrySelection,
  applyStateSelection,
  citiesAsOptions,
  countriesAsOptions,
  getPostalCodeRule,
  getStatesForCountry,
  statesAsOptions,
  validatePostalCode,
} from "@/lib/worldLocations";
import {
  clampNationalPhoneInput,
  formatPhoneAsYouType,
  normalizeNationalPhone,
  phonePlaceholder,
  phoneValidationHint,
  validatePhoneNumber,
  getPhoneLengthInfo,
} from "@/lib/phoneValidation";

type Props = {
  value: ShippingAddress;
  onChange: (next: ShippingAddress) => void;
  error?: string;
  onErrorChange?: (message: string) => void;
};

export function AddressFormFields({ value, onChange, error, onErrorChange }: Props) {
  const [picker, setPicker] = useState<"country" | "state" | "city" | null>(null);

  const postalRule = getPostalCodeRule(value.countryIso);
  const countryOptions = useMemo(() => countriesAsOptions(), []);
  const stateOptions = useMemo(
    () => statesAsOptions(value.countryIso),
    [value.countryIso]
  );
  const hasStates = stateOptions.length > 0;
  const cityOptions = useMemo(
    () => citiesAsOptions(value.countryIso, hasStates ? value.stateIso : undefined),
    [value.countryIso, value.stateIso, hasStates]
  );

  const setField = (patch: Partial<ShippingAddress>) => {
    onChange({ ...value, ...patch });
    onErrorChange?.("");
  };

  const handlePhoneChange = (raw: string) => {
    setField({ phone: clampNationalPhoneInput(raw, value.countryIso) });
  };

  const phoneLength = getPhoneLengthInfo(value.countryIso);

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={value.name || ""}
          onChangeText={(name) => setField({ name })}
          placeholder="Your name"
          placeholderTextColor={SHOP.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Country / region</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setPicker("country")}>
          <Text style={[styles.pickerText, !value.country && styles.placeholder]}>
            {value.country ? `${value.country} (${value.countryCode})` : "Select country"}
          </Text>
          <Lucide name="chevron-down" size={18} color={SHOP.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.dialBtn} onPress={() => setPicker("country")}>
            <Text style={styles.dialText}>{value.countryCode || "+91"}</Text>
            <Lucide name="chevron-down" size={12} color={SHOP.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={formatPhoneAsYouType(value.phone || "", value.countryIso)}
            onChangeText={handlePhoneChange}
            placeholder={phonePlaceholder(value.countryIso)}
            placeholderTextColor={SHOP.textMuted}
            keyboardType="phone-pad"
            maxLength={phoneLength.max + 4}
          />
        </View>
        <Text style={styles.hint}>
          {phoneValidationHint(value.countryIso)}
          {value.phone
            ? ` (${String(value.phone).replace(/\D/g, "").length}/${phoneLength.max} digits)`
            : ""}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Street address</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={value.address || ""}
          onChangeText={(address) => setField({ address })}
          placeholder="House no., street, area"
          placeholderTextColor={SHOP.textMuted}
          multiline
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>State / province</Text>
        {hasStates ? (
          <TouchableOpacity
            style={[styles.pickerBtn, !value.countryIso && styles.pickerDisabled]}
            onPress={() => value.countryIso && setPicker("state")}
            disabled={!value.countryIso}
          >
            <Text style={[styles.pickerText, !value.state && styles.placeholder]}>
              {value.state || "Select state"}
            </Text>
            <Lucide name="chevron-down" size={18} color={SHOP.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.input}
            value={value.state || ""}
            onChangeText={(state) => setField({ state, stateIso: "" })}
            placeholder="Optional for this country"
            placeholderTextColor={SHOP.textMuted}
          />
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        {cityOptions.length > 0 ? (
          <TouchableOpacity
            style={[
              styles.pickerBtn,
              hasStates && !value.stateIso && styles.pickerDisabled,
            ]}
            onPress={() => (!hasStates || value.stateIso) && setPicker("city")}
            disabled={hasStates && !value.stateIso}
          >
            <Text style={[styles.pickerText, !value.city && styles.placeholder]}>
              {value.city || "Select city"}
            </Text>
            <Lucide name="chevron-down" size={18} color={SHOP.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.input}
            value={value.city || ""}
            onChangeText={(city) => setField({ city })}
            placeholder={hasStates ? "Select state first" : "Enter city"}
            placeholderTextColor={SHOP.textMuted}
            editable={hasStates ? Boolean(value.stateIso) : true}
          />
        )}
        {cityOptions.length > 0 ? (
          <Text style={styles.hint}>{cityOptions.length.toLocaleString()} cities available</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{postalRule.label}</Text>
        <TextInput
          style={styles.input}
          value={value.postalCode || ""}
          onChangeText={(postalCode) => setField({ postalCode })}
          placeholder={postalRule.placeholder}
          placeholderTextColor={SHOP.textMuted}
          keyboardType={postalRule.keyboard}
          maxLength={postalRule.maxLength}
          autoCapitalize="characters"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <LocationSearchPicker
        visible={picker === "country"}
        title="Select country"
        items={countryOptions}
        searchPlaceholder="Search country or dial code"
        emptyText="No country found"
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          const next = applyCountrySelection(item.id, value) as ShippingAddress;
          next.phone = clampNationalPhoneInput(value.phone || "", item.id);
          onChange(next);
          onErrorChange?.("");
        }}
      />

      <LocationSearchPicker
        visible={picker === "state"}
        title="Select state / province"
        items={stateOptions}
        searchPlaceholder="Search state"
        emptyText="No state found"
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          onChange(applyStateSelection(value.countryIso || "", item.id, value) as ShippingAddress);
          onErrorChange?.("");
        }}
      />

      <LocationSearchPicker
        visible={picker === "city"}
        title="Select city"
        items={cityOptions}
        searchPlaceholder="Search city"
        emptyText="No city found"
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          onChange(applyCitySelection(item.label, value) as ShippingAddress);
          onErrorChange?.("");
        }}
      />
    </>
  );
}

function hasStatesForCountry(countryIso?: string | null): boolean {
  return getStatesForCountry(countryIso).length > 0;
}

export function validateAddressForm(value: ShippingAddress): string | null {
  if (!value.name?.trim()) return "Enter your full name.";
  if (!value.countryIso || !value.country) return "Select a country.";
  if (!value.phone?.trim()) return "Enter your mobile number.";
  if (!validatePhoneNumber(value.phone, value.countryIso)) {
    return phoneValidationHint(value.countryIso);
  }
  if (!value.address?.trim()) return "Enter your street address.";
  if (hasStatesForCountry(value.countryIso) && !value.state?.trim()) {
    return "Select your state.";
  }
  if (!value.city?.trim()) return "Select or enter your city.";
  const postalLabel = getPostalCodeRule(value.countryIso).label.toLowerCase();
  if (value.countryIso !== "AE" && !value.postalCode?.trim()) {
    return `Enter your ${postalLabel}.`;
  }
  if (value.postalCode?.trim() && !validatePostalCode(value.postalCode, value.countryIso)) {
    return `Enter a valid ${postalLabel}.`;
  }
  return null;
}

export function normalizeAddressForm(value: ShippingAddress): ShippingAddress {
  return {
    ...value,
    name: value.name?.trim(),
    address: value.address?.trim(),
    city: value.city?.trim(),
    state: value.state?.trim(),
    postalCode: value.postalCode?.trim().toUpperCase(),
    phone: normalizeNationalPhone(value.phone || "", value.countryIso),
  };
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  label: { fontSize: 12, color: SHOP.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: SHOP.text,
    backgroundColor: SHOP.surface,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  pickerBtn: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: SHOP.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerDisabled: { opacity: 0.55 },
  pickerText: { fontSize: 14, color: SHOP.text, flex: 1, marginRight: 8 },
  placeholder: { color: SHOP.textMuted },
  phoneRow: { flexDirection: "row", gap: 8 },
  dialBtn: {
    borderWidth: 1,
    borderColor: SHOP.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: SHOP.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 84,
    justifyContent: "center",
    paddingVertical: 10,
  },
  dialText: { fontSize: 14, fontWeight: "700", color: SHOP.text },
  phoneInput: { flex: 1 },
  hint: { fontSize: 11, color: SHOP.textMuted, marginTop: 4 },
  error: { color: SHOP.red, fontSize: 12, marginTop: 12 },
});
