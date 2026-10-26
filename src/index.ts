import { friendlyFormatIBAN } from 'ibantools';
import { getCountryConfig } from './countries';
import { normaliseValue, validators } from './validators';
import type { BankValues, FieldConfig, ValidationResult } from './types';

export { getCountryConfig, getConfiguredCountries, FALLBACK_CONFIG } from './countries';
export { isValidAbaRouting, isValidClabe, isValidIbanChecksum } from './validators';
export type * from './types';

/** Fields to render for a country. The form is driven entirely by this. */
export function getBankFields(country: string): FieldConfig[] {
  return getCountryConfig(country).fields;
}

/** Only AU bank details are accepted by Xero. Skip the bank field sync for everything else. */
export function isXeroSyncable(country: string): boolean {
  return getCountryConfig(country).xeroSyncable;
}

/**
 * Validates and normalises bank details for a country. Run the same call in the
 * browser and on the server. Values for fields the country does not use are
 * dropped from `normalised`.
 */
export function validateBankDetails(country: string, values: BankValues): ValidationResult {
  const config = getCountryConfig(country);
  const normalised: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of config.fields) {
    normalised[field.key] = normaliseValue((values[field.key] ?? '').toString(), field.normalise);
  }

  for (const field of config.fields) {
    const value = normalised[field.key];

    if (value === '') {
      const required =
        field.required && !(field.requiredUnless ?? []).some((k) => normalised[k] !== '');
      if (required) errors[field.key] = `${field.label} is required.`;
      continue;
    }

    const failsPattern = field.pattern !== undefined && !field.pattern.test(value);
    const failsValidator = field.validate !== undefined && !validators[field.validate](value);
    if (failsPattern || failsValidator) {
      errors[field.key] = field.errorMessage;
      continue;
    }

    if (field.ibanCountry && !value.startsWith(field.ibanCountry)) {
      errors[field.key] = `IBANs for ${config.name} start with ${field.ibanCountry}.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, normalised };
}

/** Keeps the last 4 characters of a value, for example "•••• 5678". */
export function maskValue(value: string): string {
  return value.length <= 4 ? '••••' : `•••• ${value.slice(-4)}`;
}

/**
 * Masks sensitive fields (last 4 only) for display after saving. Never log or
 * return the unmasked values to roles that are not allowed to see them.
 */
export function maskBankDetails(
  country: string,
  stored: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of getCountryConfig(country).fields) {
    const value = stored[field.key];
    if (!value) continue;
    out[field.key] = field.sensitive ? maskValue(value) : value;
  }
  return out;
}

/** Display format for an IBAN, for example "GB82 WEST 1234 5698 7654 32". */
export function formatIbanForDisplay(iban: string): string {
  return friendlyFormatIBAN(iban) ?? iban;
}
