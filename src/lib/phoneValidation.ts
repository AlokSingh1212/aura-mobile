import {
  AsYouType,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneLengthInfo = {
  min: number;
  max: number;
  typical: number;
  hint: string;
};

/** ITU E.164 allows up to 15 digits including country code; national part is usually 7–11. */
const PHONE_LENGTH_HINTS: Partial<Record<CountryCode, PhoneLengthInfo>> = {
  IN: { min: 10, max: 10, typical: 10, hint: "10-digit mobile (starts with 6–9)" },
  US: { min: 10, max: 10, typical: 10, hint: "10-digit number" },
  CA: { min: 10, max: 10, typical: 10, hint: "10-digit number" },
  GB: { min: 10, max: 11, typical: 10, hint: "10–11 digit number" },
  AE: { min: 9, max: 9, typical: 9, hint: "9-digit mobile" },
  AU: { min: 9, max: 9, typical: 9, hint: "9-digit mobile" },
  SG: { min: 8, max: 8, typical: 8, hint: "8-digit number" },
  DE: { min: 10, max: 11, typical: 11, hint: "10–11 digit number" },
  FR: { min: 9, max: 9, typical: 9, hint: "9-digit number" },
  JP: { min: 10, max: 10, typical: 10, hint: "10-digit number" },
  CN: { min: 11, max: 11, typical: 11, hint: "11-digit mobile" },
  BR: { min: 10, max: 11, typical: 11, hint: "10–11 digit number" },
};

const DEFAULT_LENGTH: PhoneLengthInfo = {
  min: 7,
  max: 11,
  typical: 10,
  hint: "Usually 7–11 digits (varies by country)",
};

export function toCountryCode(iso?: string | null): CountryCode | undefined {
  if (!iso || iso.length !== 2) return undefined;
  return iso.toUpperCase() as CountryCode;
}

export function getPhoneLengthInfo(countryIso?: string | null): PhoneLengthInfo {
  const country = toCountryCode(countryIso);
  if (!country) return DEFAULT_LENGTH;
  return PHONE_LENGTH_HINTS[country] || DEFAULT_LENGTH;
}

/**
 * Stops extra digits while typing — uses libphonenumber length rules and
 * truncates once a valid national number would be extended with invalid digits.
 */
export function clampNationalPhoneInput(
  raw: string,
  countryIso?: string | null
): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  const country = toCountryCode(countryIso);
  if (!country) return digits.slice(0, 15);

  const hardMax = getPhoneLengthInfo(countryIso).max + 2;

  let best = "";
  let lastValid = "";

  for (let i = 1; i <= Math.min(digits.length, hardMax); i++) {
    const candidate = digits.slice(0, i);
    const lengthStatus = validatePhoneNumberLength(candidate, country);
    if (lengthStatus === "TOO_LONG") break;

    const parsed = parsePhoneNumberFromString(candidate, country);
    if (parsed?.isValid()) {
      lastValid = candidate;
    }
    best = candidate;
  }

  if (lastValid && best.length > lastValid.length) {
    const extendedValid = parsePhoneNumberFromString(best, country)?.isValid();
    if (!extendedValid) return lastValid;
  }

  const cap = getPhoneLengthInfo(countryIso).max;
  return best.slice(0, cap);
}

export function formatPhoneAsYouType(value: string, countryIso?: string | null): string {
  const country = toCountryCode(countryIso);
  const digits = clampNationalPhoneInput(value, countryIso);
  if (!country) return digits;
  const typer = new AsYouType(country);
  return typer.input(digits);
}

export function validatePhoneNumber(value: string, countryIso?: string | null): boolean {
  const digits = clampNationalPhoneInput(value, countryIso);
  if (!digits) return false;
  const country = toCountryCode(countryIso);
  if (!country) return digits.length >= 7 && digits.length <= 15;
  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.isValid() ?? false;
}

export function normalizeNationalPhone(value: string, countryIso?: string | null): string {
  const digits = clampNationalPhoneInput(value, countryIso);
  const country = toCountryCode(countryIso);
  if (!country) return digits;
  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.nationalNumber || digits;
}

export function phonePlaceholder(countryIso?: string | null): string {
  const info = getPhoneLengthInfo(countryIso);
  if (info.min === info.max) {
    return `${info.max}-digit number`;
  }
  return `${info.min}–${info.max} digits`;
}

export function phoneValidationHint(countryIso?: string | null): string {
  const info = getPhoneLengthInfo(countryIso);
  return `Enter a valid number: ${info.hint}.`;
}

export function formatPhoneDisplay(
  nationalNumber: string,
  dialCode?: string | null
): string {
  if (!nationalNumber) return "";
  return dialCode ? `${dialCode} ${nationalNumber}` : nationalNumber;
}
