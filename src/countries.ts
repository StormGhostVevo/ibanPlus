import { getCountrySpecifications } from 'ibantools';
import type { CountryConfig, FieldConfig, FieldOption } from './types';

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

const bankNameField = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
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
  ...overrides,
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
      helpText: 'Most personal accounts are ordinary (futsu), which is the savings option.',
      required: true,
      // Matches Airwallex's bank_account_category: only Checking (toza) and Savings.
      // In Japan "Savings" means an ordinary deposit account (futsu). Airwallex has no
      // separate value for chochiku (postal-style deposit savings), so it is not offered.
      pattern: /^(checking|savings)$/,
      errorMessage: 'Choose checking or savings (ordinary).',
      normalise: 'trim',
      inputMode: 'text',
      maxLength: 8,
      options: [
        { value: 'savings', label: 'Savings / ordinary (futsu)' },
        { value: 'checking', label: 'Checking (toza)' },
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
      helpText: 'Letters and numbers only. Length varies by bank.',
      pattern: /^[A-Za-z0-9]{7,20}$/,
      errorMessage: 'Korean account numbers are 7 to 20 letters or numbers.',
      inputMode: 'text',
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
    bicField({
      required: true,
      helpText: 'Your bank\'s SWIFT code, 8 or 11 characters. Ask your bank if unsure.',
    }),
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

const accountTypeField = (options: FieldOption[], helpText: string): FieldConfig => ({
  key: 'accountType',
  label: 'Account type',
  helpText,
  required: true,
  pattern: new RegExp(`^(${options.map((o) => o.value).join('|')})$`),
  errorMessage: `Choose ${options.map((o) => o.value).join(', ')}.`.replace(/, ([^,]*)$/, ' or $1'),
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 10,
  options,
  sensitive: false,
});

const CHECKING_SAVINGS: FieldOption[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
];

interface AccountNumberOptions {
  min: number;
  max: number;
  digitsOnly?: boolean;
  helpText?: string;
}

const accountNumberField = (name: string, o: AccountNumberOptions): FieldConfig => {
  const chars = o.digitsOnly ? '\\d' : '[A-Za-z0-9]';
  const noun = o.digitsOnly ? 'digits' : 'letters or numbers';
  return {
    key: 'accountNumber',
    label: 'Account number',
    helpText: o.helpText ?? `${o.digitsOnly ? 'Digits only' : 'Letters and numbers only'}. Length varies by bank.`,
    required: true,
    pattern: new RegExp(`^${chars}{${o.min},${o.max}}$`),
    errorMessage:
      o.min === o.max
        ? `${name} account numbers are ${o.min} ${noun}.`
        : `${name} account numbers are ${o.min} to ${o.max} ${noun}.`,
    normalise: 'digits',
    inputMode: o.digitsOnly ? 'numeric' : 'text',
    maxLength: o.max,
    sensitive: true,
  };
};

const SWIFT_HELP = "Your bank's SWIFT code, 8 or 11 characters. Ask your bank if unsure.";

/** Layout for countries that only need bank name, BIC and account number. */
const accountPlusBic = (country: string, name: string, o: AccountNumberOptions): CountryConfig => ({
  country,
  name,
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({ required: true, helpText: SWIFT_HELP }),
    accountNumberField(name, o),
  ],
});

const SG = accountPlusBic('SG', 'Singapore', { min: 6, max: 23 });
const MY = accountPlusBic('MY', 'Malaysia', { min: 5, max: 19, digitsOnly: true });
const VN = accountPlusBic('VN', 'Vietnam', { min: 5, max: 20 });
const LK = accountPlusBic('LK', 'Sri Lanka', { min: 5, max: 50 });
const FJ = accountPlusBic('FJ', 'Fiji', { min: 5, max: 50 });
const KH = accountPlusBic('KH', 'Cambodia', { min: 5, max: 50 });
const TW = accountPlusBic('TW', 'Taiwan', { min: 8, max: 20, digitsOnly: true });
const LA = accountPlusBic('LA', 'Laos', { min: 5, max: 50 });
const GH = accountPlusBic('GH', 'Ghana', { min: 5, max: 50 });
const KE = accountPlusBic('KE', 'Kenya', { min: 8, max: 50 });
const NG = accountPlusBic('NG', 'Nigeria', { min: 7, max: 17 });

