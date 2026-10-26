import { getCountrySpecifications } from 'ibantools';
import type { CountryConfig, FieldConfig } from './types';

const digitsField = (
  f: Pick<FieldConfig, 'key' | 'label' | 'helpText' | 'errorMessage' | 'maxLength'> &
    Partial<FieldConfig>,
): FieldConfig => ({
  required: true,
  normalise: 'digits',
  inputMode: 'numeric',
  sensitive: true,
  ...f,
});

const ibanField = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
  key: 'iban',
  label: 'IBAN',
  helpText: 'International Bank Account Number, for example GB82 WEST 1234 5698 7654 32.',
  required: true,
  validate: 'iban',
  errorMessage: 'This IBAN is not valid. Check for typos and make sure it is the full number.',
  normalise: 'iban',
  inputMode: 'text',
  maxLength: 42,
  sensitive: true,
  ...overrides,
});

const bicField = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
  key: 'bic',
  label: 'BIC / SWIFT code',
  helpText: 'Optional. 8 or 11 characters, found on your bank statement.',
  required: false,
  validate: 'bic',
  errorMessage: 'BIC / SWIFT codes are 8 or 11 letters and numbers.',
  normalise: 'bic',
  inputMode: 'text',
  maxLength: 11,
  sensitive: false,
  ...overrides,
});

const AU: CountryConfig = {
  country: 'AU',
  name: 'Australia',
  xeroSyncable: true,
  fields: [
    digitsField({
      key: 'bsb',
      label: 'BSB',
      helpText: 'Six digits, for example 123-456.',
      pattern: /^\d{6}$/,
      errorMessage: 'BSBs are 6 digits.',
      maxLength: 7,
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Usually 6 to 9 digits.',
      pattern: /^\d{4,10}$/,
      errorMessage: 'Australian account numbers are 4 to 10 digits.',
      maxLength: 10,
    }),
  ],
};

const US: CountryConfig = {
  country: 'US',
  name: 'United States',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'routingNumber',
      label: 'ABA routing number',
      helpText: 'Nine digits, printed on the bottom of a cheque or in your online banking.',
      validate: 'abaRouting',
      pattern: /^\d{9}$/,
      errorMessage: 'US routing numbers are 9 digits and must pass the ABA check. Check for typos.',
      maxLength: 9,
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only, 4 to 17 long.',
      pattern: /^\d{4,17}$/,
      errorMessage: 'US account numbers are 4 to 17 digits.',
      maxLength: 17,
    }),
    {
      key: 'accountType',
      label: 'Account type',
      helpText: 'Choose checking or savings.',
      required: true,
      pattern: /^(checking|savings)$/,
      errorMessage: 'Choose checking or savings.',
      normalise: 'trim',
      inputMode: 'text',
      maxLength: 8,
      options: [
        { value: 'checking', label: 'Checking' },
        { value: 'savings', label: 'Savings' },
      ],
      sensitive: false,
    },
  ],
};

const GB: CountryConfig = {
  country: 'GB',
  name: 'United Kingdom',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'sortCode',
      label: 'Sort code',
      helpText: 'Six digits, for example 12-34-56. Not needed if you enter an IBAN.',
      pattern: /^\d{6}$/,
      errorMessage: 'UK sort codes are 6 digits.',
      maxLength: 8,
      requiredUnless: ['iban'],
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Eight digits. Not needed if you enter an IBAN.',
      pattern: /^\d{8}$/,
      errorMessage: 'UK account numbers are 8 digits.',
      maxLength: 8,
      requiredUnless: ['iban'],
    }),
    ibanField({
      label: 'IBAN (alternative)',
      helpText: 'Use this instead of a sort code and account number if you prefer.',
      required: true,
      requiredUnless: ['sortCode', 'accountNumber'],
      ibanCountry: 'GB',
    }),
  ],
};

