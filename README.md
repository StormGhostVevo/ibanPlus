# bank-fields

Country-specific bank detail fields, validation and normalisation, built on [ibantools](https://github.com/Simplify/ibantools). Free to run: no paid APIs, no payment provider.

A form renders from `getBankFields(country)`, so adding a country means editing `src/countries.ts` and listing it in `src/rails.ts`.

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

Each field has a `placeholder`: grey example text in the format the field expects, for example `123-456` for a BSB or `1234` for a Japanese bank code. Pass it straight to the input's `placeholder` attribute.

A static reference of every field for every country is in `docs/FIELDS.md` (readable) and `docs/fields.json` (machine readable). Regenerate both with `npm run export-fields` after changing `src/countries.ts`. At runtime, use `getBankFields(country)` instead of the files.

Run `validateBankDetails` on both the client and the server. Changing country: call `getBankFields` for the new country and discard values for keys that no longer exist (confirm with the user first). Store the country code and the normalised structured fields, not a single string.

## Countries

82 countries, all paid over a local rail (`getCountryConfig(country).rail` is `'local'`). The list comes from Airwallex's "Local payout coverage" table. Countries the table marks with ** (Burkina Faso, Cameroon, Central African Republic, Chad, Equatorial Guinea, Gabon, Guinea-Bissau, Madagascar, Nigeria, Republic of the Congo and Senegal) are left out on purpose. Every other country can only be paid by international SWIFT transfer, which is not supported. `getConfiguredCountries()` leaves them out, `isCountrySupported()` returns false and `validateBankDetails` rejects them with "This country can only be paid by international (SWIFT) transfer, which is not supported." The list is in `docs/SWIFT_ONLY.md`.

No SWIFT code asked for (62): AE, AR, AT, AU, BD, BE, BG, BH, BO, BR, CA, CH, CL, CN, CO, CY, CZ, DE, DK, EE, ES, FI, FR, GB, GR, HK, HR, HU, IE, IL, IN, IS, IT, JP, KR, LI, LT, LU, LV, MA, MC, MQ, MT, MX, NL, NO, NP, NZ, PE, PK, PL, PM, PT, RO, SE, SI, SK, SM, TR, US, UY, YT. The SEPA and other IBAN countries ask for an IBAN only.

BIC required (20): ID, LK, MY, PH, SG, TH, VN, PY, and Benin, Botswana, Côte d'Ivoire, Gambia, Kenya, Lesotho, Malawi, Namibia, Niger, South Africa, Togo and Zambia. The scheme is domestic (for example BI-FAST, FAST, PromptPay, or a local currency payout), but the payout identifies the bank by SWIFT/BIC code. To drop any of them, remove its code from `LOCAL_RAIL_COUNTRIES` and `LOCAL_RAIL_NEEDS_BIC` in `src/rails.ts`.

West African accounts (Benin, Niger, Togo, Côte d'Ivoire) are exact lengths (24 characters). Côte d'Ivoire is not in the payout requirements doc, so 24 is assumed from the other XOF countries. Kenya is 8 to 20 characters, Namibia 8 to 13, South Africa 7 to 13 digits, and Botswana, Gambia, Lesotho, Malawi, Zambia and Paraguay up to 33 or 35.

`getCountryConfig` returns the old fallback layout for unsupported or unknown countries, but `validateBankDetails` rejects them, so it is not used for payouts.

## Fields every country asks for

Recipient name, bank name and address are required. Bank address is optional. There is no phone number field. Order: recipient name, account holder type (where used), bank name, bank address, the local rail fields, address. Airwallex does not list address or bank address as general bank requirements, so they are collected as a precaution.

Some rails need more, taken from the local rail and beneficiary ID sections of the doc:

| Country | Extra fields |
| --- | --- |
| AR | CUIT or CUIL (11 digits) |
| BO | ID type (CI, CE or NIT) and ID number |
| BR | Account holder type, then CPF (11 digits, individuals) or CNPJ (14 digits, businesses) |
| CL | RUT |
| CN | Account holder type. Individuals: Chinese national ID. Businesses: registration number, legal representative first and last name in Chinese, legal representative ID |
| CO | Account holder type, ID type and number, email (individuals) |
| PE, PY, UY | ID type (national ID, foreign ID, passport or tax ID) and ID number, checked against the chosen type |
| BD, PK | Account holder type, individuals only. PK also asks for a payment reason |

Fields that only apply sometimes use `appliesWhen`, which hides them in the form and skips them in validation. The ID number format follows the chosen ID type through `patternWhen`.

Colombia: Airwallex's local COP payouts also ask for a phone number (mobile for individuals, business phone for companies). It is not collected here, so Colombian payouts may be rejected or queried.

## Scope and caveats

Validation catches typos only and cannot confirm an account exists. Rules are deliberately lenient where lengths vary. Encryption at rest, log redaction and role-based access are the host application's job; this library only provides `maskBankDetails` and the `sensitive` flag on each field. Never log values from `validateBankDetails`.

## Not verified against official standards (do before release)

- NZ: layout 2-4-7or8-2or3, matching Airwallex's 15 to 17 digit total. No checksum.
- CA: Airwallex accepts 7 to 21 digit account numbers, so that is accepted (7 to 12 is typical). No institution or transit checksum.
- AU: account numbers allowed 4 to 10 digits (Airwallex lists 4 to 9). BSB is not checked against the BSB directory.
- GB: no modulus check on sort code and account number, and the sort-code-plus-account IBAN is not cross-checked.
- US: routing checksum only, no Fedwire/ACH directory lookup. Account type is limited to checking and savings.
- Xero: only the AU flag exists here. The exact format Xero expects for AU bank details is not implemented.
- ID: The optional 3-digit bank code was kept on the team's advice. Neither Airwallex nor Xendit uses numeric bank codes for Indonesia (or Thailand), so it is unverified against those sources. Xendit lists 7 to 17 digits for the major banks and Airwallex allows up to 22, so 7 to 22 is accepted. A BIC is required, as Airwallex requires one for local IDR payouts.
- PH: Airwallex accepts 8 to 16 digits, so that is what is accepted, to avoid passing numbers that fail at payout. BIC is required because at least one provider requires it. No official BSP or PCHC source was found.
- TH: ABN AMRO says there is no fixed format and Airwallex allows 7 to 12 digits for local payouts and 7 to 19 for SWIFT payouts, so 7 to 19 is accepted. Narrow it to 12 if you only pay locally. BIC is required.
- JP, KR, ID, PH and TH formats come from payment provider and bank documentation, not the national payment authorities. Confirm against the receiving bank or your payout provider.
- IN: IFSC is accepted as 11 letters or numbers (Airwallex). The standard format of 4 letters, a zero, then 6 characters is not enforced, so it could be tightened.
- Per-bank account formats (for example Sweden) are not enforced.
- Doc items still open: whether Albania's tax ID applies to all SWIFT payouts or only ALL, Montenegro's account name rule, Zambia's limit currency, and Botswana's note about Brazilian formats looking like a copy error.
- KR: bank code (3 digits) and a 7 to 16 letter or number account number (Airwallex HOFINET). No BIC. This replaces the earlier rule that required a BIC.
- HK: 3 digit bank code and an 8 to 17 digit account number (ACH). No BIC, and the FPS proxy ID routes (phone, email) are not offered.
- CN: 12 digit CNAPS code and an 8 to 34 digit account number. The account name must be in Chinese characters, which is not enforced on the recipient name. Local CNY transfers also need declarant and order information, which is not collected here.
- BD: 9 digit routing number, individuals only. NP: 5 character bank code. Account lengths: no minimum was given, so 5 was assumed.
- Local rails that Airwallex also offers through a proxy (PayID, PayNow, DuitNow ID, Interac, PIX keys, FPS proxy IDs) or as bill payments are not offered. Only bank details are collected.
- Sweden, Denmark and Norway have local non-IBAN fields (bank code plus account number) that are not collected. They take an IBAN.
- The doc's own open items are still open: Albania's tax ID wording (now moot, Albania is SWIFT only), Montenegro's account name rule, Zambia's limit currency and Botswana's Brazil note.
- Malta, Côte d'Ivoire and Paraguay are in Airwallex's local payout table but not in the 205 country payout requirements doc, so their layouts are the least checked. Paraguay's ID formats and Côte d'Ivoire's account length are unverified.
- Åland, Guadeloupe, Réunion, Saint Barthélemy, Saint Martin, French Guiana, Gibraltar, the Channel Islands and the Isle of Man are not in the table (the footnotes say FR, FI, GB, PT and ES IBANs may include accounts there), so they are not offered separately.
- Iraq, Libya, Sudan, Somalia, Yemen, Belarus and Russia are excluded for a different reason (not in the doc's list) and get the message "Payouts to this country are not supported."
- Fallback and IBAN country display names use `Intl.DisplayNames` (en-AU), so names depend on the runtime's ICU data.

## Development

```bash
npm test
npm run typecheck
npm run build
```

## Local demo

A small page for trying the fields by hand. It has no extra dependencies.

```bash
npm run demo
```

Open http://localhost:3000, type a country name or code, and the fields appear with their labels, help text and placeholders. Submitting runs `validateBankDetails` on the demo server and shows the masked result. Add `?country=JP` to the URL to open a country directly. The port can be changed with `PORT=4000 npm run demo`.

## Currency local rails

For Fabulate's own accounts, `getBankFieldsForCurrency(currency)` returns the local rail layout for one of USD, AUD, SGD, CAD, EUR, GBP and THB. Each layout uses the same common fields as the countries: recipient name, bank name, bank address (optional), the local identifiers, address.

| Currency | Rail | Local identifiers |
| --- | --- | --- |
| USD | ACH / Fedwire | ABA routing number, account number, account type (optional) |
| AUD | BECS / NPP | BSB, account number (syncs to Xero) |
| CAD | EFT | Institution number, transit number, account number |
| GBP | Faster Payments / BACS | Sort code, account number (no IBAN alternative) |
| SGD | FAST / GIRO | SWIFT code, account number 7 to 17 characters |
| THB | PromptPay | SWIFT code, optional bank code, account number 7 to 12 digits |
| EUR | SEPA | IBAN from a SEPA country, optional BIC |

```ts
import { getBankFieldsForCurrency, validateBankDetailsForCurrency, maskBankDetailsForCurrency } from 'bank-fields';

const fields = getBankFieldsForCurrency('AUD');
const result = validateBankDetailsForCurrency('AUD', values);
```

Unsupported currencies throw. The country functions are unchanged.

Assumptions to check:
- SGD and THB use the Airwallex FAST, GIRO and PromptPay formats, which identify the bank by SWIFT code. SGD is tighter than the country layout (RTGS allows up to 23 characters) and THB is tighter (the country layout allows up to 19 digits).
- The SEPA country list is not checked against the EPC register.
- Address is one free text line, as in the recipient details example. Split it into street, city, state and postcode if a provider needs structured addresses.
- The USD account type is optional because the example recipient details do not show one.
