import { describe, expect, it } from 'vitest';
import {
  getBankFields,
  getConfiguredCountries,
  getCountryConfig,
  getUnsupportedReason,
  isCountrySupported,
  isValidAbaRouting,
  isValidClabe,
  isValidIbanChecksum,
  isXeroSyncable,
  maskBankDetails,
  validateBankDetails,
  validateFields,
} from '../src';
import type { FieldConfig } from '../src';
import { LOCAL_RAIL_COUNTRIES, LOCAL_RAIL_NEEDS_BIC } from '../src/rails';

/** Every country gets recipient name, bank name and address, so tests start from valid ones. */
const common = { recipientName: 'Example Pty Ltd', bankName: 'Example Bank', address: '1 Example St, City, Country' };
const ok = (country: string, values: Record<string, string>) =>
  validateBankDetails(country, { ...common, ...values });
const errorKeys = (country: string, values: Record<string, string>) =>
  Object.keys(ok(country, values).errors).sort();

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

const clabe = (first17: string): string => {
  const w = [3, 7, 1];
  const sum = first17.split('').reduce((a, d, i) => a + ((Number(d) * w[i % 3]) % 10), 0);
  return first17 + String((10 - (sum % 10)) % 10);
};

describe('checksums', () => {
  it('ABA routing', () => {
    expect(isValidAbaRouting('121000358')).toBe(true);
    expect(isValidAbaRouting('121000359')).toBe(false);
    expect(isValidAbaRouting('12100035')).toBe(false);
  });
  it('CLABE', () => {
    expect(isValidClabe(clabe('01218000011835678'))).toBe(true);
    expect(isValidClabe('012180000118356780')).toBe(false);
  });
  it('IBAN mod 97', () => {
    expect(isValidIbanChecksum('GB82WEST12345698765432')).toBe(true);
    expect(isValidIbanChecksum('GB82WEST12345698765433')).toBe(false);
  });
});

describe('support rule', () => {
  it('supports exactly the local rail countries, and lists them all', () => {
    expect([...LOCAL_RAIL_COUNTRIES].sort()).toEqual(getConfiguredCountries());
    expect(getConfiguredCountries()).toHaveLength(82);
  });

  it('puts every country in the payout doc on one side or the other', () => {
    for (const c of DOC_COUNTRIES) {
      expect(isCountrySupported(c)).toBe(LOCAL_RAIL_COUNTRIES.has(c));
      expect(getUnsupportedReason(c) === null).toBe(isCountrySupported(c));
    }
  });

  it('rejects SWIFT-only countries and says why', () => {
    for (const c of ['FJ', 'TW', 'AL', 'SA', 'EG', 'GH', 'GI', 'RW', 'NG', 'MG', 'BF', 'CM', 'CF', 'TD', 'GQ', 'GA', 'GW', 'CG', 'SN']) {
      expect(isCountrySupported(c)).toBe(false);
      expect(getConfiguredCountries()).not.toContain(c);
      expect(ok(c, { iban: 'DE89370400440532013000' }).errors.country).toMatch(/SWIFT/);
    }
  });

  it('rejects sanctioned countries with a different message', () => {
    for (const c of ['BY', 'IQ', 'LY', 'RU', 'SD', 'SO', 'YE']) {
      expect(isCountrySupported(c)).toBe(false);
      expect(ok(c, {}).errors.country).toMatch(/not supported/);
    }
  });

  it('only the local rails that identify the bank by BIC ask for one', () => {
    expect([...LOCAL_RAIL_NEEDS_BIC].sort()).toEqual([
      'BJ', 'BW', 'CI', 'GM', 'ID', 'KE', 'LK', 'LS', 'MW', 'MY', 'NA', 'NE', 'PH', 'PY', 'SG', 'TG', 'TH', 'VN', 'ZA', 'ZM',
    ]);
    for (const c of getConfiguredCountries()) {
      const hasBic = getBankFields(c).some((f) => f.key === 'bic');
      expect(hasBic).toBe(LOCAL_RAIL_NEEDS_BIC.has(c));
    }
  });
});

describe('common fields', () => {
  it('every supported country starts with recipient name and bank name and ends with address', () => {
    for (const c of getConfiguredCountries()) {
      const keys = getBankFields(c).map((f) => f.key);
      const nameAt = keys.indexOf('recipientName');
      expect(nameAt).toBe(0);
      expect(keys).toContain('bankName');
      expect(keys[keys.length - 1]).toBe('address');
      expect(keys).toContain('bankAddress');
      expect(keys).not.toContain('phone');
      expect(getCountryConfig(c).rail).toBe('local');
    }
  });

  it('requires recipient name, bank name and address, but not bank address', () => {
    const r = validateBankDetails('AU', { bsb: '123456', accountNumber: '12345678' });
    expect(Object.keys(r.errors).sort()).toEqual(['address', 'bankName', 'recipientName']);
  });
});

