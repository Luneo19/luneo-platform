import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '@/libs/llm/llm.service';

export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'frustrated';

export interface MessageSentiment {
  sentiment: SentimentLabel;
  score: number;
  topics: string[];
}

export interface ConversationSentimentResult {
  overallSentiment: string;
  sentimentTrend: Array<{ index: number; sentiment: string; score: number }>;
  frustrationDetected: boolean;
  escalationRecommended: boolean;
}

const SENTIMENT_PROMPT = `Classify the sentiment of the following message.
Reply ONLY with a JSON object: {"sentiment":"positive"|"negative"|"neutral"|"frustrated","score":<-1..1>,"topics":["topic1"]}
- score: -1 (very negative) to 1 (very positive), 0 for neutral
- topics: up to 3 short topic keywords
Message:`;

const CONVERSATION_PROMPT = `Analyze the sentiment of this conversation.
Reply ONLY with a JSON object:
{"overallSentiment":"positive"|"negative"|"neutral"|"frustrated","sentimentTrend":[{"index":0,"sentiment":"...","score":<-1..1>}],"frustrationDetected":boolean,"escalationRecommended":boolean}
- sentimentTrend: one entry per user message, index is 0-based position among user messages
- escalationRecommended: true if user seems stuck or frustrated for 2+ consecutive messages
Conversation:`;

const POSITIVE_KEYWORDS = [
  'merci', 'super', 'parfait', 'excellent', 'génial', 'bravo', 'top',
  'thanks', 'great', 'perfect', 'awesome', 'love', 'amazing', 'good',
  'helpful', 'appreciate', 'bien', 'formidable', 'fantastique',
];

const NEGATIVE_KEYWORDS = [
  'problème', 'erreur', 'bug', 'nul', 'mauvais', 'horrible', 'pire',
  'problem', 'error', 'bad', 'terrible', 'awful', 'broken', 'worst',
  'issue', 'fail', 'wrong', 'pas content', 'déçu', 'disappointed',
];

