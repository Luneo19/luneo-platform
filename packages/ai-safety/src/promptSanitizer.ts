import crypto from 'crypto';
import { BLOCKED_KEYWORDS, PII_PATTERNS, SECRET_PATTERNS } from './patterns.js';

export type RedactionSeverity = 'secret' | 'pii';

export interface PromptRedaction {
  label: string;
  preview: string;
  severity: RedactionSeverity;
}

export interface SanitizePromptOptions {
  /**
   * If true, any detected secret blocks the prompt immediately.
   * Defaults to true.
   */
  blockOnSecrets?: boolean;
  /**
   * Maximum number of characters kept.
   */
  maxLength?: number;
}

export interface SanitizePromptResult {
  prompt: string;
  redactions: PromptRedaction[];
  blocked: boolean;
  reasons: string[];
  piiDetected: boolean;
  truncated: boolean;
  originalLength: number;
}

const DEFAULT_MAX_LENGTH = 2000;

const sanitizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const applyPatterns = (
  input: string,
  patterns: typeof SECRET_PATTERNS | typeof PII_PATTERNS,
  severity: RedactionSeverity,
  collector: PromptRedaction[],
) =>
  patterns.reduce((acc, pattern) => {
    return acc.replace(pattern.regex, (match) => {
      collector.push({
        label: pattern.label,
        preview: match.slice(0, 8),
        severity,
      });
      return `[REDACTED_${pattern.label.toUpperCase()}]`;
    });
  }, input);

export function sanitizePrompt(raw: string, options: SanitizePromptOptions = {}): SanitizePromptResult {
  const { blockOnSecrets = true, maxLength = DEFAULT_MAX_LENGTH } = options;

  if (!raw || typeof raw !== 'string') {
    return {
      prompt: '',
      redactions: [],
      blocked: true,
      reasons: ['Prompt vide'],
      piiDetected: false,
      truncated: false,
      originalLength: 0,
    };
  }

  let normalized = sanitizeWhitespace(raw.normalize('NFKC'));
  const originalLength = normalized.length;
  let truncated = false;

  if (normalized.length > maxLength) {
    normalized = normalized.slice(0, maxLength);
    truncated = true;
  }

  const redactions: PromptRedaction[] = [];

  let sanitized = applyPatterns(normalized, SECRET_PATTERNS, 'secret', redactions);
  sanitized = applyPatterns(sanitized, PII_PATTERNS, 'pii', redactions);

  const piiDetected = redactions.some((item) => item.severity === 'pii');
  const secretDetected = redactions.some((item) => item.severity === 'secret');

  const reasons: string[] = [];
  if (secretDetected) {
    reasons.push('Secret détecté dans le prompt');
  }
  if (piiDetected) {
    reasons.push('PII détectée dans le prompt');
  }

  const lowerOriginal = normalized.toLowerCase();
  const keywordHits = BLOCKED_KEYWORDS.filter((keyword) => lowerOriginal.includes(keyword));
  if (keywordHits.length) {
    reasons.push(`Mots-clés sensibles détectés: ${keywordHits.join(', ')}`);
  }

  const blocked = (blockOnSecrets && secretDetected) || keywordHits.length > 0;

  return {
    prompt: sanitized,
    redactions,
    blocked,
    reasons,
    piiDetected,
    truncated,
    originalLength,
  };
}

export const hashPrompt = (value: string) =>
  crypto.createHash('sha256').update(value || '').digest('hex');

export const maskPromptForLogs = (value: string, maxLength = 120) => {
  if (!value) return '';
  const compacted = sanitizeWhitespace(value);
  if (compacted.length <= maxLength) {
    return compacted;
  }
  return `${compacted.slice(0, maxLength - 1)}…`;
};