const regionNames = new Intl.DisplayNames(['en-AU'], { type: 'region' });
const regionName = (code: string) => regionNames.of(code) ?? code;

/**
 * Countries where Airwallex takes an account number plus SWIFT code, with no other
 * identifiers: [country, min, max, digitsOnly]. "Up to N" pages give no minimum, so 5 is assumed.
 */
const ACCOUNT_PLUS_BIC: [string, number, number, boolean?][] = [
  // Up to 50 letters or numbers
  ...['DZ', 'AS', 'AO', 'AI', 'AG', 'AM', 'AW', 'BS', 'GD', 'BB', 'BZ', 'BM', 'BT', 'BN', 'CV', 'KY', 'CK',
    'CW', 'DJ', 'DM', 'EC', 'ET', 'FK', 'PF', 'GQ', 'GN', 'GY', 'HN', 'JM', 'KI', 'KG', 'LR', 'MO',
    'MV', 'MH', 'FM', 'MS', 'MP', 'PW', 'PA', 'PG', 'PR', 'SH', 'KN', 'VC', 'WS', 'SL', 'SB', 'SR',
    'TJ', 'TZ', 'TO', 'TT', 'TC', 'TV', 'UG', 'UZ', 'VU', 'ZW', 'ZM', 'PY', 'SZ',
    // Registry IBAN countries that Airwallex takes as account number plus SWIFT code
    'OM', 'MN', 'NI', 'SV', 'UA', 'ME'].map((c): [string, number, number] => [c, 5, 50]),
  // Up to 35 letters or numbers
  ...['LS', 'MW', 'RW', 'GM'].map((c): [string, number, number] => [c, 5, 35]),
  ['NA', 8, 50],
  // Fixed length, letters or numbers (West and Central Africa)
  ...['BJ', 'BF', 'GW', 'NE', 'SN', 'TG'].map((c): [string, number, number] => [c, 24, 24]),
  ...['CM', 'CF', 'TD', 'GA', 'CG'].map((c): [string, number, number] => [c, 23, 23]),
];

const BW: CountryConfig = {
  country: 'BW',
  name: 'Botswana',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({ required: true, helpText: SWIFT_HELP }),
    accountNumberField('Botswana', { min: 7, max: 33 }),
    digitsField({
      key: 'bankBranch',
      label: 'Branch code',
      helpText: 'Optional. Six digits.',
      required: false,
      pattern: /^\d{6}$/,
      errorMessage: 'Botswana branch codes are 6 digits.',
      maxLength: 6,
      sensitive: false,
    }),
  ],
};

const BO: CountryConfig = {
  country: 'BO',
  name: 'Bolivia',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'One or two digits, for example 1 for Banco Mercantil.',
      pattern: /^\d{1,2}$/,
      errorMessage: 'Bolivian bank codes are 1 or 2 digits.',
      maxLength: 2,
      sensitive: false,
    }),
    accountNumberField('Bolivian', {
      min: 5,
      max: 15,
      digitsOnly: true,
      helpText: 'Digits only. Usually 10 digits, or 14 for Banco Unión.',
    }),
  ],
};

const UY: CountryConfig = {
  country: 'UY',
  name: 'Uruguay',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Three digits, for example 001 for BROU.',
      pattern: /^\d{3}$/,
      errorMessage: 'Uruguayan bank codes are 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    accountNumberField('Uruguayan', { min: 4, max: 14, digitsOnly: true }),
    accountTypeField(CHECKING_SAVINGS, 'Confirm with your bank if unsure.'),
    digitsField({
      key: 'bankBranch',
      label: 'Branch code',
      helpText: 'Santander (bank code 137) only. Up to four digits.',
      required: false,
      pattern: /^\d{1,4}$/,
      errorMessage: 'Uruguayan branch codes are up to 4 digits.',
      maxLength: 4,
      sensitive: false,
    }),
  ],
};

const MA: CountryConfig = {
  country: 'MA',
  name: 'Morocco',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'rib',
      label: 'RIB',
      helpText: 'Twenty-four digits (Relevé d\'Identité Bancaire). The first three identify your bank.',
      pattern: /^\d{24}$/,
      errorMessage: 'Moroccan RIB numbers are 24 digits.',
      maxLength: 24,
    }),
  ],
};

