import { Injectable, Logger } from '@nestjs/common';

export interface InjectionDetectionResult {
  isInjection: boolean;
  score: number; // 0-1
  threats: string[];
  sanitizedInput: string;
}

const INJECTION_PATTERNS: Array<{ pattern: RegExp; name: string; weight: number }> = [
  { pattern: /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|rules?)/i, name: 'ignore_previous', weight: 0.9 },
  { pattern: /you\s+are\s+now\s+(a|an|the)\s+/i, name: 'role_reassignment', weight: 0.8 },
  { pattern: /system\s*:\s*/i, name: 'system_role_injection', weight: 0.85 },
  { pattern: /\[INST\]|\[\/INST\]|<<SYS>>|<\|im_start\|>/i, name: 'prompt_format_injection', weight: 0.95 },
  { pattern: /disregard\s+(your|the|all)\s+(previous|prior|above)/i, name: 'disregard_instruction', weight: 0.9 },
  { pattern: /forget\s+(everything|all|your)\s+(you|instructions?|rules?|about)/i, name: 'forget_instruction', weight: 0.85 },
  { pattern: /override\s+(your|the|all)\s+(instructions?|rules?|constraints?)/i, name: 'override_attempt', weight: 0.9 },
  { pattern: /pretend\s+(you\s+are|to\s+be|that)/i, name: 'pretend_instruction', weight: 0.7 },
  { pattern: /act\s+as\s+(if|though|a|an)\s/i, name: 'act_as_instruction', weight: 0.6 },
  { pattern: /do\s+not\s+follow\s+(the|your|any)\s/i, name: 'negation_instruction', weight: 0.8 },
  { pattern: /repeat\s+(the|your|all)\s+(system|initial|first)\s+(prompt|message|instruction)/i, name: 'extraction_attempt', weight: 0.95 },
  { pattern: /what\s+(is|are)\s+your\s+(system|initial|original)\s+(prompt|instruction|message)/i, name: 'system_prompt_extraction', weight: 0.9 },
  { pattern: /reveal\s+(your|the)\s+(system|hidden|secret)\s/i, name: 'reveal_attempt', weight: 0.9 },
  { pattern: /translate\s+(the\s+)?(above|previous|system)\s/i, name: 'translate_extraction', weight: 0.7 },
  { pattern: /```\s*(system|admin|root|sudo)/i, name: 'code_injection', weight: 0.8 },
  { pattern: /\bDAN\b|\bJailbreak\b|\bDeveloper\s+Mode\b/i, name: 'jailbreak_keyword', weight: 0.95 },
];

const ENCODED_PAYLOAD_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /(?:[A-Za-z0-9+/]{4}){3,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g, name: 'base64_payload' },
  { pattern: /&#x?[0-9a-fA-F]+;/g, name: 'html_entity' },
  { pattern: /%[0-9a-fA-F]{2}/g, name: 'url_encoded' },
  { pattern: /\\u[0-9a-fA-F]{4}/g, name: 'unicode_escape' },
];

const SUSPICIOUS_UNICODE = [
  /[\u200B-\u200F\u2028-\u202F\u2060-\u206F]/g, // Zero-width chars & formatting
  /[\uFFF0-\uFFFF]/g, // Specials block
  /[\u0300-\u036F]{3,}/g, // Stacked combining marks
];

@Injectable()
export class PromptInjectionDetectorService {
  private readonly logger = new Logger(PromptInjectionDetectorService.name);

  detect(input: string): InjectionDetectionResult {
    const threats: string[] = [];
    let score = 0;

    // Layer 1: Pattern matching
    for (const { pattern, name, weight } of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(name);
        score = Math.max(score, weight);
      }
    }

    // Layer 2: Encoded payloads
    for (const { pattern, name } of ENCODED_PAYLOAD_PATTERNS) {
      const matches = input.match(pattern);
      if (matches && matches.length > 2) {
        threats.push(name);
        score = Math.max(score, 0.6);

        // Try decoding base64 to check for nested injection
        if (name === 'base64_payload') {
          for (const match of matches) {
            try {
              const decoded = Buffer.from(match, 'base64').toString('utf-8');
              const nestedResult = this.checkPatterns(decoded);
              if (nestedResult.length > 0) {
                threats.push('encoded_injection');
                score = Math.max(score, 0.95);
              }
            } catch {
              // Not valid base64
            }
          }
        }
      }
    }

    // Layer 3: Suspicious Unicode
    for (const pattern of SUSPICIOUS_UNICODE) {
      if (pattern.test(input)) {
        threats.push('suspicious_unicode');
        score = Math.max(score, 0.5);
      }
    }

    // Layer 4: Role confusion (multiple personas in one message)
    const roleConfusion = this.detectRoleConfusion(input);
    if (roleConfusion) {
      threats.push('role_confusion');
      score = Math.max(score, 0.7);
    }

    // Layer 5: Abnormal structure
    if (input.split('\n').length > 50) {
      threats.push('abnormal_length');
      score = Math.max(score, 0.3);
    }

    const sanitizedInput = this.sanitize(input);

    return {
      isInjection: score >= 0.6,
      score,
      threats,
      sanitizedInput,
    };
  }

  private checkPatterns(text: string): string[] {
    const found: string[] = [];
    for (const { pattern, name } of INJECTION_PATTERNS) {
      if (pattern.test(text)) found.push(name);
    }
    return found;
  }

  private detectRoleConfusion(input: string): boolean {
    const roleMarkers = [
      /^(system|assistant|admin|root)\s*:/im,
      /\n(system|assistant|admin|root)\s*:/im,
    ];
    return roleMarkers.some((p) => p.test(input));
  }

  private sanitize(input: string): string {
    let sanitized = input;
    // Remove zero-width characters
    for (const pattern of SUSPICIOUS_UNICODE) {
      sanitized = sanitized.replace(pattern, '');
    }
    // Remove prompt format injections
    sanitized = sanitized.replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\|im_start\|>|<\|im_end\|>/gi, '');
    // Remove system role markers at start of lines
    sanitized = sanitized.replace(/^(system|admin|root)\s*:\s*/gim, '');
    return sanitized.trim();
  }
}
