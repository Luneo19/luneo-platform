export interface KeywordPattern {
  label: string;
  regex: RegExp;
}

export const SECRET_PATTERNS: KeywordPattern[] = [
  { label: 'openai_key', regex: /(sk-[a-z0-9]{20,})/gi },
  { label: 'bearer_token', regex: /(bearer\s+[a-z0-9_\-\.]{20,})/gi },
  { label: 'api_token', regex: /\b(token|api_key|access_token)\b[\s:=]+['"]?[a-z0-9_\-]{12,}['"]?/gi },
  { label: 'password', regex: /\bpassword\b[\s:=]+['"]?[^'"\s]{6,}['"]?/gi },
];

export const PII_PATTERNS: KeywordPattern[] = [
  {
    label: 'email',
    regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  },
  {
    label: 'phone',
    regex: /\+?[0-9]{1,3}[\s-]?(?:\(?[0-9]{2,3}\)?[\s-]?){2,4}[0-9]{2,4}/g,
  },
  {
    label: 'iban',
    regex: /[A-Z]{2}[0-9]{2}\s?[0-9A-Z]{4,}/g,
  },
  {
    label: 'credit_card',
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
  },
];

export const BLOCKED_KEYWORDS = [
  'ssn',
  'social security',
  'secret token',
  'api secret',
  'private key',
];

