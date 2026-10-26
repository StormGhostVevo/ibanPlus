import { describe, expect, it } from 'vitest';
import {
  getBankFields,
  getConfiguredCountries,
  isValidAbaRouting,
  isCountrySupported,
  isValidClabe,
  isValidIbanChecksum,
  isXeroSyncable,
  maskBankDetails,
  validateBankDetails,
} from '../src';

const ok = (country: string, values: Record<string, string>) =>
  validateBankDetails(country, values);

describe('US routing checksum', () => {
  it.each(['021000021', '011401533', '121000248'])('accepts %s', (n) => {
    expect(isValidAbaRouting(n)).toBe(true);
  });
  it.each(['021000022', '12345678', '1234567890', 'abcdefghi', ''])('rejects %s', (n) => {
    expect(isValidAbaRouting(n)).toBe(false);
  });
});

describe('AU', () => {
  it('accepts a hyphenated BSB and stores digits only', () => {
    const r = ok('AU', { bsb: '123-456', accountNumber: '12345678' });
    expect(r.valid).toBe(true);
    expect(r.normalised).toEqual({ bsb: '123456', accountNumber: '12345678' });
  });
  it('rejects a short BSB and account number', () => {
    const r = ok('AU', { bsb: '12345', accountNumber: '123' });
    expect(r.errors.bsb).toBe('BSBs are 6 digits.');
    expect(r.errors.accountNumber).toMatch(/4 to 10 digits/);
  });
  it('requires both fields', () => {
    expect(Object.keys(ok('AU', {}).errors)).toEqual(['bsb', 'accountNumber']);
  });
  it('is the only country that syncs to Xero', () => {
    expect(isXeroSyncable('AU')).toBe(true);
    for (const c of ['US', 'GB', 'NZ', 'CA', 'DE', 'JP']) expect(isXeroSyncable(c)).toBe(false);
  });
});

describe('US', () => {
  const valid = { routingNumber: '021000021', accountNumber: '123456789', accountType: 'checking' };
  it('accepts valid details', () => expect(ok('US', valid).valid).toBe(true));
  it('rejects a bad checksum with a specific message', () => {
    expect(ok('US', { ...valid, routingNumber: '021000022' }).errors.routingNumber).toMatch(
      /9 digits/,
    );
  });
  it('rejects bad account numbers and types', () => {
    expect(ok('US', { ...valid, accountNumber: '123' }).errors.accountNumber).toBeDefined();
    expect(ok('US', { ...valid, accountNumber: '1'.repeat(18) }).errors.accountNumber).toBeDefined();
    expect(ok('US', { ...valid, accountType: 'current' }).errors.accountType).toBeDefined();
  });
});

describe('GB', () => {
  it('accepts sort code and account number', () => {
    const r = ok('GB', { sortCode: '12-34-56', accountNumber: '12345678' });
    expect(r.valid).toBe(true);
    expect(r.normalised.sortCode).toBe('123456');
  });
  it('accepts an IBAN alone', () => {
    expect(ok('GB', { iban: 'GB82 WEST 1234 5698 7654 32' }).valid).toBe(true);
  });
  it('rejects empty, short account numbers and non-GB IBANs', () => {
    expect(ok('GB', {}).valid).toBe(false);
    expect(ok('GB', { sortCode: '123456', accountNumber: '1234' }).errors.accountNumber).toBeDefined();
    expect(ok('GB', { iban: 'DE89370400440532013000' }).errors.iban).toMatch(/start with GB/);
  });
});

describe('NZ', () => {
  const valid = { bank: '12', branch: '3456', accountBase: '1234567', suffix: '00' };
  it('accepts valid details with 2 or 3 digit suffix', () => {
    expect(ok('NZ', valid).valid).toBe(true);
    expect(ok('NZ', { ...valid, suffix: '000' }).valid).toBe(true);
  });
  it('accepts an 8 digit base number', () => {
    expect(ok('NZ', { ...valid, accountBase: '12345678' }).valid).toBe(true);
  });
  it('rejects wrong lengths', () => {
    const r = ok('NZ', { bank: '1', branch: '345', accountBase: '123456', suffix: '0' });
    expect(Object.keys(r.errors)).toEqual(['bank', 'branch', 'accountBase', 'suffix']);
  });
});