describe('English speaking local rails', () => {
  it('AU', () => {
    const r = ok('AU', { bsb: '123-456', accountNumber: '12345678' });
    expect(r.valid).toBe(true);
    expect(r.normalised.bsb).toBe('123456');
    expect(errorKeys('AU', { bsb: '12345', accountNumber: '123' })).toEqual(['accountNumber', 'bsb']);
    expect(isXeroSyncable('AU')).toBe(true);
    expect(getConfiguredCountries().filter(isXeroSyncable)).toEqual(['AU']);
  });

  it('US', () => {
    const v = { routingNumber: '121000358', accountNumber: '325193751776', accountType: 'checking' };
    expect(ok('US', v).valid).toBe(true);
    expect(ok('US', { ...v, routingNumber: '121000359' }).errors.routingNumber).toMatch(/ABA/);
    expect(ok('US', { ...v, accountType: 'current' }).errors.accountType).toBeDefined();
  });

  it('GB takes sort code and account number, or an IBAN alone', () => {
    expect(ok('GB', { sortCode: '12-34-56', accountNumber: '12345678' }).valid).toBe(true);
    expect(ok('GB', { iban: 'GB82 WEST 1234 5698 7654 32' }).valid).toBe(true);
    expect(errorKeys('GB', {})).toEqual(['accountNumber', 'iban', 'sortCode']);
    expect(ok('GB', { iban: 'DE89370400440532013000' }).errors.iban).toBeDefined();
  });

  it('NZ and CA', () => {
    expect(ok('NZ', { bank: '01', branch: '0123', accountBase: '0123456', suffix: '00' }).valid).toBe(true);
    expect(ok('NZ', { bank: '1', branch: '0123', accountBase: '0123456', suffix: '00' }).errors.bank).toBeDefined();
    expect(ok('CA', { institutionNumber: '004', transitNumber: '12345', accountNumber: '1234567' }).valid).toBe(true);
    expect(ok('CA', { institutionNumber: '04', transitNumber: '12345', accountNumber: '1234567' }).errors.institutionNumber).toBeDefined();
  });
});

