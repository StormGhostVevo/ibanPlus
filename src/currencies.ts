import { accountNumberField, bankNameField, bicField, digitsField, getCountryConfig, ibanField, withPlaceholders } from './countries';
import type { CountryConfig, CurrencyCode, CurrencyConfig, FieldConfig } from './types';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'AUD', 'SGD', 'CAD', 'EUR', 'GBP', 'THB'];

export function isCurrencySupported(currency: string): boolean {
  return (SUPPORTED_CURRENCIES as string[]).includes(currency.toUpperCase());
}

const recipientNameField = (): FieldConfig => ({
  key: 'recipientName',
  label: 'Recipient name',
  helpText: 'The account holder, exactly as it appears on the bank account.',
  placeholder: 'Full name or company name',
  required: true,
  pattern: /\S/,
  errorMessage: 'Enter the name of the account holder.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 140,
  sensitive: false,
});

const addressField = (): FieldConfig => ({
  key: 'address',
  label: 'Address',
  helpText: 'Recipient address: street, city, state or region, postcode and country.',
  placeholder: 'Unit 1, 123 Example Street, City, State, 1234, Country',
  required: true,
  pattern: /\S/,
  errorMessage: 'Enter the recipient address.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 200,
  sensitive: false,
});

/** Recipient name first, bank name next, the local rail identifiers, then the address. */
const withCommonFields = (rail: FieldConfig[]): FieldConfig[] => [
  recipientNameField(),
  bankNameField(),
  ...rail,
  addressField(),
];

/** Local rail fields of a country config, leaving out its own bank name and any IBAN alternative. */
const railFieldsOf = (country: string): FieldConfig[] =>
  getCountryConfig(country).fields.filter((f) => f.key !== 'bankName' && f.key !== 'iban');

/**
 * SEPA credit transfer countries. EU, EEA, Switzerland, UK, Monaco, San Marino, Vatican City and Andorra.
 * Not checked against the EPC register: confirm before relying on it, since members have been added recently.
 */
const SEPA_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT',
  'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH', 'GB', 'MC', 'SM',
  'VA', 'AD',
];

const CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    currency: 'USD',
    country: 'US',
    rail: 'ACH / Fedwire',
    xeroSyncable: false,
    fields: withCommonFields(
      railFieldsOf('US').map((f) =>
        f.key === 'accountType'
          ? { ...f, required: false, helpText: 'Optional. Choose checking or savings if you know it.' }
          : f,
      ),
    ),
  },
  AUD: {
    currency: 'AUD',
    country: 'AU',
    rail: 'BECS / NPP',
    xeroSyncable: true,
    fields: withCommonFields(railFieldsOf('AU')),
  },
  CAD: {
    currency: 'CAD',
    country: 'CA',
    rail: 'EFT',
    xeroSyncable: false,
    fields: withCommonFields(railFieldsOf('CA')),
  },
  GBP: {
    currency: 'GBP',
    country: 'GB',
    rail: 'Faster Payments / BACS',
    xeroSyncable: false,
    // Sort code and account number are both required: the IBAN alternative is a SWIFT style route.
    fields: withCommonFields(
      railFieldsOf('GB').map((f) => ({
        ...f,
        requiredUnless: undefined,
        helpText: f.key === 'sortCode' ? 'Six digits, for example 12-34-56.' : 'Eight digits.',
      })),
    ),
  },
  SGD: {
    currency: 'SGD',
    country: 'SG',
    rail: 'FAST / GIRO',
    xeroSyncable: false,
    // Airwallex FAST and GIRO take a SWIFT code plus a 7 to 17 character account number.
    // RTGS allows up to 23 characters but is not the local rail used here.
    fields: withCommonFields([
      bicField({ required: true, helpText: "Your bank's SWIFT code, 8 or 11 characters. Ask your bank if unsure." }),
      accountNumberField('Singapore', { min: 7, max: 17 }),
    ]),
  },
  THB: {
    currency: 'THB',
    country: 'TH',
    rail: 'PromptPay',
    xeroSyncable: false,
    // Airwallex PromptPay takes a SWIFT code plus a 7 to 12 digit account number.
    fields: withCommonFields([
      bicField({ required: true, helpText: "Your bank's SWIFT code, 8 or 11 characters. Ask your bank if unsure." }),
      ...railFieldsOf('TH').filter((f) => f.key !== 'bic').map((f) =>
        f.key === 'accountNumber'
          ? digitsField({
              key: 'accountNumber',
              label: 'Account number',
              helpText: 'Digits only, 7 to 12. Do not include spaces or dashes.',
              pattern: /^\d{7,12}$/,
              errorMessage: 'Thai account numbers are 7 to 12 digits.',
              maxLength: 12,
            })
          : f,
      ),
    ]),
  },
  EUR: {
    currency: 'EUR',
    country: null,
    rail: 'SEPA',
    xeroSyncable: false,
    fields: withCommonFields([
      ibanField({
        helpText: 'The full IBAN of a SEPA country, for example DE89 3704 0044 0532 0130 00.',
        placeholder: 'DE00 1234 5678 9012 3456 78',
        ibanCountries: SEPA_COUNTRIES,
      }),
      bicField({ helpText: 'Optional. 8 or 11 characters. Not needed for SEPA transfers.' }),
    ]),
  },
};

/** Local rail layout for a currency (case-insensitive). Throws for currencies outside SUPPORTED_CURRENCIES. */
export function getCurrencyConfig(currency: string): CurrencyConfig {
  const code = currency.toUpperCase() as CurrencyCode;
  const config = CONFIGS[code];
  if (!config) {
    throw new Error(`Unsupported currency "${currency}". Supported: ${SUPPORTED_CURRENCIES.join(', ')}.`);
  }
  const named = withPlaceholders({ country: config.country ?? 'EU', name: code, fields: config.fields, xeroSyncable: false } as CountryConfig);
  return { ...config, fields: named.fields };
}

/** Fields to render for a currency's local rail. */
export function getBankFieldsForCurrency(currency: string): FieldConfig[] {
  return getCurrencyConfig(currency).fields;
}
