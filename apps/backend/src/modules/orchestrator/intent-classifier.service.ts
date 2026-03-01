import { Injectable } from '@nestjs/common';

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
}

@Injectable()
export class IntentClassifierService {
  classify(
    userMessage: string,
    candidateIntents: string[] = [],
  ): IntentClassificationResult {
    const normalized = userMessage.toLowerCase();
    if (candidateIntents.length > 0) {
      for (const intent of candidateIntents) {
        const intentTokens = intent.split('_').filter((token) => token.length >= 3);
        if (intentTokens.some((token) => normalized.includes(token))) {
          return { intent, confidence: 0.8 };
        }
      }
    }

    if (/refund|rembours|retour|return/.test(normalized)) {
      return { intent: 'return_request', confidence: 0.72 };
    }
    if (/order|commande|suivi|tracking/.test(normalized)) {
      return { intent: 'order_tracking', confidence: 0.75 };
    }
    if (/price|prix|discount|promo/.test(normalized)) {
      return { intent: 'pricing_question', confidence: 0.68 };
    }

    return { intent: 'general_inquiry', confidence: 0.55 };
  }
}
