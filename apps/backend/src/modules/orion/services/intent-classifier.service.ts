import { Injectable, Logger } from '@nestjs/common';
import { FallbackLLMService } from './fallback-llm.service';
import { PromptSecurityService } from './prompt-security.service';

interface IntentResult {
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
}

interface SentimentResult {
  overall: string;
  dimensions: {
    anger: number;
    frustration: number;
    satisfaction: number;
    confusion: number;
    urgency: number;
  };
}

interface ClassificationResult {
  intent: IntentResult;
  sentiment: SentimentResult;
}

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  constructor(
    private readonly llm: FallbackLLMService,
    private readonly security: PromptSecurityService,
  ) {}

  async classify(text: string): Promise<ClassificationResult> {
    const sanitized = this.security.sanitizeInput(text);
    if (sanitized.blocked) {
      return this.defaultClassification();
    }

    try {
      const result = await this.llm.complete({
        messages: [
          {
            role: 'system',
            content: `Analyse le texte et retourne un JSON:
{
  "intent": {
    "primaryIntent": "question|problem|request|feedback|complaint|billing|cancellation|feature_request|bug_report|other",
    "secondaryIntents": [],
    "confidence": 0-100
  },
  "sentiment": {
    "overall": "VERY_NEGATIVE|NEGATIVE|NEUTRAL|POSITIVE|VERY_POSITIVE",
    "dimensions": {
      "anger": 0-100,
      "frustration": 0-100,
      "satisfaction": 0-100,
      "confusion": 0-100,
      "urgency": 0-100
    }
  }
}`,
          },
          { role: 'user', content: sanitized.clean },
        ],
        temperature: 0.1,
        maxTokens: 300,
        responseFormat: 'json',
      });

      return JSON.parse(result.content);
    } catch (error) {
      this.logger.error(`Classification failed: ${error}`);
      return this.defaultClassification();
    }
  }

  async findSimilarTickets(
    ticketSubject: string,
    ticketDescription: string,
    limit = 5,
  ) {
    const keywords = this.extractKeywords(
      `${ticketSubject} ${ticketDescription}`,
    );

    return { keywords, similarCount: 0, similar: [] };
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et',
      'est', 'en', 'que', 'qui', 'dans', 'pour', 'pas', 'ne',
      'the', 'a', 'an', 'is', 'in', 'for', 'to', 'of', 'and',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\sàâéèêëïîôùûüç]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
      .slice(0, 10);
  }

  private defaultClassification(): ClassificationResult {
    return {
      intent: {
        primaryIntent: 'other',
        secondaryIntents: [],
        confidence: 0,
      },
      sentiment: {
        overall: 'NEUTRAL',
        dimensions: {
          anger: 0,
          frustration: 0,
          satisfaction: 50,
          confusion: 0,
          urgency: 30,
        },
      },
    };
  }
}