describe('Asia', () => {
  it('JP', () => {
    const v = { bankCode: '0001', branchCode: '123', accountType: 'savings', accountNumber: '1234567' };
    expect(ok('JP', v).valid).toBe(true);
    expect(ok('JP', { ...v, accountNumber: '12345' }).normalised.accountNumber).toBe('0012345');
    expect(ok('JP', { ...v, accountType: 'chochiku' }).errors.accountType).toBeDefined();
  });

  it('KR uses a bank code and no BIC', () => {
    expect(ok('KR', { bankCode: '004', accountNumber: '12345678901' }).valid).toBe(true);
    expect(errorKeys('KR', { accountNumber: '123' })).toEqual(['accountNumber', 'bankCode']);
    expect(ok('KR', { bankCode: '004', accountNumber: '1'.repeat(17) }).errors.accountNumber).toBeDefined();
  });

  it('HK uses a bank code and no BIC', () => {
    expect(ok('HK', { bankCode: '024', accountNumber: '12345678901' }).valid).toBe(true);
    expect(errorKeys('HK', { accountNumber: '12345678901' })).toEqual(['bankCode']);
  });

  it('IN needs an IFSC', () => {
    expect(ok('IN', { ifsc: 'hdfc0001234', accountNumber: '123456789' }).normalised.ifsc).toBe('HDFC0001234');
    expect(ok('IN', { ifsc: 'HDFC001', accountNumber: '123456789' }).errors.ifsc).toBeDefined();
  });

  it('NP needs a bank code', () => {
    expect(ok('NP', { bankCode: 'np002', accountNumber: '1234567890' }).valid).toBe(true);
    expect(errorKeys('NP', { accountNumber: '1234567890' })).toEqual(['bankCode']);
  });

  it('BD and PK are for individuals only', () => {
    const bd = { routingNumber: '123456789', accountNumber: '1234567890' };
    expect(ok('BD', { ...bd, holderType: 'individual' }).valid).toBe(true);
    expect(ok('BD', { ...bd, holderType: 'business' }).errors.holderType).toMatch(/individuals only/);
    const pk = { iban: 'PK36SCBL0000001123456702', paymentReason: 'other_services' };
    expect(ok('PK', { ...pk, holderType: 'individual' }).valid).toBe(true);
    expect(ok('PK', { ...pk, holderType: 'business' }).errors.holderType).toBeDefined();
    expect(ok('PK', { holderType: 'individual', iban: pk.iban }).errors.paymentReason).toBeDefined();
  });

  it('CN asks for different details by holder type', () => {
    const base = { cnaps: '102100099996', accountNumber: '6222021234567890' };
    const person = { ...base, holderType: 'individual', idNumber: '110101199003078888' };
    expect(ok('CN', person).valid).toBe(true);
    expect(ok('CN', person).normalised.legalRepId).toBe('');
    const firm = {
      ...base, holderType: 'business', businessRegistrationNumber: '91110000MA01ABCD12',
      legalRepFirstName: '明', legalRepLastName: '王', legalRepId: '110101199003078888',
    };
    expect(ok('CN', firm).valid).toBe(true);
    expect(ok('CN', { ...firm, legalRepLastName: 'Wang' }).errors.legalRepLastName).toBeDefined();
    expect(errorKeys('CN', { ...base, holderType: 'business' })).toEqual([
      'businessRegistrationNumber', 'legalRepFirstName', 'legalRepId', 'legalRepLastName',
    ]);
    expect(errorKeys('CN', { ...base, holderType: 'individual' })).toEqual(['idNumber']);
  });

  it.each([
    ['ID', 'CENAIDJA', '1234567890'],
    ['PH', 'BOPIPHMM', '12345678'],
    ['TH', 'KASITHBK', '1234567890'],
    ['SG', 'DBSSSGSG', '1234567'],
    ['MY', 'MBBEMYKL', '1234567890'],
    ['VN', 'BFTVVNVX', '123456789'],
    ['LK', 'BCEYLKLX', '123456789'],
  ])('%s local rail needs a BIC to identify the bank', (country, bic, accountNumber) => {
    expect(ok(country, { bic, accountNumber }).valid).toBe(true);
    expect(ok(country, { accountNumber }).errors.bic).toBeDefined();
    expect(ok(country, { bic: 'BAD', accountNumber }).errors.bic).toBeDefined();
  });
});

describe('IBAN countries', () => {
  it.each([
    ['DE', 'DE89 3704 0044 0532 0130 00'],
    ['FR', 'FR1420041010050500013M02606'],
    ['NL', 'NL91 ABNA 0417 1643 00'],
    ['IE', 'IE29AIBK93115212345678'],
    ['AE', 'AE070331234567890123456'],
    ['BH', 'BH67BMAG00001299123456'],
    ['TR', 'TR330006100519786457841326'],
    ['IL', 'IL620108000000099999999'],
    ['MT', 'MT84MALT011000012345MTLCAST001S'],
    ['MQ', 'FR1420041010050500013M02606'],
    ['PM', 'FR1420041010050500013M02606'],
    ['YT', 'FR1420041010050500013M02606'],
  ])('%s accepts a valid IBAN and no BIC is asked for', (country, iban) => {
    expect(ok(country, { iban }).valid).toBe(true);
    expect(getBankFields(country).map((f) => f.key)).not.toContain('bic');
  });

  it('rejects a bad checksum and a wrong country prefix, and normalises case and spaces', () => {
    expect(ok('DE', { iban: 'DE89 3704 0044 0532 0130 01' }).errors.iban).toBeDefined();
    expect(ok('DE', { iban: 'FR1420041010050500013M02606' }).errors.iban).toMatch(/start with DE/);
    expect(ok('DE', { iban: 'de89 3704 0044 0532 0130 00' }).normalised.iban).toBe('DE89370400440532013000');
  });
});

