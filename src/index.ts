import { friendlyFormatIBAN } from 'ibantools';
import { getCountryConfig, isCountrySupported } from './countries';
import { getCurrencyConfig } from './currencies';
import { normaliseValue, validators } from './validators';
import type { BankValues, FieldConfig, ValidationResult } from './types';

export { getCountryConfig, getConfiguredCountries, isCountrySupported, FALLBACK_CONFIG } from './countries';
export { isValidAbaRouting, isValidClabe, isValidIbanChecksum } from './validators';
export type * from './types';
export { SUPPORTED_CURRENCIES, isCurrencySupported, getCurrencyConfig, getBankFieldsForCurrency } from './currencies';

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
  if (!isCountrySupported(country)) {
    return { valid: false, errors: { country: 'Payouts to this country are not supported.' }, normalised: {} };
  }
  return validateFields(config.fields, values, config.name);
}

/** Shared by the country and currency entry points. `where` names the place in IBAN prefix errors. */
export function validateFields(fields: FieldConfig[], values: BankValues, where: string): ValidationResult {
  const normalised: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    normalised[field.key] = normaliseValue((values[field.key] ?? '').toString(), field.normalise);
  }

  for (const field of fields) {
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
      errors[field.key] = `IBANs for ${where} start with ${field.ibanCountry}.`;
    } else if (field.ibanCountries && !field.ibanCountries.includes(value.slice(0, 2))) {
      errors[field.key] = `IBANs for ${where} must be from a ${where} country.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, normalised };
}

/** Validates bank details for a currency's local rail. Same behaviour as validateBankDetails. */
export function validateBankDetailsForCurrency(currency: string, values: BankValues): ValidationResult {
  const config = getCurrencyConfig(currency);
  return validateFields(config.fields, values, config.country === null ? 'SEPA' : config.country);
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
  return maskFields(getCountryConfig(country).fields, stored);
}

export function maskFields(fields: FieldConfig[], stored: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
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

/** Masks sensitive fields for a currency's local rail layout. */
export function maskBankDetailsForCurrency(
  currency: string,
  stored: Record<string, string>,
): Record<string, string> {
  return maskFields(getCurrencyConfig(currency).fields, stored);
}
