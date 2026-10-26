import { isValidBIC, isValidIBAN } from 'ibantools';
import type { Normaliser, ValidatorName } from './types';
import { electronicFormatIBAN } from 'ibantools';

/** ABA routing number checksum: 3(d1+d4+d7) + 7(d2+d5+d8) + (d3+d6+d9) divisible by 10. */
export function isValidAbaRouting(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const d = value.split('').map(Number);
  const sum =
    3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

export const validators: Record<ValidatorName, (value: string) => boolean> = {
  abaRouting: isValidAbaRouting,
  iban: (value) => isValidIBAN(value),
  bic: (value) => isValidBIC(value),
};

export function normaliseValue(value: string, how: Normaliser): string {
  switch (how) {
    case 'digits':
      return value.replace(/[\s-]/g, '');
    case 'digitsPad7': {
      const digits = value.replace(/[\s-]/g, '');
      return /^\d{4,6}$/.test(digits) ? digits.padStart(7, '0') : digits;
    }
    case 'iban':
      return electronicFormatIBAN(value) ?? value.replace(/\s/g, '').toUpperCase();
    case 'bic':
      return value.replace(/\s/g, '').toUpperCase();
    case 'trim':
      return value.trim();
    case 'none':
      return value;
  }
}
