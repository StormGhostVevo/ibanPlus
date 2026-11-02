/**
 * Countries that can be paid over a local rail, from Airwallex's "Local payout coverage" table.
 * Countries the table marks with ** (BF, CM, CF, TD, GQ, GA, GW, MG, NG, CG, SN) are left out on
 * purpose. Every other country is not offered: it can only be paid by international SWIFT transfer.
 */
export const LOCAL_RAIL_COUNTRIES = new Set([
  'AE', 'AR', 'AT', 'AU', 'BD', 'BE', 'BG', 'BH', 'BJ', 'BO', 'BR', 'BW', 'CA', 'CH', 'CI', 'CL', 'CN',
  'CO', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GM', 'GR', 'HK', 'HR', 'HU', 'ID', 'IE',
  'IL', 'IN', 'IS', 'IT', 'JP', 'KE', 'KR', 'LI', 'LK', 'LS', 'LT', 'LU', 'LV', 'MA', 'MC', 'MQ', 'MT',
  'MW', 'MX', 'MY', 'NA', 'NE', 'NL', 'NO', 'NP', 'NZ', 'PE', 'PH', 'PK', 'PL', 'PM', 'PT', 'PY', 'RO',
  'SE', 'SG', 'SI', 'SK', 'SM', 'TG', 'TH', 'TR', 'US', 'UY', 'VN', 'YT', 'ZA', 'ZM',
]);

/**
 * Local rails that still identify the bank by SWIFT/BIC code (the scheme itself is domestic, but
 * the payout needs a BIC). Kept with the BIC as a required field. Remove a code here and from
 * LOCAL_RAIL_COUNTRIES to stop supporting it.
 */
export const LOCAL_RAIL_NEEDS_BIC = new Set(['ID', 'MY', 'PH', 'SG', 'LK', 'TH', 'VN', 'PY', 'BJ', 'BW', 'CI', 'GM', 'KE', 'LS', 'MW', 'NA', 'NE', 'ZA', 'TG', 'ZM']);

export function isLocalRailCountry(country: string): boolean {
  return LOCAL_RAIL_COUNTRIES.has(country.toUpperCase());
}