const CR: CountryConfig = {
  country: 'CR',
  name: 'Costa Rica',
  xeroSyncable: false,
  fields: [
    ibanField({ ibanCountry: 'CR' }),
    bicField({ required: true, helpText: SWIFT_HELP }),
  ],
};

/** IBAN-style numbers that ibantools has no registry entry for, checked by pattern and mod 97. */
const ibanLikeField = (prefixes: string[], length: number): FieldConfig =>
  ibanField({
    validate: 'ibanChecksum',
    pattern: new RegExp(`^(${prefixes.join('|')})[A-Z0-9]{${length - 2}}$`),
    errorMessage: `IBANs for this country are ${length} characters and start with ${prefixes.join(' or ')}.`,
    maxLength: length + 7,
  });

const ibanLikeCountry = (country: string, prefixes: string[], length: number): CountryConfig => ({
  country,
  name: regionName(country),
  xeroSyncable: false,
  fields: [ibanLikeField(prefixes, length), bicField()],
});

const IBAN_LIKE: CountryConfig[] = [
  ibanLikeCountry('MG', ['MG'], 27),
  ibanLikeCountry('GG', ['GG', 'GB'], 22),
  ibanLikeCountry('JE', ['JE', 'GB'], 22),
  ibanLikeCountry('IM', ['IM', 'GB'], 22),
  ibanLikeCountry('IC', ['IC', 'ES'], 24),
  // French IBANs are accepted for Saint Barthélemy
  { country: 'BL', name: regionName('BL'), xeroSyncable: false, fields: [ibanField({ ibanCountry: 'FR' }), bicField()] },
];

const HK: CountryConfig = {
  country: 'HK',
  name: 'Hong Kong',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Three digits. Not needed if you enter a SWIFT code.',
      pattern: /^\d{3}$/,
      errorMessage: 'Hong Kong bank codes are 3 digits.',
      maxLength: 3,
      requiredUnless: ['bic'],
      sensitive: false,
    }),
    bicField({
      helpText: 'Use this instead of a bank code if you prefer. 8 or 11 characters.',
      required: true,
      requiredUnless: ['bankCode'],
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only, 8 to 17 long. The first 3 digits are usually the branch code.',
      pattern: /^\d{8,17}$/,
      errorMessage: 'Hong Kong account numbers are 8 to 17 digits.',
      maxLength: 17,
    }),
  ],
};

const CN: CountryConfig = {
  country: 'CN',
  name: 'China',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    digitsField({
      key: 'cnaps',
      label: 'CNAPS code',
      helpText: 'Twelve digits that identify your bank branch. Not needed if you enter a SWIFT code.',
      pattern: /^\d{12}$/,
      errorMessage: 'CNAPS codes are 12 digits.',
      maxLength: 12,
      requiredUnless: ['bic'],
      sensitive: false,
    }),
    bicField({
      helpText: 'Use this instead of a CNAPS code if you prefer. 8 or 11 characters.',
      required: true,
      requiredUnless: ['cnaps'],
    }),
    digitsField({
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Digits only, 8 to 34 long.',
      pattern: /^\d{8,34}$/,
      errorMessage: 'Chinese account numbers are 8 to 34 digits.',
      maxLength: 34,
    }),
  ],
};

const IN: CountryConfig = {
  country: 'IN',
  name: 'India',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    {
      key: 'ifsc',
      label: 'IFSC code',
      helpText: 'Eleven characters that identify your bank branch, printed on your cheque book.',
      required: true,
      pattern: /^[A-Z0-9]{11}$/,
      errorMessage: 'IFSC codes are 11 letters or numbers.',
      normalise: 'upper',
      inputMode: 'text',
      maxLength: 11,
      sensitive: false,
    },
    bicField(),
    accountNumberField('Indian', { min: 6, max: 20 }),
  ],
};

const BD: CountryConfig = {
  country: 'BD',
  name: 'Bangladesh',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    digitsField({
      key: 'routingNumber',
      label: 'Routing number',
      helpText: 'Nine digits that identify your bank branch.',
      pattern: /^\d{9}$/,
      errorMessage: 'Bangladeshi routing numbers are 9 digits.',
      maxLength: 9,
    }),
    bicField(),
    accountNumberField('Bangladeshi', { min: 5, max: 50 }),
  ],
};