describe('CA', () => {
  const valid = { institutionNumber: '004', transitNumber: '12345', accountNumber: '1234567' };
  it('accepts valid details', () => expect(ok('CA', valid).valid).toBe(true));
  it('accepts long account numbers up to 21 digits', () => {
    expect(ok('CA', { ...valid, accountNumber: '1'.repeat(21) }).valid).toBe(true);
    expect(ok('CA', { ...valid, accountNumber: '1'.repeat(22) }).errors.accountNumber).toBeDefined();
  });
  it('rejects wrong lengths', () => {
    const r = ok('CA', { institutionNumber: '04', transitNumber: '1234', accountNumber: '123456' });
    expect(Object.keys(r.errors)).toEqual(['institutionNumber', 'transitNumber', 'accountNumber']);
  });
});

describe('JP', () => {
  const valid = { bankCode: '0001', branchCode: '001', accountType: 'savings', accountNumber: '1234567' };
  it('accepts valid details', () => expect(ok('JP', valid).valid).toBe(true));
  it('accepts checking and savings only', () => {
    expect(ok('JP', { ...valid, accountType: 'checking' }).valid).toBe(true);
    expect(ok('JP', { ...valid, accountType: 'chochiku' }).errors.accountType).toBeDefined();
    expect(ok('JP', { ...valid, accountType: 'futsu' }).errors.accountType).toBeDefined();
  });
  it('left-pads short account numbers to 7 digits', () => {
    expect(ok('JP', { ...valid, accountNumber: '12345' }).normalised.accountNumber).toBe('0012345');
    expect(ok('JP', { ...valid, accountNumber: '12345678' }).normalised.accountNumber).toBe('12345678');
    expect(ok('JP', { ...valid, accountNumber: '123' }).errors.accountNumber).toBeDefined();
    expect(ok('JP', { ...valid, accountNumber: '123456789' }).errors.accountNumber).toBeDefined();
  });
  it('rejects wrong codes, type and account number', () => {
    const r = ok('JP', { bankCode: '001', branchCode: '01', accountType: 'current', accountNumber: '123' });
    expect(Object.keys(r.errors)).toEqual(['bankCode', 'branchCode', 'accountType', 'accountNumber']);
  });
});

describe('KR', () => {
  const valid = { bankName: 'Example Bank', bic: 'CZNBKRSE', accountNumber: '110-123-456789' };
  it('accepts valid details with an optional bank code', () => {
    expect(ok('KR', valid).valid).toBe(true);
    expect(ok('KR', { ...valid, bankCode: '004' }).valid).toBe(true);
  });
  it('requires a BIC and rejects bad account and bank codes', () => {
    expect(ok('KR', { ...valid, bic: '' }).errors.bic).toBeDefined();
    expect(ok('KR', { ...valid, accountNumber: '123456' }).errors.accountNumber).toBeDefined();
    expect(ok('KR', { ...valid, accountNumber: '1234567' }).valid).toBe(true);
    expect(ok('KR', { ...valid, accountNumber: '1'.repeat(20) }).valid).toBe(true);
    expect(ok('KR', { ...valid, accountNumber: 'AB1234567' }).valid).toBe(true);
    expect(ok('KR', { ...valid, accountNumber: '1234567!' }).errors.accountNumber).toBeDefined();
    expect(ok('KR', { ...valid, accountNumber: '1'.repeat(21) }).errors.accountNumber).toBeDefined();
    expect(ok('KR', { ...valid, bankCode: '04' }).errors.bankCode).toBeDefined();
  });
});

describe('ID', () => {
  const valid = { bankName: 'Example Bank', bic: 'CENAIDJA', accountNumber: '1234567890' };
  it('accepts valid details, bank code optional', () => {
    expect(ok('ID', valid).valid).toBe(true);
    expect(ok('ID', { ...valid, bankCode: '014' }).valid).toBe(true);
  });
  it('rejects bad values', () => {
    expect(ok('ID', { ...valid, accountNumber: '123456' }).errors.accountNumber).toBeDefined();
    expect(ok('ID', { ...valid, accountNumber: '1'.repeat(22) }).valid).toBe(true);
    expect(ok('ID', { ...valid, accountNumber: '1'.repeat(23) }).errors.accountNumber).toBeDefined();
    expect(ok('ID', { ...valid, bankCode: '14' }).errors.bankCode).toBeDefined();
    expect(ok('ID', { ...valid, bic: 'XX' }).errors.bic).toBeDefined();
    expect(ok('ID', { ...valid, bankName: '' }).errors.bankName).toBeDefined();
    expect(ok('ID', { ...valid, bic: '' }).errors.bic).toBeDefined();
  });
});