const NZ: CountryConfig = {
  country: 'NZ',
  name: 'New Zealand',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bank',
      label: 'Bank',
      helpText: 'Two digits, the first part of your account number.',
      pattern: /^\d{2}$/,
      errorMessage: 'NZ bank numbers are 2 digits.',
      maxLength: 2,
    }),
    digitsField({
      key: 'branch',
      label: 'Branch',
      helpText: 'Four digits.',
      pattern: /^\d{4}$/,
      errorMessage: 'NZ branch numbers are 4 digits.',
      maxLength: 4,
    }),
    digitsField({
      key: 'accountBase',
      label: 'Account base number',
      helpText: 'Seven or eight digits.',
      pattern: /^\d{7,8}$/,
      errorMessage: 'NZ account base numbers are 7 or 8 digits.',
      maxLength: 8,
    }),
    digitsField({
      key: 'suffix',
      label: 'Suffix',
      helpText: 'Two or three digits.',
      pattern: /^\d{2,3}$/,
      errorMessage: 'NZ account suffixes are 2 or 3 digits.',
      maxLength: 3,
    }),
  ],
};

const CA: CountryConfig = {
  country: 'CA',
  name: 'Canada',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'institutionNumber',
      label: 'Institution number',
      helpText: 'Three digits.',
      pattern: /^\d{3}$/,
      errorMessage: 'Canadian institution numbers are 3 digits.',
      maxLength: 3,
    }),
    digitsField({
      key: 'transitNumber',
      label: 'Transit number',
      helpText: 'Five digits, also called the branch number.',
      pattern: /^\d{5}$/,
      errorMessage: 'Canadian transit numbers are 5 digits.',
      maxLength: 5,
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Usually 7 to 12 digits.',
      pattern: /^\d{7,21}$/,
      errorMessage: 'Canadian account numbers are 7 to 21 digits.',
      maxLength: 21,
    }),
  ],
};

const bankNameField = (): FieldConfig => ({
  key: 'bankName',
  label: 'Bank name',
  helpText: 'The name of your bank, for example the name printed on your card.',
  required: true,
  pattern: /\S/,
  errorMessage: 'Enter the name of your bank.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 100,
  sensitive: false,
});

const JP: CountryConfig = {
  country: 'JP',
  name: 'Japan',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Four digits (Zengin code).',
      pattern: /^\d{4}$/,
      errorMessage: 'Japanese bank codes are 4 digits.',
      maxLength: 4,
    }),
    digitsField({
      key: 'branchCode',
      label: 'Branch code',
      helpText: 'Three digits.',
      pattern: /^\d{3}$/,
      errorMessage: 'Japanese branch codes are 3 digits.',
      maxLength: 3,
    }),
    {
      key: 'accountType',
      label: 'Account type',
      helpText: 'Most personal accounts are ordinary (futsu).',
      required: true,
      pattern: /^(futsu|toza|chochiku)$/,
      errorMessage: 'Choose ordinary, checking or savings.',
      normalise: 'trim',
      inputMode: 'text',
      maxLength: 8,
      options: [
        { value: 'futsu', label: 'Ordinary (futsu)' },
        { value: 'toza', label: 'Checking (toza)' },
        { value: 'chochiku', label: 'Savings (chochiku)' },
      ],
      sensitive: false,
    },
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Usually 7 digits. Shorter numbers are padded with leading zeros.',
      pattern: /^\d{7,8}$/,
      errorMessage: 'Japanese account numbers are 4 to 8 digits, usually 7.',
      normalise: 'digitsPad7',
      maxLength: 8,
    }),
  ],
};

const KR: CountryConfig = {
  country: 'KR',
  name: 'South Korea',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({
      required: true,
      helpText: 'Your bank\'s SWIFT code, 8 or 11 characters. Ask your bank if unsure.',
    }),
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Optional. Three digits.',
      required: false,
      pattern: /^\d{3}$/,
      errorMessage: 'Korean bank codes are 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only. Length varies by bank.',
      pattern: /^\d{7,20}$/,
      errorMessage: 'Korean account numbers are 7 to 20 digits.',
      maxLength: 20,
    }),
  ],
};