const NP: CountryConfig = {
  country: 'NP',
  name: 'Nepal',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    {
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Five characters, for example NP002. Not needed if you enter a SWIFT code.',
      required: true,
      requiredUnless: ['bic'],
      pattern: /^[A-Z0-9]{5}$/,
      errorMessage: 'Nepalese bank codes are 5 letters or numbers, for example NP002.',
      normalise: 'upper',
      inputMode: 'text',
      maxLength: 5,
      sensitive: false,
    },
    bicField({
      helpText: 'Use this instead of a bank code if you prefer. 8 or 11 characters.',
      required: true,
      requiredUnless: ['bankCode'],
    }),
    accountNumberField('Nepalese', { min: 5, max: 50 }),
  ],
};

const ZA: CountryConfig = {
  country: 'ZA',
  name: 'South Africa',
  xeroSyncable: false,
  fields: [
    bankNameField(),
    bicField({ required: true, helpText: SWIFT_HELP }),
    accountNumberField('South African', { min: 7, max: 17 }),
    accountTypeField(CHECKING_SAVINGS, 'Confirm with your bank if unsure.'),
  ],
};

const MX: CountryConfig = {
  country: 'MX',
  name: 'Mexico',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'clabe',
      label: 'CLABE',
      helpText: 'Eighteen digits. The first three identify your bank.',
      validate: 'clabe',
      pattern: /^\d{18}$/,
      errorMessage: 'CLABE numbers are 18 digits and must pass the check digit. Check for typos.',
      maxLength: 18,
    }),
  ],
};

const AR: CountryConfig = {
  country: 'AR',
  name: 'Argentina',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'cbu',
      label: 'CBU',
      helpText: 'Twenty-two digits (Clave Bancaria Uniforme).',
      pattern: /^\d{22}$/,
      errorMessage: 'CBU numbers are 22 digits.',
      maxLength: 22,
    }),
  ],
};

const PE: CountryConfig = {
  country: 'PE',
  name: 'Peru',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'cci',
      label: 'CCI',
      helpText: 'Twenty digits (Código de Cuenta Interbancario). The first three identify your bank.',
      pattern: /^\d{20}$/,
      errorMessage: 'CCI numbers are 20 digits.',
      maxLength: 20,
    }),
    accountTypeField(
      [
        { value: 'checking', label: 'Checking' },
        { value: 'savings', label: 'Savings' },
        { value: 'maestra', label: 'Maestra' },
      ],
      'Confirm with your bank if unsure.',
    ),
  ],
};

const CL: CountryConfig = {
  country: 'CL',
  name: 'Chile',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Up to three digits.',
      pattern: /^\d{1,3}$/,
      errorMessage: 'Chilean bank codes are up to 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    accountNumberField('Chilean', { min: 5, max: 45, digitsOnly: true }),
    accountTypeField(
      [
        { value: 'checking', label: 'Checking' },
        { value: 'savings', label: 'Savings' },
        { value: 'vista', label: 'Vista' },
      ],
      'Confirm with your bank if unsure.',
    ),
  ],
};

const CO: CountryConfig = {
  country: 'CO',
  name: 'Colombia',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Two or three digits, for example 007 for Bancolombia.',
      pattern: /^\d{2,3}$/,
      errorMessage: 'Colombian bank codes are 2 or 3 digits.',
      maxLength: 3,
      sensitive: false,
    }),
    accountNumberField('Colombian', { min: 3, max: 18, digitsOnly: true }),
    accountTypeField(CHECKING_SAVINGS, 'Confirm with your bank if unsure.'),
  ],
};

