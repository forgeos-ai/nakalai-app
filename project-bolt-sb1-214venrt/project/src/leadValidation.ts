/** Indian mobile: exactly 10 digits, first digit 6–9. */
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

/** Strict email: local@domain.tld with reasonable length bounds. */
const EMAIL_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Common disposable / temporary email domains (zero-infra blocklist). */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'mailinator.net',
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'yopmail.com',
  'yopmail.fr',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'throwaway.email',
  'trashmail.com',
  'getnada.com',
  'moakt.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  'mailnesia.com',
  'mintemail.com',
  'emailondeck.com',
]);

/** Obvious spam / placeholder local-parts. */
const SPAM_EMAIL_PREFIXES = new Set([
  'test',
  'testing',
  'asdf',
  'asdfg',
  'abc',
  'abcd',
  'qwerty',
  'qwertyuiop',
  'admin',
  'user',
  'username',
  'email',
  'mail',
  'sample',
  'demo',
  'fake',
  'xxx',
  'xyz',
  'aaa',
  'bbb',
  'ccc',
  '123',
  '1234',
  '12345',
  'null',
  'undefined',
  'noreply',
  'no-reply',
]);

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(value.trim());
}

export function isValidEmailFormat(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

function emailLocalPart(email: string): string {
  return email.trim().toLowerCase().split('@')[0] ?? '';
}

function emailDomain(email: string): string {
  const parts = email.trim().toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

export function isDisposableEmailDomain(value: string): boolean {
  const domain = emailDomain(value);
  if (!domain) return true;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  // Match subdomains of known disposable hosts (e.g. mail.yopmail.com)
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function hasSpamEmailPrefix(value: string): boolean {
  const local = emailLocalPart(value);
  if (!local) return true;
  const base = local.split('+')[0] ?? local;
  return SPAM_EMAIL_PREFIXES.has(base);
}

export type LeadFieldErrors = Partial<
  Record<'fullName' | 'email' | 'mobileNumber' | 'dpdpConsent', string>
>;

/**
 * Client-side lead quality gate. Returns field errors; empty object = valid.
 * Call before any Supabase insert.
 */
export function validateLeadFields(input: {
  fullName: string;
  email: string;
  mobileNumber: string;
  dpdpConsent: boolean;
}): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  const name = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const mobile = input.mobileNumber.trim();

  if (!name || name.length < 2) {
    errors.fullName = 'Please enter your full name';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmailFormat(email)) {
    errors.email = 'Enter a valid email address';
  } else if (isDisposableEmailDomain(email)) {
    errors.email = 'Temporary or disposable email addresses are not allowed';
  } else if (hasSpamEmailPrefix(email)) {
    errors.email = 'Please use your real email address';
  }

  if (!mobile) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (!isValidIndianMobile(mobile)) {
    errors.mobileNumber = 'Enter a valid 10-digit Indian mobile (starts with 6–9)';
  }

  if (!input.dpdpConsent) {
    errors.dpdpConsent = 'You must consent under the DPDP Act to continue';
  }

  return errors;
}
