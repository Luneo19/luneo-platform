import { Injectable, Logger } from '@nestjs/common';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import * as crypto from 'crypto';

@Injectable()
export class MemorySummarizerService {
  private readonly logger = new Logger(MemorySummarizerService.name);

  constructor(private readonly cache: SmartCacheService) {}

  /**
   * Summarize a conversation into a concise paragraph.
   * Uses extractive summarization (no LLM call) to avoid recursive costs.
   * The summary captures key topics, decisions, and action items.
   */
  async summarize(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (messages.length === 0) return '';

    const hash = crypto
      .createHash('md5')
      .update(messages.map((m) => m.content).join('|'))
      .digest('hex')
      .substring(0, 12);

    const cacheKey = `memory-summary:${hash}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => this.extractiveSummarize(messages),
      3600, // 1 hour cache
    );
  }

  private extractiveSummarize(
    messages: Array<{ role: string; content: string }>,
  ): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const topics = new Set<string>();
    const keyPhrases: string[] = [];

    // Extract key topics from user messages
    for (const msg of userMessages) {
      const sentences = msg.content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
      if (sentences.length > 0) {
        keyPhrases.push(sentences[0].trim());
      }
      // Simple topic extraction: look for noun-like patterns
      const words = msg.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 5 && !/^(comment|pourquoi|quand|combien|merci|bonjour)/.test(word)) {
          topics.add(word);
        }
      }
    }

    // Extract key points from assistant responses
    const assistantPoints: string[] = [];
    for (const msg of assistantMessages) {
      const firstSentence = msg.content.split(/[.!?]+/)[0]?.trim();
      if (firstSentence && firstSentence.length > 15 && firstSentence.length < 200) {
        assistantPoints.push(firstSentence);
      }
    }

    const parts: string[] = [];
    parts.push(`Conversation avec ${messages.length} messages.`);

    if (keyPhrases.length > 0) {
      parts.push(`Questions principales : ${keyPhrases.slice(0, 3).join(' ; ')}.`);
    }

    if (assistantPoints.length > 0) {
      parts.push(`Points clés des réponses : ${assistantPoints.slice(0, 3).join(' ; ')}.`);
    }

    if (topics.size > 0) {
      parts.push(`Sujets abordés : ${[...topics].slice(0, 5).join(', ')}.`);
    }

    return parts.join(' ');
  }
}