describe('PH', () => {
  const valid = { bankName: 'Example Bank', bic: 'BOPIPHMM', accountNumber: '001234567890' };
  it('accepts valid details', () => expect(ok('PH', valid).valid).toBe(true));
  it('requires a BIC and rejects a bad account number', () => {
    expect(ok('PH', { ...valid, bic: '' }).errors.bic).toBeDefined();
    expect(ok('PH', { ...valid, accountNumber: '1234567' }).errors.accountNumber).toBeDefined();
    expect(ok('PH', { ...valid, accountNumber: '1'.repeat(17) }).errors.accountNumber).toBeDefined();
  });
});

describe('TH', () => {
  const valid = { bankName: 'Example Bank', bic: 'KASITHBK', accountNumber: '1234567890' };
  it('accepts valid details with an optional bank code', () => {
    expect(ok('TH', valid).valid).toBe(true);
    expect(ok('TH', { ...valid, bankCode: '004' }).valid).toBe(true);
  });
  it('requires a BIC and rejects bad values', () => {
    expect(ok('TH', { ...valid, bic: '' }).errors.bic).toBeDefined();
    expect(ok('TH', { ...valid, accountNumber: '123456' }).errors.accountNumber).toBeDefined();
    expect(ok('TH', { ...valid, accountNumber: '1'.repeat(19) }).valid).toBe(true);
    expect(ok('TH', { ...valid, accountNumber: '1'.repeat(20) }).errors.accountNumber).toBeDefined();
  });
});

