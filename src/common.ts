import type { FieldConfig } from './types';

/** Fields every country asks for on top of its local rail details. */
export const recipientNameField = (): FieldConfig => ({
  key: 'recipientName',
  label: 'Recipient name',
  helpText: 'The full name of the account holder, exactly as it appears on the bank account.',
  placeholder: 'Full name or company name',
  required: true,
  pattern: /\S/,
  errorMessage: 'Enter the name of the account holder.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 140,
  sensitive: false,
});

export const bankAddressField = (): FieldConfig => ({
  key: 'bankAddress',
  label: 'Bank address',
  helpText: 'Optional. The address of your bank branch.',
  placeholder: '1 Example Street, City, Country',
  required: false,
  errorMessage: 'Enter the bank address.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 200,
  sensitive: false,
});

export const addressField = (): FieldConfig => ({
  key: 'address',
  label: 'Address',
  helpText: 'Recipient address: street, city, state or region, postcode and country.',
  placeholder: 'Unit 1, 123 Example Street, City, State, 1234, Country',
  required: true,
  pattern: /\S/,
  errorMessage: 'Enter the recipient address.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 200,
  sensitive: false,
});

export const emailField = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
  key: 'email',
  label: 'Email',
  helpText: 'Email address of the account holder.',
  placeholder: 'name@example.com',
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  errorMessage: 'Enter a valid email address.',
  normalise: 'trim',
  inputMode: 'text',
  maxLength: 100,
  sensitive: false,
  ...overrides,
});