const ID: CountryConfig = {
  country: 'ID',
  name: 'Indonesia',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Optional. Three digits, for example 014 for BCA.',
      required: false,
      pattern: /^\d{3}$/,
      errorMessage: 'Indonesian bank codes are 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    bicField(),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only. Length varies by bank.',
      pattern: /^\d{7,22}$/,
      errorMessage: 'Indonesian account numbers are 7 to 22 digits.',
      maxLength: 22,
    }),
  ],
};

const PH: CountryConfig = {
  country: 'PH',
  name: 'Philippines',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({
      required: true,
      helpText: 'Your bank\'s SWIFT code, 8 or 11 characters. Ask your bank if unsure.',
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only. Length varies by bank.',
      pattern: /^\d{8,16}$/,
      errorMessage: 'Philippine account numbers are 8 to 16 digits.',
      maxLength: 16,
    }),
  ],
};

const TH: CountryConfig = {
  country: 'TH',
  name: 'Thailand',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({
      required: true,
      helpText: 'Your bank\'s SWIFT code, 8 or 11 characters. Ask your bank if unsure.',
    }),
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Optional. Three digits.',
      required: false,
      pattern: /^\d{3}$/,
      errorMessage: 'Thai bank codes are 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only, usually 10 to 12. Do not include spaces or dashes.',
      pattern: /^\d{7,19}$/,
      errorMessage: 'Thai account numbers are 7 to 19 digits.',
      maxLength: 19,
    }),
  ],
};

/** Countries with their own layout. IBAN countries and the fallback are derived below. */
const SPECIFIC: CountryConfig[] = [AU, US, GB, NZ, CA, JP, KR, ID, PH, TH];

/** Used for any country that has no layout and does not use IBAN. */
export const FALLBACK_CONFIG: CountryConfig = {
  country: '*',
  name: 'Other',
  xeroSyncable: false,
  fields: [
    ibanField({
      label: 'IBAN',
      helpText: 'If your country uses IBANs. Otherwise use the other bank details box.',
      required: true,
      requiredUnless: ['otherDetails'],
    }),
    bicField(),
    {
      key: 'otherDetails',
      label: 'Other bank details',
      helpText: 'Account holder name, account number, bank name and any local codes.',
      required: true,
      requiredUnless: ['iban'],
      errorMessage: 'Enter your IBAN or your other bank details.',
      pattern: /\S/,
      normalise: 'trim',
      inputMode: 'text',
      maxLength: 500,
      sensitive: true,
    },
  ],
};

const configs = new Map<string, CountryConfig>(SPECIFIC.map((c) => [c.country, c]));

/** Territories whose IBANs carry their parent country's prefix. */
const IBAN_PREFIX: Record<string, string> = {
  GF: 'FR', GP: 'FR', MQ: 'FR', RE: 'FR', YT: 'FR', PM: 'FR', NC: 'FR', PF: 'FR', TF: 'FR', WF: 'FR', MF: 'FR',
  AX: 'FI',
};

const countryNames = new Intl.DisplayNames(['en-AU'], { type: 'region' });
const specs = getCountrySpecifications();
for (const [code, spec] of Object.entries(specs)) {
  if (!spec.IBANRegistry || configs.has(code)) continue;
  configs.set(code, {
    country: code,
    name: countryNames.of(code) ?? code,
    xeroSyncable: false,
    fields: [ibanField({ ibanCountry: IBAN_PREFIX[code] ?? code }), bicField()],
  });
}

/** Config for a country code (case-insensitive). Unknown countries get the fallback. */
export function getCountryConfig(country: string): CountryConfig {
  return configs.get(country.toUpperCase()) ?? { ...FALLBACK_CONFIG, country: country.toUpperCase() };
}

/** Country codes that have a specific layout or use IBAN. */
export function getConfiguredCountries(): string[] {
  return [...configs.keys()].sort();
}
