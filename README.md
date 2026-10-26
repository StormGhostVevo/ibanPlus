# bank-fields

Country-specific bank detail fields, validation and normalisation, built on [ibantools](https://github.com/Simplify/ibantools). Free to run: no paid APIs, no payment provider.

A form renders from `getBankFields(country)`, so adding a country means editing `src/countries.ts` only.

```ts
import { getBankFields, validateBankDetails, maskBankDetails, isXeroSyncable } from 'bank-fields';

getBankFields('US');            // fields, labels, help text, input modes, options
const r = validateBankDetails('US', { routingNumber: '021-000-021', accountNumber: '123456789', accountType: 'checking' });
r.valid;                         // true
r.errors;                        // { fieldKey: 'US routing numbers are 9 digits...' }
r.normalised;                    // cleaned values, safe to store with the country code
maskBankDetails('US', r.normalised); // last 4 only, for display after saving
isXeroSyncable('NZ');            // false, only AU is synced to Xero
```

Run `validateBankDetails` on both the client and the server. Changing country: call `getBankFields` for the new country and discard values for keys that no longer exist (confirm with the user first). Store the country code and the normalised structured fields, not a single string.

## Countries

AU, US, GB (sort code and account number, or IBAN), NZ, CA, JP, KR, ID, PH, TH, every IBAN registry country (IBAN plus optional BIC, with a country prefix check), and a fallback for anything else (IBAN, BIC, free-text other details, at least one of IBAN or other details required).

## Scope and caveats

Validation catches typos only and cannot confirm an account exists. Rules are deliberately lenient where lengths vary. Encryption at rest, log redaction and role-based access are the host application's job; this library only provides `maskBankDetails` and the `sensitive` flag on each field. Never log values from `validateBankDetails`.

## Not verified against official standards (do before release)

- NZ: layout assumed 2-4-7-2/3. Some older accounts have an 8 digit base number, which would be rejected.
- CA: account number length of 7 to 12 is a typical range, not confirmed. No institution/transit checksum.
- AU: account numbers allowed 6 to 10 digits. BSB is not checked against the BSB directory.
- GB: no modulus check on sort code and account number, and the sort-code-plus-account IBAN is not cross-checked.
- US: routing checksum only, no Fedwire/ACH directory lookup. Account type is limited to checking and savings.
- Xero: only the AU flag exists here. The exact format Xero expects for AU bank details is not implemented.
- JP: bank code (4 digits) and branch code (3 digits) lengths could not be confirmed from the sources I found. Account types futsu, toza and chochiku are accepted, although one source lists only futsu and toza. Account numbers are usually 7 digits, 6 to 8 accepted.
- KR: bank code (3 digits) is confirmed but optional, since international transfers use SWIFT. Account length sources conflict (11 to 16, 14, and an anecdote), so 10 to 16 is accepted. A BIC is required.
- ID: 3-digit bank codes are consistent across sources. Account lengths differ by bank and by source, so 7 to 17 is accepted. Not checked per bank.
- PH: provider ranges differ (8 to 16, 6 to 18, 1 to 17, up to 20), so 6 to 18 is accepted. BIC is required because at least one provider requires it. No official BSP or PCHC source was found.
- TH: ABN AMRO says there is no fixed format and one provider allows 7 to 12 digits, which is what is accepted. BIC is required.
- JP, KR, ID, PH and TH formats come from payment provider and bank documentation, not the national payment authorities. Confirm against the receiving bank or your payout provider.
- Fallback and IBAN country display names use `Intl.DisplayNames` (en-AU), so names depend on the runtime's ICU data.

## Countries to add later

SG, HK, IN, MY, VN (Southeast Asia priorities), ZA, MX.

## Development

```bash
npm test
npm run typecheck
npm run build
```
