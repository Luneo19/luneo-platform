import { Injectable, Logger } from '@nestjs/common';
import { PIIDetectorService } from './pii-detector.service';

export interface SanitizationResult {
  content: string;
  wasModified: boolean;
  removedPatterns: string[];
}

const DANGEROUS_OUTPUT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /(?:system\s*prompt|initial\s*instruction|my\s*instructions?\s*(?:are|say|tell))[:\s][\s\S]{10,}/gi, name: 'system_prompt_leak' },
  { pattern: /<script[\s>][\s\S]*?<\/script>/gi, name: 'xss_script' },
  { pattern: /on\w+\s*=\s*["'][^"']*["']/gi, name: 'xss_event_handler' },
  { pattern: /javascript\s*:/gi, name: 'xss_javascript_protocol' },
  { pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+(?:FROM|INTO|TABLE|DATABASE)/gi, name: 'sql_leak' },
  { pattern: /(?:rm\s+-rf|sudo\s+|chmod\s+777|curl\s+.*\|\s*(?:sh|bash))/gi, name: 'shell_command' },
  { pattern: /(?:api[_-]?key|secret[_-]?key|password|token)\s*[:=]\s*['"]\S+['"]/gi, name: 'credential_leak' },
  { pattern: /(?:sk-|pk_live_|rk_live_|ghp_|ghs_)[a-zA-Z0-9]{20,}/g, name: 'api_key_pattern' },
];

@Injectable()
export class OutputSanitizerService {
  private readonly logger = new Logger(OutputSanitizerService.name);

  constructor(private readonly piiDetector: PIIDetectorService) {}

  sanitize(output: string): SanitizationResult {
    let content = output;
    const removedPatterns: string[] = [];
    let wasModified = false;

    // Step 1: Remove dangerous patterns
    for (const { pattern, name } of DANGEROUS_OUTPUT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      if (regex.test(content)) {
        removedPatterns.push(name);
        wasModified = true;
        content = content.replace(new RegExp(pattern.source, pattern.flags), '[CONTENT_FILTERED]');
      }
    }

    // Step 2: Redact PII in output
    const piiResult = this.piiDetector.detect(content);
    if (piiResult.hasPII) {
      content = piiResult.redactedText;
      wasModified = true;
      removedPatterns.push(...piiResult.detections.map((d) => `pii_${d.type}`));
    }

    // Step 3: Fix broken JSON in output (common LLM issue)
    content = this.fixBrokenJson(content);

    return { content, wasModified, removedPatterns };
  }

  private fixBrokenJson(text: string): string {
    // Attempt to find and fix truncated JSON objects
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        JSON.parse(jsonBlockMatch[1]);
      } catch {
        // Try to fix common issues
        let fixed = jsonBlockMatch[1].trim();
        // Close unclosed braces/brackets
        const opens = (fixed.match(/{/g) || []).length;
        const closes = (fixed.match(/}/g) || []).length;
        if (opens > closes) {
          fixed += '}'.repeat(opens - closes);
        }
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/]/g) || []).length;
        if (openBrackets > closeBrackets) {
          fixed += ']'.repeat(openBrackets - closeBrackets);
        }
        try {
          JSON.parse(fixed);
          text = text.replace(jsonBlockMatch[1], fixed);
        } catch {
          // Leave as-is if still invalid
        }
      }
    }
    return text;
  }
}
