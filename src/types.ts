export type InputMode = 'numeric' | 'text';

/** How a value is cleaned before validation and storage. */
export type Normaliser = 'digits' | 'digitsPad7' | 'upper' | 'iban' | 'bic' | 'trim' | 'none';

/** Names of the custom validators in validators.ts. */
export type ValidatorName = 'abaRouting' | 'clabe' | 'iban' | 'ibanChecksum' | 'bic';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  helpText: string;
  /**
   * Grey example text for the input, in the format the field expects. Always set on fields
   * returned by getBankFields and getCountryConfig.
   */
  placeholder?: string;
  required: boolean;
  /**
   * If set, the field is only required when none of these other fields have a
   * value. Used for "sort code and account number, or an IBAN" style choices.
   */
  requiredUnless?: string[];
  /** Tested against the normalised value. */
  pattern?: RegExp;
  validate?: ValidatorName;
  /** Specific, human readable message shown when pattern or validate fails. */
  errorMessage: string;
  normalise: Normaliser;
  inputMode: InputMode;
  maxLength: number;
  options?: FieldOption[];
  /** For IBAN fields: the IBAN must start with this country code. */
  ibanCountry?: string;
  /** For IBAN fields that accept several countries (for example SEPA): allowed two-letter prefixes. */
  ibanCountries?: string[];
  /** Sensitive fields are masked by maskBankDetails. */
  sensitive: boolean;
}

export interface CountryConfig {
  /** ISO 3166-1 alpha-2 */
  country: string;
  name: string;
  fields: FieldConfig[];
  /** True when details can be synced to Xero as an AU bank account. */
  xeroSyncable: boolean;
}

/** Currencies that have a local rail layout. */
export type CurrencyCode = 'USD' | 'AUD' | 'SGD' | 'CAD' | 'EUR' | 'GBP' | 'THB';

export interface CurrencyConfig {
  currency: CurrencyCode;
  /** ISO 3166-1 alpha-2 of the local rail, or null when the rail spans countries (EUR via SEPA). */
  country: string | null;
  /** Name of the local payment rail the fields are for. */
  rail: string;
  fields: FieldConfig[];
  /** True when details can be synced to Xero as an AU bank account. */
  xeroSyncable: boolean;
}

export type BankValues = Record<string, string | undefined | null>;

export interface ValidationResult {
  valid: boolean;
  /** Field key to message. Only invalid fields appear. */
  errors: Record<string, string>;
  /** Cleaned values for the country's fields only. Safe to store. */
  normalised: Record<string, string>;
}