describe('Africa and Morocco', () => {
  it('MA needs a 24 digit RIB', () => {
    expect(ok('MA', { rib: '1'.repeat(24) }).valid).toBe(true);
    expect(ok('MA', { rib: '1'.repeat(23) }).errors.rib).toBeDefined();
  });

  it.each([
    ['BJ', '1'.repeat(24), '1'.repeat(23), '1'.repeat(25)],
    ['NE', '1'.repeat(24), '1'.repeat(23), '1'.repeat(25)],
    ['TG', '1'.repeat(24), '1'.repeat(23), '1'.repeat(25)],
    ['CI', '1'.repeat(24), '1'.repeat(23), '1'.repeat(25)],
    ['KE', '12345678', '1234567', '1'.repeat(21)],
    ['NA', '12345678', '1234567', '1'.repeat(14)],
    ['GM', '1234567890', '1234', '1'.repeat(36)],
    ['LS', '1234567890', '1234', '1'.repeat(36)],
    ['MW', '1234567890', '1234', '1'.repeat(36)],
    ['ZM', '1234567890', '1234', '1'.repeat(36)],
    ['BW', '1234567890', '1234', '1'.repeat(34)],
    ['ZA', '1234567890', '123456', '1'.repeat(14)],
  ])('%s local rail takes a BIC and an account number of the right length', (country, valid, short, long) => {
    const base = { bic: 'DEUTDEFF' };
    expect(ok(country, { ...base, accountNumber: valid, accountType: 'checking' }).valid).toBe(true);
    expect(ok(country, { ...base, accountNumber: short, accountType: 'checking' }).errors.accountNumber).toBeDefined();
    expect(ok(country, { ...base, accountNumber: long, accountType: 'checking' }).errors.accountNumber).toBeDefined();
    expect(ok(country, { accountNumber: valid, accountType: 'checking' }).errors.bic).toBeDefined();
  });

  it('ZA needs an account type', () => {
    expect(ok('ZA', { bic: 'DEUTDEFF', accountNumber: '1234567890' }).errors.accountType).toBeDefined();
  });
});

describe('the Americas', () => {
  it('MX checks the CLABE', () => {
    expect(ok('MX', { clabe: clabe('01218000011835678') }).valid).toBe(true);
    expect(ok('MX', { clabe: '012180000118356780' }).errors.clabe).toBeDefined();
  });

  it('AR needs a CBU and a CUIT or CUIL', () => {
    const v = { cbu: '1'.repeat(22), taxId: '20-12345678-9' };
    expect(ok('AR', v).valid).toBe(true);
    expect(ok('AR', v).normalised.taxId).toBe('20123456789');
    expect(errorKeys('AR', { cbu: '1'.repeat(22) })).toEqual(['taxId']);
  });

  it('BR needs a CPF for individuals and a CNPJ for businesses', () => {
    const v = { bankCode: '341', branch: '1234', accountNumber: '12345-6', accountType: 'checking' };
    expect(ok('BR', { ...v, holderType: 'individual', taxId: '123.456.789-09' }).valid).toBe(true);
    expect(ok('BR', { ...v, holderType: 'business', taxId: '12.345.678/0001-95' }).valid).toBe(true);
    expect(ok('BR', { ...v, holderType: 'business', taxId: '12345678909' }).errors.taxId).toBeDefined();
    expect(ok('BR', { ...v, holderType: 'individual', taxId: '12345678000195' }).errors.taxId).toBeDefined();
    expect(getBankFields('BR').map((f) => f.key)).not.toContain('iban');
  });

  it('CL needs a RUT', () => {
    const v = { bankCode: '12', accountNumber: '12345678', accountType: 'vista' };
    expect(ok('CL', { ...v, taxId: '12.345.678-K' }).valid).toBe(true);
    expect(ok('CL', { ...v, taxId: '123' }).errors.taxId).toBeDefined();
  });

  it('CO needs an ID, and an email for individuals', () => {
    const v = { bankCode: '007', accountNumber: '1234567890', accountType: 'savings' };
    const person = { ...v, holderType: 'individual', idType: 'cc', idNumber: '1234567890', email: 'a@example.com' };
    expect(ok('CO', person).valid).toBe(true);
    expect(ok('CO', { ...person, email: '' }).errors.email).toBeDefined();
    expect(ok('CO', { ...v, holderType: 'business', idType: 'nit', idNumber: '1234567890' }).valid).toBe(true);
    expect(ok('CO', { ...person, idType: 'nit', idNumber: '123' }).errors.idNumber).toBeDefined();
  });

  it('PE, UY, BO and PY check the ID number against the chosen ID type', () => {
    const pe = { cci: '1'.repeat(20), accountType: 'maestra' };
    expect(ok('PE', { ...pe, idType: 'dni', idNumber: '12345678' }).valid).toBe(true);
    expect(ok('PE', { ...pe, idType: 'ruc', idNumber: '12345678' }).errors.idNumber).toBeDefined();
    const uy = { bankCode: '001', accountNumber: '1234567', accountType: 'savings' };
    expect(ok('UY', { ...uy, idType: 'rut', idNumber: '123456789012' }).valid).toBe(true);
    expect(ok('UY', { ...uy, idType: 'rut', idNumber: '12345678' }).errors.idNumber).toBeDefined();
    const bo = { bankCode: '1', accountNumber: '1234567890' };
    expect(ok('BO', { ...bo, idType: 'ce', idNumber: 'E-1234567' }).valid).toBe(true);
    expect(ok('BO', { ...bo, idType: 'ci', idNumber: 'E-1234567' }).errors.idNumber).toBeDefined();
    const py = { bic: 'BASAPYPX', accountNumber: '1234567890' };
    expect(ok('PY', { ...py, idType: 'ruc', idNumber: '12345678901' }).valid).toBe(true);
    expect(ok('PY', { ...py, idType: 'ruc', idNumber: '123' }).errors.idNumber).toBeDefined();
    expect(ok('PY', py).errors.idType).toBeDefined();
  });
});

