import { Injectable, Logger } from '@nestjs/common';

export interface PIIDetectionResult {
  hasPII: boolean;
  detections: PIIDetection[];
  redactedText: string;
}

export interface PIIDetection {
  type: string;
  value: string;
  start: number;
  end: number;
}

const PII_PATTERNS: Array<{ type: string; pattern: RegExp; validate?: (match: string) => boolean }> = [
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: 'phone_international',
    pattern: /\+?[1-9]\d{1,14}/g,
    validate: (m) => m.replace(/\D/g, '').length >= 10,
  },
  {
    type: 'phone_fr',
    pattern: /(?:0|\+33)[1-9](?:[\s.-]?\d{2}){4}/g,
  },
  {
    type: 'phone_ch',
    pattern: /(?:0|\+41)(?:[\s.-]?\d){9}/g,
  },
  {
    type: 'credit_card',
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    validate: (m) => luhnCheck(m.replace(/[\s-]/g, '')),
  },
  {
    type: 'ssn_us',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    type: 'iban',
    pattern: /\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?(?:[\dA-Z]{4}\s?){2,7}[\dA-Z]{1,4}\b/gi,
  },
  {
    type: 'ahv_ch',
    pattern: /\b756\.\d{4}\.\d{4}\.\d{2}\b/g,
  },
  {
    type: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    validate: (m) => m.split('.').every((o) => parseInt(o) >= 0 && parseInt(o) <= 255),
  },
  {
    type: 'passport',
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
  },
];

function luhnCheck(num: string): boolean {
  if (!/^\d+$/.test(num) || num.length < 13 || num.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

@Injectable()
export class PIIDetectorService {
  private readonly logger = new Logger(PIIDetectorService.name);

  detect(text: string): PIIDetectionResult {
    const detections: PIIDetection[] = [];

    for (const { type, pattern, validate } of PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        if (validate && !validate(match[0])) continue;
        detections.push({
          type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    // Deduplicate overlapping detections (keep highest priority)
    const unique = this.deduplicateDetections(detections);

    return {
      hasPII: unique.length > 0,
      detections: unique,
      redactedText: this.redact(text, unique),
    };
  }

  redact(text: string, detections?: PIIDetection[]): string {
    const dets = detections || this.detect(text).detections;
    if (dets.length === 0) return text;

    // Sort by start position descending to replace from end to start
    const sorted = [...dets].sort((a, b) => b.start - a.start);
    let result = text;
    for (const det of sorted) {
      const replacement = `[${det.type.toUpperCase()}_REDACTED]`;
      result = result.substring(0, det.start) + replacement + result.substring(det.end);
    }
    return result;
  }

  private deduplicateDetections(detections: PIIDetection[]): PIIDetection[] {
    if (detections.length <= 1) return detections;
    const sorted = [...detections].sort((a, b) => a.start - b.start);
    const result: PIIDetection[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = result[result.length - 1];
      const curr = sorted[i];
      if (curr.start >= prev.end) {
        result.push(curr);
      }
      // Skip overlapping, keep the first (higher priority by pattern order)
    }
    return result;
  }
}