const BR: CountryConfig = {
  country: 'BR',
  name: 'Brazil',
  xeroSyncable: false,
  fields: [
    digitsField({
      key: 'bankCode',
      label: 'Bank code',
      helpText: 'Three digits, for example 341 for Itaú. Not needed if you enter an IBAN.',
      pattern: /^\d{3}$/,
      errorMessage: 'Brazilian bank codes are 3 digits.',
      maxLength: 3,
      requiredUnless: ['iban'],
      sensitive: false,
    }),
    {
      key: 'branch',
      label: 'Branch (agência)',
      helpText: 'Four to seven characters. Not needed if you enter an IBAN.',
      required: true,
      requiredUnless: ['iban'],
      pattern: /^[A-Za-z0-9.-]{4,7}$/,
      errorMessage: 'Brazilian branch numbers are 4 to 7 letters, numbers, dots or dashes.',
      normalise: 'upper',
      inputMode: 'text',
      maxLength: 7,
      sensitive: false,
    },
    {
      key: 'accountNumber',
      label: 'Account number',
      helpText: 'Include the check digit. Dots and dashes are fine. Not needed if you enter an IBAN.',
      required: true,
      requiredUnless: ['iban'],
      pattern: /^[A-Za-z0-9.-]{3,50}$/,
      errorMessage: 'Brazilian account numbers are 3 to 50 letters, numbers, dots or dashes.',
      normalise: 'upper',
      inputMode: 'text',
      maxLength: 50,
      sensitive: true,
    },
    { ...accountTypeField(CHECKING_SAVINGS, 'Confirm with your bank if unsure.'), requiredUnless: ['iban'] },
    ibanField({
      label: 'IBAN (alternative)',
      helpText: 'Use this instead of the bank code, branch and account number if you prefer.',
      requiredUnless: ['bankCode', 'branch', 'accountNumber'],
      ibanCountry: 'BR',
    }),
  ],
};

/** Countries with their own layout. IBAN countries and the fallback are derived below. */
const SPECIFIC: CountryConfig[] = [
  AU, US, GB, NZ, CA, JP, KR, ID, PH, TH,
  SG, MY, VN, HK, IN, LK, FJ, KH, BD, NP, CN, TW, LA,
  MX, BR, AR, PE, CL, CO, ZA, NG, KE, GH,
  BW, BO, UY, MA, CR, ...IBAN_LIKE,
  ...ACCOUNT_PLUS_BIC.filter(([c]) => !['NP'].includes(c)).map(([c, min, max, digitsOnly]) =>
    accountPlusBic(c, regionName(c), { min, max, digitsOnly }),
  ),
];

/** Used for any country that has no layout and does not use IBAN. */
export const FALLBACK_CONFIG: CountryConfig = {
  country: '*',
  name: 'Other',
  xeroSyncable: false,
  fields: [
    bankNameField({ requiredUnless: ['iban', 'otherDetails'] }),
    { ...accountNumberField('Account', { min: 5, max: 34 }), requiredUnless: ['iban', 'otherDetails'] },
    bicField({ required: true, requiredUnless: ['iban', 'otherDetails'], helpText: SWIFT_HELP }),
    ibanField({
      label: 'IBAN',
      helpText: 'If your country uses IBANs, enter it here instead of an account number.',
      required: true,
      requiredUnless: ['accountNumber', 'otherDetails'],
    }),
    {
      key: 'otherDetails',
      label: 'Other bank details',
      helpText:
        'If none of the above fits, enter your account holder name, account number, bank name and any local codes.',
      required: true,
      requiredUnless: ['iban', 'accountNumber'],
      errorMessage: 'Enter your bank details.',
      pattern: /\S/,
      normalise: 'trim',
      inputMode: 'text',
      maxLength: 500,
      sensitive: true,
    },
  ],
};

/** Not offered: not in Airwallex's payout list. Excluded from the country list and rejected by validation. */
const UNSUPPORTED = new Set(['BY', 'IQ', 'LY', 'RU', 'SD', 'SO', 'YE']);

export function isCountrySupported(country: string): boolean {
  return !UNSUPPORTED.has(country.toUpperCase());
}

const configs = new Map<string, CountryConfig>(SPECIFIC.map((c) => [c.country, c]));

/** Territories whose IBANs carry their parent country's prefix. */
const IBAN_PREFIX: Record<string, string> = {
  GF: 'FR', GP: 'FR', MQ: 'FR', RE: 'FR', YT: 'FR', PM: 'FR', NC: 'FR', PF: 'FR', TF: 'FR', WF: 'FR', MF: 'FR',
  AX: 'FI',
};

const countryNames = new Intl.DisplayNames(['en-AU'], { type: 'region' });
const specs = getCountrySpecifications();
for (const [code, spec] of Object.entries(specs)) {
  if (!spec.IBANRegistry || configs.has(code) || UNSUPPORTED.has(code)) continue;
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
