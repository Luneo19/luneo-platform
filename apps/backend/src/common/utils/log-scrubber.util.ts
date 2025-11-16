/**
 * Log Scrubbing Utility
 * 
 * Removes PII (Personally Identifiable Information) from log entries
 * to ensure GDPR compliance and prevent sensitive data leakage.
 * 
 * This utility should be used before logging any data that might contain:
 * - Email addresses
 * - Phone numbers
 * - Credit card numbers
 * - Social security numbers
 * - IP addresses (in some contexts)
 * - Passwords and tokens
 * - Names (optional, configurable)
 */

export interface ScrubOptions {
  /**
   * Whether to scrub email addresses
   * @default true
   */
  scrubEmails?: boolean;
  
  /**
   * Whether to scrub phone numbers
   * @default true
   */
  scrubPhones?: boolean;
  
  /**
   * Whether to scrub credit card numbers
   * @default true
   */
  scrubCreditCards?: boolean;
  
  /**
   * Whether to scrub passwords/tokens
   * @default true
   */
  scrubSecrets?: boolean;
  
  /**
   * Whether to scrub IP addresses
   * @default false (IPs are often needed for security logs)
   */
  scrubIPs?: boolean;
  
  /**
   * Whether to scrub names
   * @default false (names are often needed for debugging)
   */
  scrubNames?: boolean;
  
  /**
   * Custom replacement string for scrubbed values
   * @default '[REDACTED]'
   */
  replacement?: string;
}

const DEFAULT_OPTIONS: Required<ScrubOptions> = {
  scrubEmails: true,
  scrubPhones: true,
  scrubCreditCards: true,
  scrubSecrets: true,
  scrubIPs: false,
  scrubNames: false,
  replacement: '[REDACTED]',
};

/**
 * Email regex pattern
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Phone number patterns (international formats)
 */
const PHONE_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // US: 123-456-7890
  /\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, // International
  /\b\d{10,}\b/g, // Generic long numbers
];

/**
 * Credit card patterns (common formats)
 */
const CREDIT_CARD_PATTERNS = [
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // 16 digits
  /\b\d{13,19}\b/g, // Generic card numbers
];

/**
 * Password/token patterns
 */
const SECRET_PATTERNS = [
  /password["\s:=]+([^\s"',}]+)/gi,
  /token["\s:=]+([^\s"',}]+)/gi,
  /secret["\s:=]+([^\s"',}]+)/gi,
  /api[_-]?key["\s:=]+([^\s"',}]+)/gi,
  /authorization["\s:=]+([^\s"',}]+)/gi,
  /bearer\s+([^\s"',}]+)/gi,
];

/**
 * IP address pattern (IPv4 and IPv6)
 */
const IP_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;

/**
 * Common name patterns (first/last names in various formats)
 */
const NAME_PATTERNS = [
  /\b(firstName|first_name|firstname)["\s:=]+([A-Z][a-z]+)\b/gi,
  /\b(lastName|last_name|lastname)["\s:=]+([A-Z][a-z]+)\b/gi,
  /\b(name|fullName|full_name)["\s:=]+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/gi,
];

/**
 * Scrubs a string value, removing PII based on options
 */
export function scrubString(value: string, options: ScrubOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let scrubbed = value;

  if (opts.scrubEmails) {
    scrubbed = scrubbed.replace(EMAIL_PATTERN, opts.replacement);
  }

  if (opts.scrubPhones) {
    PHONE_PATTERNS.forEach((pattern) => {
      scrubbed = scrubbed.replace(pattern, opts.replacement);
    });
  }

  if (opts.scrubCreditCards) {
    CREDIT_CARD_PATTERNS.forEach((pattern) => {
      scrubbed = scrubbed.replace(pattern, opts.replacement);
    });
  }

  if (opts.scrubSecrets) {
    SECRET_PATTERNS.forEach((pattern) => {
      scrubbed = scrubbed.replace(pattern, (match, secret) => {
        return match.replace(secret, opts.replacement);
      });
    });
  }

  if (opts.scrubIPs) {
    scrubbed = scrubbed.replace(IP_PATTERN, opts.replacement);
  }

  if (opts.scrubNames) {
    NAME_PATTERNS.forEach((pattern) => {
      scrubbed = scrubbed.replace(pattern, (match, key, name) => {
        return match.replace(name, opts.replacement);
      });
    });
  }

  return scrubbed;
}

/**
 * Scrubs an object recursively, removing PII from all string values
 */
export function scrubObject<T extends Record<string, unknown>>(
  obj: T,
  options: ScrubOptions = {},
): T {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const scrubbed = { ...obj };

  for (const [key, value] of Object.entries(scrubbed)) {
    // Skip known safe keys (can be configured)
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('id') ||
      lowerKey.includes('timestamp') ||
      lowerKey.includes('date') ||
      lowerKey.includes('count') ||
      lowerKey.includes('status')
    ) {
      continue;
    }

    if (typeof value === 'string') {
      (scrubbed as Record<string, unknown>)[key] = scrubString(value, opts);
    } else if (Array.isArray(value)) {
      (scrubbed as Record<string, unknown>)[key] = value.map((item) => {
        if (typeof item === 'string') {
          return scrubString(item, opts);
        } else if (typeof item === 'object' && item !== null) {
          return scrubObject(item as Record<string, unknown>, opts);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      (scrubbed as Record<string, unknown>)[key] = scrubObject(
        value as Record<string, unknown>,
        opts,
      );
    }
  }

  return scrubbed;
}

/**
 * Scrubs PII from log entry data
 * This is the main function to use when logging user data
 */
export function scrubLogData(
  data: Record<string, unknown> | string | unknown,
  options: ScrubOptions = {},
): Record<string, unknown> | string {
  if (typeof data === 'string') {
    return scrubString(data, options);
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return scrubObject(data as Record<string, unknown>, options);
  }

  return data as Record<string, unknown>;
}

/**
 * Creates a scrubbed version of a log message
 * Useful for logging user actions without exposing PII
 */
export function scrubLogMessage(message: string, options: ScrubOptions = {}): string {
  return scrubString(message, options);
}

/**
 * List of keys that commonly contain PII and should be scrubbed
 */
export const PII_KEYS = [
  'email',
  'password',
  'phone',
  'phoneNumber',
  'creditCard',
  'cardNumber',
  'ssn',
  'socialSecurityNumber',
  'firstName',
  'lastName',
  'name',
  'address',
  'street',
  'city',
  'zipCode',
  'postalCode',
  'apiKey',
  'accessToken',
  'refreshToken',
  'authorization',
] as const;

/**
 * Scrubs specific PII keys from an object
 */
export function scrubPIIKeys<T extends Record<string, unknown>>(
  obj: T,
  keysToScrub: readonly string[] = PII_KEYS,
  replacement: string = DEFAULT_OPTIONS.replacement,
): T {
  const scrubbed = { ...obj };

  for (const key of Object.keys(scrubbed)) {
    const lowerKey = key.toLowerCase();
    if (keysToScrub.some((piiKey) => lowerKey.includes(piiKey.toLowerCase()))) {
      (scrubbed as Record<string, unknown>)[key] = replacement;
    } else if (typeof scrubbed[key] === 'object' && scrubbed[key] !== null) {
      (scrubbed as Record<string, unknown>)[key] = scrubPIIKeys(
        scrubbed[key] as Record<string, unknown>,
        keysToScrub,
        replacement,
      );
    }
  }

  return scrubbed;
}
