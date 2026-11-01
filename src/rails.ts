/**
 * Countries that can be paid over a local rail, taken from the Airwallex payout requirements doc
 * (26/10/2026). A country is local when it has at least one real local scheme. Rows whose scheme is
 * "n/a" (local currency paid over SWIFT, for example XOF, XAF, KES, NGN and ZAR) do not count.
 * Everything else in the doc's 205 countries is SWIFT only and is not supported.
 */
export const LOCAL_RAIL_COUNTRIES = new Set([
  'AE', 'AR', 'AT', 'AU', 'BD', 'BE', 'BG', 'BH', 'BO', 'BR', 'CA', 'CH', 'CL', 'CN', 'CO', 'CY', 'CZ',
  'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HK', 'HR', 'HU', 'IE', 'IL', 'IN', 'IS', 'IT', 'JP',
  'KR', 'LI', 'LT', 'LU', 'LV', 'MA', 'MC', 'MQ', 'MX', 'NL', 'NO', 'NP', 'NZ', 'PE', 'PK', 'PL', 'PM',
  'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'TR', 'US', 'UY', 'YT', 'ID', 'LK', 'MY', 'PH', 'SG', 'TH', 'VN',
]);

/**
 * Local rails that still identify the bank by SWIFT/BIC code (the scheme itself is domestic, but
 * the payout needs a BIC). Kept with the BIC as a required field. Remove a code here and from
 * LOCAL_RAIL_COUNTRIES to stop supporting it.
 */
export const LOCAL_RAIL_NEEDS_BIC = new Set(['ID', 'LK', 'MY', 'PH', 'SG', 'TH', 'VN']);

export function isLocalRailCountry(country: string): boolean {
  return LOCAL_RAIL_COUNTRIES.has(country.toUpperCase());
}
