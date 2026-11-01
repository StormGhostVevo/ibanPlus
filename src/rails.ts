/**
 * Countries that can be paid over a local rail, taken from the Airwallex payout requirements doc
 * (26/10/2026). A country is local when it has at least one real local scheme. Rows whose scheme is
 * "n/a" (local currency paid over SWIFT, for example XOF, XAF, KES, NGN and ZAR) do not count.
 * Everything else in the doc's 205 countries is SWIFT only and is not supported.
 *
 * Countries in the Americas other than the US and Canada (AR, BO, BR, CL, CO, MX, PE, UY, and the
 * territories MQ and PM) have local rails in the doc but are left out on purpose. Their layouts
 * are still in countries.ts. To offer one again, add its code here and take it out of UNSUPPORTED.
 */
export const LOCAL_RAIL_COUNTRIES = new Set([
  'AE', 'AT', 'AU', 'BD', 'BE', 'BG', 'BH', 'CA', 'CH', 'CN', 'CY', 'CZ',
  'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HK', 'HR', 'HU', 'IE', 'IL', 'IN', 'IS', 'IT', 'JP',
  'KR', 'LI', 'LT', 'LU', 'LV', 'MA', 'MC', 'NL', 'NO', 'NP', 'NZ', 'PK', 'PL',
  'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'TR', 'US', 'YT', 'ID', 'LK', 'MY', 'PH', 'SG', 'TH', 'VN',
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
