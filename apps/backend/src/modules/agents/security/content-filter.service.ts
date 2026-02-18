import { Injectable, Logger } from '@nestjs/common';

export interface ContentFilterResult {
  allowed: boolean;
  blockedCategories: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
}

const BLOCKED_TOPIC_PATTERNS: Array<{ category: string; patterns: RegExp[]; severity: 'low' | 'medium' | 'high' }> = [
  {
    category: 'violence',
    severity: 'high',
    patterns: [
      /how\s+to\s+(?:make|build|create)\s+(?:a\s+)?(?:bomb|weapon|explosive)/i,
      /instructions?\s+(?:for|to)\s+(?:harm|kill|hurt|attack)/i,
    ],
  },
  {
    category: 'illegal_activity',
    severity: 'high',
    patterns: [
      /how\s+to\s+(?:hack|breach|exploit|crack)\s/i,
      /(?:steal|forge|counterfeit)\s+(?:identity|documents?|money|credit)/i,
    ],
  },
  {
    category: 'self_harm',
    severity: 'high',
    patterns: [
      /(?:methods?|ways?)\s+(?:to|of)\s+(?:suicide|self[- ]harm)/i,
    ],
  },
  {
    category: 'hate_speech',
    severity: 'high',
    patterns: [
      /(?:all|every)\s+(?:\w+\s+)?(?:people|persons?)\s+(?:should|must|deserve)\s+(?:die|suffer|be\s+(?:killed|eliminated))/i,
    ],
  },
  {
    category: 'competitor_data',
    severity: 'medium',
    patterns: [
      /(?:competitor|rival)\s+(?:pricing|strategy|confidential|secret)/i,
    ],
  },
];

@Injectable()
export class ContentFilterService {
  private readonly logger = new Logger(ContentFilterService.name);

  filter(content: string): ContentFilterResult {
    const blockedCategories: string[] = [];
    let maxSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';
    const severityOrder = { none: 0, low: 1, medium: 2, high: 3 };

    for (const { category, patterns, severity } of BLOCKED_TOPIC_PATTERNS) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          blockedCategories.push(category);
          if (severityOrder[severity] > severityOrder[maxSeverity]) {
            maxSeverity = severity;
          }
          break;
        }
      }
    }

    return {
      allowed: blockedCategories.length === 0,
      blockedCategories: [...new Set(blockedCategories)],
      severity: maxSeverity,
    };
  }
}