describe('conditional fields', () => {
  const holder: FieldConfig = { key: 'holderType', label: 'Type', helpText: '', required: true, errorMessage: 'x', normalise: 'trim', inputMode: 'text', maxLength: 10, sensitive: false };
  const idNumber: FieldConfig = {
    key: 'idNumber', label: 'ID', helpText: '', required: true, errorMessage: 'Bad ID.', normalise: 'alnum', inputMode: 'text', maxLength: 20, sensitive: true,
    patternWhen: { field: 'holderType', patterns: { individual: /^\d{11}$/, business: /^\d{14}$/ } },
  };
  const email: FieldConfig = { ...holder, key: 'email', appliesWhen: { field: 'holderType', in: ['individual'] } };

  it('picks the ID pattern from another field', () => {
    const f = [holder, idNumber];
    expect(validateFields([...f], { holderType: 'individual', idNumber: '123.456.789-09' }, 'X').valid).toBe(true);
    expect(validateFields([...f], { holderType: 'individual', idNumber: '12345678000195' }, 'X').errors.idNumber).toBe('Bad ID.');
    expect(validateFields([...f], { holderType: 'business', idNumber: '12345678000195' }, 'X').valid).toBe(true);
  });

  it('skips fields that do not apply', () => {
    const f = [holder, email];
    expect(validateFields([...f], { holderType: 'business' }, 'X').valid).toBe(true);
    expect(validateFields([...f], { holderType: 'individual' }, 'X').errors.email).toBeDefined();
    expect(validateFields([...f], { holderType: 'business', email: 'a@b.co' }, 'X').normalised.email).toBe('');
  });
});

describe('masking and normalising', () => {
  it('drops values for fields the country does not use', () => {
    const r = ok('AU', { bsb: '123456', accountNumber: '12345678', iban: 'DE89370400440532013000' });
    expect(r.normalised.iban).toBeUndefined();
  });

  it('masks account details but not names or address', () => {
    const masked = maskBankDetails('AU', { ...common, bsb: '123456', accountNumber: '12345678' });
    expect(masked.accountNumber).toBe('•••• 5678');
    expect(masked.bsb).toBe('•••• 3456');
    expect(masked.recipientName).toBe(common.recipientName);
    expect(masked.address).toBe(common.address);
  });
});

describe('placeholders', () => {
  const all = [...getConfiguredCountries(), 'XX'];
  it('every field of every country has a placeholder', () => {
    const empty = all.flatMap((c) => getBankFields(c).filter((f) => !f.placeholder).map((f) => `${c}.${f.key}`));
    expect(empty).toEqual([]);
  });
  it('placeholders for pattern-only fields match the pattern once cleaned', () => {
    const bad: string[] = [];
    for (const c of all) {
      for (const f of getBankFields(c)) {
        if (!f.pattern || f.validate || f.options || f.key === 'bic' || f.patternWhen) continue;
        const cleaned = f.placeholder!.replace(/[\s-]/g, '');
        const candidate = f.normalise === 'upper' || f.normalise === 'alnum' ? cleaned.toUpperCase() : cleaned;
        if (!f.pattern.test(candidate) && !f.pattern.test(f.placeholder!)) bad.push(`${c}.${f.key}=${f.placeholder}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('shows the expected formats', () => {
    const p = (c: string, k: string) => getBankFields(c).find((f) => f.key === k)?.placeholder;
    expect(p('AU', 'bsb')).toBe('123-456');
    expect(p('GB', 'sortCode')).toBe('12-34-56');
    expect(p('JP', 'bankCode')).toBe('1234');
    expect(p('IN', 'ifsc')).toBe('ABCD0123456');
    expect(p('DE', 'iban')).toBe('DE00 1234 5678 9012 3456 78');
  });
});