const FRUSTRATED_KEYWORDS = [
  'encore', 'toujours', 'ça marche pas', 'ridicule', 'incompétent',
  'again', 'still', 'not working', 'ridiculous', 'useless', 'waste',
  'ras le bol', 'insupportable', 'impossible', 'absurde', 'fed up',
  'give up', 'unacceptable', 'inacceptable', '!!!', '???',
];

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);
  private llmAvailable = true;

  constructor(private readonly llmService: LlmService) {}

  async analyzeMessage(content: string): Promise<MessageSentiment> {
    if (this.llmAvailable) {
      try {
        return await this.analyzeLlm(content);
      } catch (error) {
        this.logger.warn(
          `LLM sentiment analysis failed, using keyword fallback: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.llmAvailable = false;
        setTimeout(() => { this.llmAvailable = true; }, 60_000);
      }
    }

    return this.analyzeKeywords(content);
  }

  async analyzeConversation(
    messages: Array<{ role: string; content: string }>,
  ): Promise<ConversationSentimentResult> {
    const userMessages = messages.filter((m) => m.role === 'user');

    if (userMessages.length === 0) {
      return {
        overallSentiment: 'neutral',
        sentimentTrend: [],
        frustrationDetected: false,
        escalationRecommended: false,
      };
    }

    if (this.llmAvailable) {
      try {
        return await this.analyzeConversationLlm(messages);
      } catch (error) {
        this.logger.warn(
          `LLM conversation analysis failed, using keyword fallback: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.llmAvailable = false;
        setTimeout(() => { this.llmAvailable = true; }, 60_000);
      }
    }

    return this.analyzeConversationKeywords(userMessages);
  }

  private async analyzeLlm(content: string): Promise<MessageSentiment> {
    const result = await this.llmService.complete({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SENTIMENT_PROMPT },
        { role: 'user', content: content.slice(0, 500) },
      ],
      temperature: 0,
      maxTokens: 150,
    });

    return this.parseSentimentJson(result.content);
  }

  private async analyzeConversationLlm(
    messages: Array<{ role: string; content: string }>,
  ): Promise<ConversationSentimentResult> {
    const truncatedMessages = messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 300),
    }));

    const conversationText = truncatedMessages
      .map((m) => `[${m.role}]: ${m.content}`)
      .join('\n');

    const result = await this.llmService.complete({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CONVERSATION_PROMPT },
        { role: 'user', content: conversationText },
      ],
      temperature: 0,
      maxTokens: 500,
    });

    return this.parseConversationJson(result.content);
  }

  private analyzeKeywords(content: string): MessageSentiment {
    const lower = content.toLowerCase();
    const words = lower.split(/\s+/);

    let score = 0;
    let posHits = 0;
    let negHits = 0;
    let frustHits = 0;

    for (const keyword of POSITIVE_KEYWORDS) {
      if (lower.includes(keyword)) {
        posHits++;
        score += 0.3;
      }
    }
    for (const keyword of NEGATIVE_KEYWORDS) {
      if (lower.includes(keyword)) {
        negHits++;
        score -= 0.3;
      }
    }
    for (const keyword of FRUSTRATED_KEYWORDS) {
      if (lower.includes(keyword)) {
        frustHits++;
        score -= 0.4;
      }
    }

    score = Math.max(-1, Math.min(1, score));

    let sentiment: SentimentLabel;
    if (frustHits >= 2 || (frustHits >= 1 && negHits >= 1)) {
      sentiment = 'frustrated';
    } else if (score > 0.2) {
      sentiment = 'positive';
    } else if (score < -0.2) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    const topics = this.extractTopics(words);

    return { sentiment, score: Math.round(score * 100) / 100, topics };
  }

  private analyzeConversationKeywords(
    userMessages: Array<{ role: string; content: string }>,
  ): ConversationSentimentResult {
    const trend: Array<{ index: number; sentiment: string; score: number }> = [];
    let totalScore = 0;
    let frustrationStreak = 0;
    let maxFrustrationStreak = 0;

    for (let i = 0; i < userMessages.length; i++) {
      const analysis = this.analyzeKeywords(userMessages[i].content);
      trend.push({ index: i, sentiment: analysis.sentiment, score: analysis.score });
      totalScore += analysis.score;

      if (analysis.sentiment === 'frustrated' || analysis.sentiment === 'negative') {
        frustrationStreak++;
        maxFrustrationStreak = Math.max(maxFrustrationStreak, frustrationStreak);
      } else {
        frustrationStreak = 0;
      }
    }

    const avgScore = totalScore / userMessages.length;
    const frustrationDetected = maxFrustrationStreak >= 2;
    const escalationRecommended = maxFrustrationStreak >= 2 || avgScore < -0.5;

    let overallSentiment: string;
    if (frustrationDetected) {
      overallSentiment = 'frustrated';
    } else if (avgScore > 0.2) {
      overallSentiment = 'positive';
    } else if (avgScore < -0.2) {
      overallSentiment = 'negative';
    } else {
      overallSentiment = 'neutral';
    }

    return { overallSentiment, sentimentTrend: trend, frustrationDetected, escalationRecommended };
  }

  private extractTopics(words: string[]): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou', 'en',
      'je', 'tu', 'il', 'nous', 'vous', 'ils', 'est', 'a', 'ai', 'sont',
      'the', 'a', 'an', 'is', 'are', 'was', 'i', 'you', 'we', 'they', 'it',
      'to', 'for', 'of', 'in', 'on', 'at', 'my', 'me', 'this', 'that',
      'pas', 'ne', 'que', 'qui', 'avec', 'pour', 'dans', 'sur', 'par',
    ]);

    const freq = new Map<string, number>();
    for (const word of words) {
      const clean = word.replace(/[^a-zA-ZÀ-ÿ]/g, '');
      if (clean.length >= 3 && !stopWords.has(clean)) {
        freq.set(clean, (freq.get(clean) ?? 0) + 1);
      }
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  private parseSentimentJson(raw: string): MessageSentiment {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);

      const validSentiments: SentimentLabel[] = ['positive', 'negative', 'neutral', 'frustrated'];
      const sentiment: SentimentLabel = validSentiments.includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral';
      const score = typeof parsed.score === 'number'
        ? Math.max(-1, Math.min(1, parsed.score))
        : 0;
      const topics = Array.isArray(parsed.topics)
        ? parsed.topics.filter((t: unknown) => typeof t === 'string').slice(0, 5)
        : [];

      return { sentiment, score, topics };
    } catch {
      this.logger.warn('Failed to parse LLM sentiment JSON, returning neutral');
      return { sentiment: 'neutral', score: 0, topics: [] };
    }
  }

  private parseConversationJson(raw: string): ConversationSentimentResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        overallSentiment: typeof parsed.overallSentiment === 'string' ? parsed.overallSentiment : 'neutral',
        sentimentTrend: Array.isArray(parsed.sentimentTrend)
          ? parsed.sentimentTrend.map((t: { index?: number; sentiment?: string; score?: number }) => ({
              index: typeof t.index === 'number' ? t.index : 0,
              sentiment: typeof t.sentiment === 'string' ? t.sentiment : 'neutral',
              score: typeof t.score === 'number' ? Math.max(-1, Math.min(1, t.score)) : 0,
            }))
          : [],
        frustrationDetected: parsed.frustrationDetected === true,
        escalationRecommended: parsed.escalationRecommended === true,
      };
    } catch {
      this.logger.warn('Failed to parse LLM conversation JSON, returning neutral');
      return {
        overallSentiment: 'neutral',
        sentimentTrend: [],
        frustrationDetected: false,
        escalationRecommended: false,
      };
    }
  }
}
