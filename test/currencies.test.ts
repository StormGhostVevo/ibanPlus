import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_CURRENCIES,
  getBankFieldsForCurrency,
  getCurrencyConfig,
  isCurrencySupported,
  maskBankDetailsForCurrency,
  validateBankDetailsForCurrency,
} from '../src';

const common = { recipientName: 'Example Pty Ltd', bankName: 'Example Bank', address: '1 Example St, Sydney, NSW, 2000, Australia' };
const keys = (c: string) => getBankFieldsForCurrency(c).map((f) => f.key);

describe('currency local rails', () => {
  it('supports the seven currencies and nothing else', () => {
    expect(SUPPORTED_CURRENCIES).toEqual(['USD', 'AUD', 'SGD', 'CAD', 'EUR', 'GBP', 'THB']);
    expect(isCurrencySupported('aud')).toBe(true);
    expect(isCurrencySupported('JPY')).toBe(false);
    expect(() => getCurrencyConfig('JPY')).toThrow(/Unsupported currency/);
  });

  it('puts recipient name and bank name first and address last on every currency', () => {
    for (const c of SUPPORTED_CURRENCIES) {
      const k = keys(c);
      expect(k.slice(0, 2)).toEqual(['recipientName', 'bankName']);
      expect(k.at(-1)).toBe('address');
      for (const f of getBankFieldsForCurrency(c)) expect(f.placeholder).toBeTruthy();
    }
  });

  it('uses local identifiers', () => {
    expect(keys('USD')).toEqual(['recipientName', 'bankName', 'routingNumber', 'accountNumber', 'accountType', 'address']);
    expect(keys('AUD')).toEqual(['recipientName', 'bankName', 'bsb', 'accountNumber', 'address']);
    expect(keys('CAD')).toEqual(['recipientName', 'bankName', 'institutionNumber', 'transitNumber', 'accountNumber', 'address']);
    expect(keys('GBP')).toEqual(['recipientName', 'bankName', 'sortCode', 'accountNumber', 'address']);
    expect(keys('SGD')).toEqual(['recipientName', 'bankName', 'bic', 'accountNumber', 'address']);
    expect(keys('THB')).toEqual(['recipientName', 'bankName', 'bic', 'bankCode', 'accountNumber', 'address']);
    expect(keys('EUR')).toEqual(['recipientName', 'bankName', 'iban', 'bic', 'address']);
  });

  it('validates USD with the ABA checksum and treats account type as optional', () => {
    const ok = validateBankDetailsForCurrency('USD', { ...common, routingNumber: '121000358', accountNumber: '325193751776' });
    expect(ok.valid).toBe(true);
    const bad = validateBankDetailsForCurrency('USD', { ...common, routingNumber: '121000359', accountNumber: '325193751776' });
    expect(bad.errors.routingNumber).toBeDefined();
  });

  it('requires recipient name, bank name and address', () => {
    const r = validateBankDetailsForCurrency('AUD', { bsb: '123-456', accountNumber: '12345678' });
    expect(Object.keys(r.errors).sort()).toEqual(['address', 'bankName', 'recipientName']);
  });

  it('validates AUD, CAD and GBP local details', () => {
    expect(validateBankDetailsForCurrency('AUD', { ...common, bsb: '123-456', accountNumber: '12345678' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('CAD', { ...common, institutionNumber: '004', transitNumber: '12345', accountNumber: '1234567' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('GBP', { ...common, sortCode: '12-34-56', accountNumber: '12345678' }).valid).toBe(true);
  });

  it('does not accept an IBAN in place of a GBP sort code and account number', () => {
    const r = validateBankDetailsForCurrency('GBP', { ...common, iban: 'GB82WEST12345698765432' });
    expect(r.errors.sortCode).toBeDefined();
    expect(r.errors.accountNumber).toBeDefined();
  });

  it('uses the local rail account ranges for SGD and THB', () => {
    const sg = { ...common, bic: 'DBSSSGSG' };
    expect(validateBankDetailsForCurrency('SGD', { ...sg, accountNumber: '1234567' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('SGD', { ...sg, accountNumber: '123456' }).errors.accountNumber).toBeDefined();
    expect(validateBankDetailsForCurrency('SGD', { ...sg, accountNumber: '12345678901234567' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('SGD', { ...sg, accountNumber: '123456789012345678' }).errors.accountNumber).toBeDefined();
    const th = { ...common, bic: 'KASITHBK' };
    expect(validateBankDetailsForCurrency('THB', { ...th, accountNumber: '1234567890' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('THB', { ...th, accountNumber: '1234567890123' }).errors.accountNumber).toBeDefined();
    expect(validateBankDetailsForCurrency('THB', { ...common, accountNumber: '1234567890' }).errors.bic).toBeDefined();
  });

  it('accepts SEPA IBANs for EUR and rejects other countries and bad checksums', () => {
    expect(validateBankDetailsForCurrency('EUR', { ...common, iban: 'DE89 3704 0044 0532 0130 00' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('EUR', { ...common, iban: 'FR1420041010050500013M02606' }).valid).toBe(true);
    expect(validateBankDetailsForCurrency('EUR', { ...common, iban: 'DE89 3704 0044 0532 0130 01' }).errors.iban).toBeDefined();
    expect(validateBankDetailsForCurrency('EUR', { ...common, iban: 'BR1800360305000010009795493C1' }).errors.iban).toMatch(/SEPA/);
  });

  it('flags only AUD as syncable to Xero', () => {
    expect(SUPPORTED_CURRENCIES.filter((c) => getCurrencyConfig(c).xeroSyncable)).toEqual(['AUD']);
  });

  it('masks account details but not names or address', () => {
    const masked = maskBankDetailsForCurrency('AUD', { ...common, bsb: '123456', accountNumber: '12345678' });
    expect(masked.accountNumber).toBe('•••• 5678');
    expect(masked.recipientName).toBe(common.recipientName);
    expect(masked.address).toBe(common.address);
  });
});
