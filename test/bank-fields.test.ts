import { describe, expect, it } from 'vitest';
import {
  getBankFields,
  getConfiguredCountries,
  isValidAbaRouting,
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
    expect(r.errors.accountNumber).toMatch(/6 to 10 digits/);
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
  it('rejects wrong lengths', () => {
    const r = ok('NZ', { bank: '1', branch: '345', accountBase: '123456', suffix: '0' });
    expect(Object.keys(r.errors)).toEqual(['bank', 'branch', 'accountBase', 'suffix']);
  });
});

describe('CA', () => {
  const valid = { institutionNumber: '004', transitNumber: '12345', accountNumber: '1234567' };
  it('accepts valid details', () => expect(ok('CA', valid).valid).toBe(true));
  it('rejects wrong lengths', () => {
    const r = ok('CA', { institutionNumber: '04', transitNumber: '1234', accountNumber: '123456' });
    expect(Object.keys(r.errors)).toEqual(['institutionNumber', 'transitNumber', 'accountNumber']);
  });
});

describe('JP', () => {
  const valid = { bankCode: '0001', branchCode: '001', accountType: 'futsu', accountNumber: '1234567' };
  it('accepts valid details', () => expect(ok('JP', valid).valid).toBe(true));
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
    expect(ok('KR', { ...valid, bankCode: '04' }).errors.bankCode).toBeDefined();
  });
});

describe('ID', () => {
  const valid = { bankName: 'Example Bank', accountNumber: '1234567890' };
  it('accepts valid details, BIC and bank code optional', () => {
    expect(ok('ID', valid).valid).toBe(true);
    expect(ok('ID', { ...valid, bankCode: '014', bic: 'CENAIDJA' }).valid).toBe(true);
  });
  it('rejects bad values', () => {
    expect(ok('ID', { ...valid, accountNumber: '123456' }).errors.accountNumber).toBeDefined();
    expect(ok('ID', { ...valid, bankCode: '14' }).errors.bankCode).toBeDefined();
    expect(ok('ID', { ...valid, bic: 'XX' }).errors.bic).toBeDefined();
    expect(ok('ID', { accountNumber: valid.accountNumber }).errors.bankName).toBeDefined();
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
  it('normalises case and spacing', () => {
    expect(ok('de', { iban: 'de89 3704 0044 0532 0130 00' }).normalised.iban).toBe(
      'DE89370400440532013000',
    );
  });
});

describe('fallback', () => {
  it('accepts other details alone, or a valid IBAN alone', () => {
    expect(ok('VN', { otherDetails: 'Acct 1234, Example Bank, branch 001' }).valid).toBe(true);
    expect(ok('VN', { iban: 'DE89370400440532013000' }).valid).toBe(true);
  });
  it('requires one of them', () => {
    expect(ok('VN', {}).valid).toBe(false);
    expect(ok('VN', { otherDetails: '   ' }).valid).toBe(false);
  });
  it('has the expected fields', () => {
    expect(getBankFields('VN').map((f) => f.key)).toEqual(['iban', 'bic', 'otherDetails']);
  });
});

describe('config and masking', () => {
  it('lists configured countries including specific and IBAN ones', () => {
    const list = getConfiguredCountries();
    for (const c of ['AU', 'US', 'GB', 'NZ', 'CA', 'JP', 'KR', 'ID', 'PH', 'TH', 'DE', 'FR']) expect(list).toContain(c);
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
