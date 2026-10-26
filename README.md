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

- NZ: layout 2-4-7or8-2or3, matching Airwallex's 15 to 17 digit total. No checksum.
- CA: Airwallex accepts 7 to 21 digit account numbers, so that is accepted (7 to 12 is typical). No institution or transit checksum.
- AU: account numbers allowed 4 to 10 digits (Airwallex lists 4 to 9). BSB is not checked against the BSB directory.
- GB: no modulus check on sort code and account number, and the sort-code-plus-account IBAN is not cross-checked.
- US: routing checksum only, no Fedwire/ACH directory lookup. Account type is limited to checking and savings.
- Xero: only the AU flag exists here. The exact format Xero expects for AU bank details is not implemented.
- JP: bank code (4 digits) and branch code (3 digits) lengths could not be confirmed from the sources I found. Account types follow Airwallex: checking (toza) and savings, where savings means an ordinary deposit account (futsu). There is no chochiku option because Airwallex has no matching value. Account numbers are 4 to 8 digits, with 4 to 6 digits left-padded with zeros to 7 (per bank guidance), so 7 or 8 digits are stored.
- KR: bank code (3 digits) is confirmed but optional, since international transfers use SWIFT. Sources give 7 to 16 (Airwallex) and 11 to 16 (Worldpay), and ABN AMRO says there is no fixed format, Worldpay allows up to 20 for international wires, so 7 to 20 is accepted. Letters and numbers are accepted, as Airwallex describes the number as alphanumeric. A BIC is required.
- ID: The optional 3-digit bank code was kept on the team's advice. Neither Airwallex nor Xendit uses numeric bank codes for Indonesia (or Thailand), so it is unverified against those sources. Xendit lists 7 to 17 digits for the major banks and Airwallex allows up to 22, so 7 to 22 is accepted. A BIC is required, as Airwallex requires one for local IDR payouts.
- PH: Airwallex accepts 8 to 16 digits, so that is what is accepted, to avoid passing numbers that fail at payout. BIC is required because at least one provider requires it. No official BSP or PCHC source was found.
- TH: ABN AMRO says there is no fixed format and Airwallex allows 7 to 12 digits for local payouts and 7 to 19 for SWIFT payouts, so 7 to 19 is accepted. Narrow it to 12 if you only pay locally. BIC is required.
- JP, KR, ID, PH and TH formats come from payment provider and bank documentation, not the national payment authorities. Confirm against the receiving bank or your payout provider.
- SG, MY, VN, LK, FJ, KH, GH, KE, NG, ZA: bank name, BIC (required) and account number, from Airwallex payout pages. Ranges use the widest figure across local and SWIFT payouts. Where the page gave no minimum (VN, LK, FJ, KH, GH) a minimum of 5 was assumed.
- HK: bank code (3 digits) or BIC, plus 8 to 17 digit account number. The first 3 digits are usually the branch code, which is not checked.
- IN: IFSC is accepted as 11 letters or numbers (Airwallex). The standard format of 4 letters, a zero, then 6 characters is not enforced, so it could be tightened.
- BD: 9 digit routing number. No minimum account length was given, so 5 was assumed. NP: 5 character bank code (for example NP002) or a BIC.
- MX: CLABE is 18 digits. The check digit (weights 3, 7, 1) was added from the standard CLABE algorithm and is not on the Airwallex page, so confirm with a few real CLABEs. AR: 22 digit CBU, no check digit. PE: 20 digit CCI plus account type. CL, CO: bank code, account number and type. CO ranges are per bank on Airwallex, and the overall 3 to 18 is used.
- BR: bank code (3 digits), branch (4 to 7), account number (3 to 50, dots and dashes allowed, a minimum of 3 was assumed) and type, or an IBAN.
- AR, CL, CO, PE, MX, BR, NP, IN and the others above: Airwallex also requires a beneficiary tax ID (CPF, CUIT, RUT and similar) for some local payouts. That is not a bank detail and is not collected here.
- China and Taiwan: the Airwallex pages could not be read, so they are not specified.
- Fallback and IBAN country display names use `Intl.DisplayNames` (en-AU), so names depend on the runtime's ICU data.

## Countries to add later

CN, TW, LA, MM, BN, PG, WS, TO, VU, BO, EC, UY.

## Development

```bash
npm test
npm run typecheck
npm run build
```
