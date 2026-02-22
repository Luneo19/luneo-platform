import { Injectable, Logger } from '@nestjs/common';

interface SanitizeResult {
  clean: string;
  threats: string[];
  blocked: boolean;
}

interface PIIMatch {
  type: string;
  value: string;
  start: number;
  end: number;
}

@Injectable()
export class PromptSecurityService {
  private readonly logger = new Logger(PromptSecurityService.name);

  private readonly injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now\s+a/i,
    /disregard\s+(all\s+)?prior/i,
    /forget\s+(all\s+)?your\s+(instructions|rules)/i,
    /system\s*:\s*/i,
    /\bact\s+as\b.*\b(admin|root|system)\b/i,
    /\bpretend\s+you\s+are\b/i,
    /\boverride\s+(the\s+)?system\b/i,
    /\bjailbreak\b/i,
    /\bDAN\s+mode\b/i,
    /\bdo\s+anything\s+now\b/i,
  ];

  private readonly piiPatterns: Array<{ type: string; pattern: RegExp }> = [
    { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi },
    { type: 'phone', pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g },
    { type: 'iban', pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g },
    { type: 'credit_card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
    { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: 'swiss_ahv', pattern: /\b756\.\d{4}\.\d{4}\.\d{2}\b/g },
  ];

  sanitizeInput(input: string): SanitizeResult {
    const threats: string[] = [];
    let clean = input;

    clean = clean.replace(/<[^>]*>/g, '');
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (clean.length > 10000) {
      clean = clean.substring(0, 10000);
      threats.push('input_truncated');
    }

    const injectionDetected = this.detectInjection(clean);
    if (injectionDetected.length > 0) {
      threats.push(...injectionDetected);
    }

    return {
      clean,
      threats,
      blocked: threats.some(
        (t) => t !== 'input_truncated' && t !== 'pii_detected',
      ),
    };
  }

  detectInjection(text: string): string[] {
    const detectedPatterns: string[] = [];

    for (const pattern of this.injectionPatterns) {
      if (pattern.test(text)) {
        detectedPatterns.push(`injection_pattern: ${pattern.source}`);
      }
    }

    return detectedPatterns;
  }

  validateOutput(output: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    const piiMatches = this.detectPII(output);
    if (piiMatches.length > 0) {
      issues.push(
        `pii_in_output: ${piiMatches.map((m) => m.type).join(', ')}`,
      );
    }

    const dangerPhrases = [
      'as an ai',
      'i cannot',
      'i am not able to',
      'my training data',
      'openai',
      'anthropic',
      'language model',
    ];
    for (const phrase of dangerPhrases) {
      if (output.toLowerCase().includes(phrase)) {
        issues.push(`meta_leak: "${phrase}"`);
      }
    }

    if (output.length < 10) {
      issues.push('output_too_short');
    }

    return { valid: issues.length === 0, issues };
  }

  detectPII(text: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    for (const { type, pattern } of this.piiPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    return matches;
  }

  redactPII(text: string): string {
    let redacted = text;
    const matches = this.detectPII(text);

    const sorted = matches.sort((a, b) => b.start - a.start);
    for (const m of sorted) {
      const placeholder = `[${m.type.toUpperCase()}_REDACTED]`;
      redacted =
        redacted.substring(0, m.start) + placeholder + redacted.substring(m.end);
    }

    return redacted;
  }
}