describe('IBAN countries', () => {
  it('accepts valid IBANs with optional BIC', () => {
    expect(ok('DE', { iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFF' }).valid).toBe(true);
    expect(ok('FR', { iban: 'FR1420041010050500013M02606' }).valid).toBe(true);
  });
  it('rejects a bad checksum, a wrong country prefix and a bad BIC', () => {
    expect(ok('DE', { iban: 'DE89370400440532013001' }).errors.iban).toBeDefined();
    expect(ok('FR', { iban: 'DE89370400440532013000' }).errors.iban).toMatch(/start with FR/);
    expect(ok('DE', { iban: 'DE89370400440532013000', bic: 'XX' }).errors.bic).toBeDefined();
  });
  it('uses the parent IBAN prefix for territories', () => {
    expect(ok('GF', { iban: 'FR1420041010050500013M02606' }).valid).toBe(true);
    expect(ok('AX', { iban: 'FI2112345600000785' }).valid).toBe(true);
    expect(ok('GF', { iban: 'DE89370400440532013000' }).errors.iban).toMatch(/start with FR/);
  });
  it('normalises case and spacing', () => {
    expect(ok('de', { iban: 'de89 3704 0044 0532 0130 00' }).normalised.iban).toBe(
      'DE89370400440532013000',
    );
  });
});

describe('fallback', () => {
  it('accepts bank name, BIC and account number', () => {
    expect(ok('MM', { bankName: 'Example Bank', bic: 'CTCBTWTP', accountNumber: '1234567890' }).valid).toBe(true);
  });
  it('accepts an IBAN alone or other details alone', () => {
    expect(ok('MM', { iban: 'DE89370400440532013000' }).valid).toBe(true);
    expect(ok('MM', { otherDetails: 'Acct 1234, Example Bank, branch 001' }).valid).toBe(true);
  });
  it('requires a BIC and bank name with an account number', () => {
    const r = ok('MM', { accountNumber: '1234567890' });
    expect(Object.keys(r.errors)).toEqual(['bankName', 'bic']);
  });
  it('requires something, and rejects bad account numbers', () => {
    expect(ok('MM', {}).valid).toBe(false);
    expect(ok('MM', { otherDetails: '   ' }).valid).toBe(false);
    expect(
      ok('MM', { bankName: 'B', bic: 'CTCBTWTP', accountNumber: '1234' }).errors.accountNumber,
    ).toBeDefined();
  });
  it('has the expected fields', () => {
    expect(getBankFields('MM').map((f) => f.key)).toEqual([
      'bankName',
      'accountNumber',
      'bic',
      'iban',
      'otherDetails',
    ]);
  });
});

describe('bank name, BIC and account number countries', () => {
  const cases: [string, string, string, string][] = [
    // country, valid account, too short, too long
    ['SG', 'A1234567', '12345', '1'.repeat(24)],
    ['MY', '1234567890', '1234', '1'.repeat(20)],
    ['VN', '1234567890', '1234', '1'.repeat(21)],
    ['LK', '1234567890', '1234', '1'.repeat(51)],
    ['FJ', '1234567890', '1234', '1'.repeat(51)],
    ['KH', '1234567890', '1234', '1'.repeat(51)],
    ['GH', '1234567890', '1234', '1'.repeat(51)],
    ['KE', '12345678', '1234567', '1'.repeat(51)],
    ['NG', '0123456789', '123456', '1'.repeat(18)],
    ['ZA', '1234567890', '123456', '1'.repeat(18)],
    ['TW', '12345678', '1234567', '1'.repeat(21)],
    ['LA', '1234567890', '1234', '1'.repeat(51)],
  ];
  it.each(cases)('%s accepts and rejects account numbers', (country, valid, short, long) => {
    const base: Record<string, string> = { bankName: 'Example Bank', bic: 'DEUTDEFF' };
    if (country === 'ZA') base.accountType = 'checking';
    expect(ok(country, { ...base, accountNumber: valid }).valid).toBe(true);
    expect(ok(country, { ...base, accountNumber: short }).errors.accountNumber).toBeDefined();
    expect(ok(country, { ...base, accountNumber: long }).errors.accountNumber).toBeDefined();
    expect(ok(country, { ...base, bic: '', accountNumber: valid }).errors.bic).toBeDefined();
    expect(ok(country, { ...base, accountNumber: '' }).errors.accountNumber).toBeDefined();
  });
  it('MY is digits only, SG allows letters', () => {
    const base = { bankName: 'Example Bank', bic: 'DEUTDEFF' };
    expect(ok('MY', { ...base, accountNumber: 'AB12345' }).errors.accountNumber).toBeDefined();
    expect(ok('SG', { ...base, accountNumber: 'AB12345' }).valid).toBe(true);
  });
  it('ZA needs an account type', () => {
    const r = ok('ZA', { bankName: 'B', bic: 'DEUTDEFF', accountNumber: '1234567890' });
    expect(r.errors.accountType).toBeDefined();
  });
});

describe('HK', () => {
  const base = { bankName: 'Example Bank', accountNumber: '12345678' };
  it('accepts a bank code or a BIC', () => {
    expect(ok('HK', { ...base, bankCode: '024' }).valid).toBe(true);
    expect(ok('HK', { ...base, bic: 'HSBCHKHH' }).valid).toBe(true);
  });
  it('requires one of them and checks lengths', () => {
    expect(ok('HK', base).valid).toBe(false);
    expect(ok('HK', { ...base, bankCode: '24' }).errors.bankCode).toBeDefined();
    expect(ok('HK', { ...base, bankCode: '024', accountNumber: '1234567' }).errors.accountNumber).toBeDefined();
    expect(ok('HK', { ...base, bankCode: '024', accountNumber: '1'.repeat(18) }).errors.accountNumber).toBeDefined();
  });
});

describe('CN', () => {
  const base = { bankName: 'Example Bank', accountNumber: '12345678' };
  it('accepts a CNAPS code or a BIC', () => {
    expect(ok('CN', { ...base, cnaps: '102100099996' }).valid).toBe(true);
    expect(ok('CN', { ...base, bic: 'ICBKCNBJ' }).valid).toBe(true);
  });
  it('requires one of them and checks lengths', () => {
    expect(ok('CN', base).valid).toBe(false);
    expect(ok('CN', { ...base, cnaps: '10210009999' }).errors.cnaps).toMatch(/12 digits/);
    expect(ok('CN', { ...base, cnaps: '102100099996', accountNumber: '1234567' }).errors.accountNumber).toBeDefined();
    expect(ok('CN', { ...base, cnaps: '102100099996', accountNumber: '1'.repeat(35) }).errors.accountNumber).toBeDefined();
    expect(ok('CN', { ...base, cnaps: '102100099996', accountNumber: '1'.repeat(34) }).valid).toBe(true);
  });
});

describe('IN', () => {
  const valid = { bankName: 'Example Bank', ifsc: 'hdfc0001234', accountNumber: '123456789012' };
  it('accepts valid details and uppercases the IFSC', () => {
    const r = ok('IN', valid);
    expect(r.valid).toBe(true);
    expect(r.normalised.ifsc).toBe('HDFC0001234');
  });
  it('rejects a bad IFSC and account number', () => {
    expect(ok('IN', { ...valid, ifsc: 'HDFC000123' }).errors.ifsc).toMatch(/11/);
    expect(ok('IN', { ...valid, accountNumber: '12345' }).errors.accountNumber).toBeDefined();
    expect(ok('IN', { ...valid, accountNumber: '1'.repeat(21) }).errors.accountNumber).toBeDefined();
  });
});

describe('BD and NP', () => {
  it('BD needs a 9 digit routing number', () => {
    const valid = { bankName: 'Example Bank', routingNumber: '123456789', accountNumber: '1234567890' };
    expect(ok('BD', valid).valid).toBe(true);
    expect(ok('BD', { ...valid, routingNumber: '12345678' }).errors.routingNumber).toBeDefined();
  });
  it('NP accepts a bank code or a BIC', () => {
    const base = { bankName: 'Example Bank', accountNumber: '1234567890' };
    expect(ok('NP', { ...base, bankCode: 'np002' }).normalised.bankCode).toBe('NP002');
    expect(ok('NP', { ...base, bankCode: 'NP002' }).valid).toBe(true);
    expect(ok('NP', { ...base, bic: 'DEUTDEFF' }).valid).toBe(true);
    expect(ok('NP', base).valid).toBe(false);
    expect(ok('NP', { ...base, bankCode: 'NP02' }).errors.bankCode).toBeDefined();
  });
});

describe('Latin America', () => {
  it('MX checks the CLABE length and check digit', () => {
    expect(isValidClabe('002010077777777771')).toBe(true);
    expect(isValidClabe('002010077777777772')).toBe(false);
    expect(ok('MX', { clabe: '002 010 077777777771' }).valid).toBe(true);
    expect(ok('MX', { clabe: '00201007777777777' }).errors.clabe).toBeDefined();
    expect(ok('MX', { clabe: '002010077777777772' }).errors.clabe).toMatch(/check digit/);
  });
  it('AR needs a 22 digit CBU', () => {
    expect(ok('AR', { cbu: '1'.repeat(22) }).valid).toBe(true);
    expect(ok('AR', { cbu: '1'.repeat(21) }).errors.cbu).toBeDefined();
  });
  it('PE needs a 20 digit CCI and a type', () => {
    expect(ok('PE', { cci: '1'.repeat(20), accountType: 'maestra' }).valid).toBe(true);
    expect(ok('PE', { cci: '1'.repeat(19), accountType: 'savings' }).errors.cci).toBeDefined();
    expect(ok('PE', { cci: '1'.repeat(20), accountType: 'vista' }).errors.accountType).toBeDefined();
  });
  it('CL accepts vista and up to 3 digit bank codes', () => {
    const valid = { bankCode: '12', accountNumber: '123456789', accountType: 'vista' };
    expect(ok('CL', valid).valid).toBe(true);
    expect(ok('CL', { ...valid, bankCode: '1234' }).errors.bankCode).toBeDefined();
    expect(ok('CL', { ...valid, accountType: 'maestra' }).errors.accountType).toBeDefined();
  });
  it('CO checks bank code and account number lengths', () => {
    const valid = { bankCode: '007', accountNumber: '12345678901', accountType: 'savings' };
    expect(ok('CO', valid).valid).toBe(true);
    expect(ok('CO', { ...valid, bankCode: '7' }).errors.bankCode).toBeDefined();
    expect(ok('CO', { ...valid, accountNumber: '1'.repeat(19) }).errors.accountNumber).toBeDefined();
  });
});

describe('BR', () => {
  const valid = { bankCode: '341', branch: '1234', accountNumber: '12345-6', accountType: 'checking' };
  it('accepts domestic details, with dots and dashes allowed', () => {
    expect(ok('BR', valid).valid).toBe(true);
    expect(ok('BR', { ...valid, branch: '1234-5' }).valid).toBe(true);
  });
  it('accepts an IBAN as an alternative', () => {
    expect(ok('BR', { iban: 'BR1800360305000010009795493C1' }).valid).toBe(true);
    expect(ok('BR', { iban: 'DE89370400440532013000' }).errors.iban).toMatch(/start with BR/);
  });
  it('requires one set and rejects bad values', () => {
    expect(ok('BR', {}).valid).toBe(false);
    expect(ok('BR', { ...valid, bankCode: '34' }).errors.bankCode).toBeDefined();
    expect(ok('BR', { ...valid, branch: '12' }).errors.branch).toBeDefined();
    expect(ok('BR', { ...valid, accountType: 'vista' }).errors.accountType).toBeDefined();
  });
});

describe('config and masking', () => {
  it('lists configured countries including specific and IBAN ones', () => {
    const list = getConfiguredCountries();
    for (const c of ['AU', 'US', 'GB', 'NZ', 'CA', 'JP', 'KR', 'ID', 'PH', 'TH', 'SG', 'CN', 'TW', 'LA', 'MX', 'BR', 'DE', 'FR']) expect(list).toContain(c);
  });
  it('drops values for fields the country does not use', () => {
    const r = ok('AU', { bsb: '123456', accountNumber: '12345678', routingNumber: '021000021' });
    expect(Object.keys(r.normalised)).toEqual(['bsb', 'accountNumber']);
  });
  it('masks sensitive fields to the last 4', () => {
    expect(
      maskBankDetails('US', { routingNumber: '021000021', accountNumber: '123456789', accountType: 'savings' }),
    ).toEqual({ routingNumber: '•••• 0021', accountNumber: '•••• 6789', accountType: 'savings' });
  });
});

const DOC_COUNTRIES = [
  'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH',
  'BD', 'BB', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'CV',
  'KH', 'CM', 'CA', 'IC', 'KY', 'CF', 'TD', 'CL', 'CN', 'CO', 'CK', 'CR', 'HR', 'CW', 'CY',
  'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ',
  'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GT',
  'GG', 'GN', 'GW', 'GY', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IE', 'IM', 'IL', 'IT',
  'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KR', 'XK', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS',
  'LR', 'LI', 'LT', 'LU', 'MK', 'MO', 'MG', 'MW', 'MY', 'MV', 'MH', 'MQ', 'MR', 'MU', 'YT',
  'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'NA', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE',
  'NG', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'PR',
  'QA', 'CG', 'RE', 'RO', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST',
  'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'ZA', 'ES', 'LK', 'SR', 'SE', 'CH',
  'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TC', 'TV', 'UG', 'UA', 'AE',
  'GB', 'US', 'UY', 'UZ', 'VU', 'VN', 'VG', 'WF', 'ZM', 'ZW',
];

const withCheckDigits = (prefix: string, bban: string): string => {
  const digits = (bban + prefix + '00')
    .split('')
    .map((ch) => (/\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55)))
    .join('');
  let rem = 0;
  for (const d of digits) rem = (rem * 10 + Number(d)) % 97;
  return `${prefix}${String(98 - rem).padStart(2, '0')}${bban}`;
};

describe('unsupported countries', () => {
  it('are not listed and are rejected by validation', () => {
    for (const c of ['BY', 'IQ', 'LY', 'RU', 'SD', 'SO', 'YE']) {
      expect(getConfiguredCountries()).not.toContain(c);
      expect(isCountrySupported(c)).toBe(false);
      expect(ok(c, { iban: 'DE89370400440532013000' }).errors.country).toMatch(/not supported/);
    }
    expect(isCountrySupported('de')).toBe(true);
  });
});

describe('Airwallex country coverage', () => {
  it('has a layout for every country in the payout requirements', () => {
    const configured = new Set(getConfiguredCountries());
    expect(DOC_COUNTRIES.filter((c) => !configured.has(c))).toEqual([]);
  });

  const accountOnly: [string, string, string, string][] = [
    // country, valid account, too short, too long
    ['DZ', 'A1234567', '1234', '1'.repeat(51)],
    ['PA', '1234567890', '1234', '1'.repeat(51)],
    ['ZM', '1234567890', '1234', '1'.repeat(51)],
    ['OM', 'OM12345678', '1234', '1'.repeat(51)],
    ['LS', '1234567890', '1234', '1'.repeat(36)],
    ['RW', '1234567890', '1234', '1'.repeat(36)],
    ['NA', '12345678', '1234567', '1'.repeat(51)],
    ['BJ', 'BJ1234567890123456789012'.slice(0, 24), '1'.repeat(23), '1'.repeat(25)],
    ['CM', '1'.repeat(23), '1'.repeat(22), '1'.repeat(24)],
  ];
  it.each(accountOnly)('%s account number rules', (country, valid, short, long) => {
    const base = { bankName: 'Example Bank', bic: 'DEUTDEFF' };
    expect(ok(country, { ...base, accountNumber: valid }).valid).toBe(true);
    expect(ok(country, { ...base, accountNumber: short }).errors.accountNumber).toBeDefined();
    expect(ok(country, { ...base, accountNumber: long }).errors.accountNumber).toBeDefined();
    expect(ok(country, { ...base, bic: '', accountNumber: valid }).errors.bic).toBeDefined();
  });

  it('registry IBAN countries Airwallex takes as account plus SWIFT no longer ask for an IBAN', () => {
    for (const c of ['OM', 'MN', 'NI', 'SV', 'UA', 'ME']) {
      expect(getBankFields(c).map((f) => f.key)).toEqual(['bankName', 'bic', 'accountNumber']);
    }
  });

  it('BW has an optional 6 digit branch code', () => {
    const base = { bankName: 'B', bic: 'DEUTDEFF', accountNumber: '1234567' };
    expect(ok('BW', base).valid).toBe(true);
    expect(ok('BW', { ...base, bankBranch: '123456' }).valid).toBe(true);
    expect(ok('BW', { ...base, bankBranch: '12345' }).errors.bankBranch).toBeDefined();
  });

  it('BO needs a bank code and a 5 to 15 digit account number', () => {
    expect(ok('BO', { bankCode: '1', accountNumber: '1234567890' }).valid).toBe(true);
    expect(ok('BO', { bankCode: '123', accountNumber: '1234567890' }).errors.bankCode).toBeDefined();
    expect(ok('BO', { bankCode: '6', accountNumber: '1'.repeat(16) }).errors.accountNumber).toBeDefined();
  });

  it('UY checks bank code, account, type and optional branch', () => {
    const valid = { bankCode: '137', accountNumber: '123456789012', accountType: 'savings', bankBranch: '123' };
    expect(ok('UY', valid).valid).toBe(true);
    expect(ok('UY', { ...valid, bankBranch: '' }).valid).toBe(true);
    expect(ok('UY', { ...valid, bankCode: '13' }).errors.bankCode).toBeDefined();
    expect(ok('UY', { ...valid, accountNumber: '123' }).errors.accountNumber).toBeDefined();
    expect(ok('UY', { ...valid, bankBranch: '12345' }).errors.bankBranch).toBeDefined();
  });

  it('MA needs a 24 digit RIB', () => {
    expect(ok('MA', { rib: '1'.repeat(24) }).valid).toBe(true);
    expect(ok('MA', { rib: '1'.repeat(23) }).errors.rib).toBeDefined();
  });

  it('CR needs an IBAN and a BIC', () => {
    const iban = 'CR05015202001026284066';
    expect(ok('CR', { iban, bic: 'BNCRCRSJ' }).valid).toBe(true);
    expect(ok('CR', { iban }).errors.bic).toBeDefined();
  });

  it('IBAN-like territories use a mod 97 check', () => {
    const mg = withCheckDigits('MG', '1'.repeat(23));
    expect(isValidIbanChecksum(mg)).toBe(true);
    expect(ok('MG', { iban: mg }).valid).toBe(true);
    expect(ok('MG', { iban: mg.slice(0, 2) + '00' + mg.slice(4) }).errors.iban).toBeDefined();
    expect(ok('MG', { iban: 'GB82WEST12345698765432' }).errors.iban).toMatch(/start with MG/);
    const ic = withCheckDigits('IC', '1'.repeat(20));
    expect(ok('IC', { iban: ic }).valid).toBe(true);
  });

  it('Channel Islands and the Isle of Man accept GB IBANs', () => {
    for (const c of ['GG', 'JE', 'IM']) {
      expect(ok(c, { iban: 'GB82 WEST 1234 5698 7654 32' }).valid).toBe(true);
      expect(ok(c, { iban: 'DE89370400440532013000' }).errors.iban).toBeDefined();
    }
  });

  it('BL accepts French IBANs', () => {
    expect(ok('BL', { iban: 'FR1420041010050500013M02606' }).valid).toBe(true);
  });
});
