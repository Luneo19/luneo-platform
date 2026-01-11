/**
 * @fileoverview Service de gestion du contexte long avec summarization
 * @module ContextManagerService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Summarization des messages anciens
 * - ✅ Compression intelligente
 * - ✅ Optimisation tokens
 * - ✅ Types explicites
 */

import { Injectable, Logger } from '@nestjs/common';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from './llm-router.service';
import { ConversationMessage } from './conversation.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES
// ============================================================================

export interface CompressedContext {
  summary: string;
  recentMessages: ConversationMessage[];
  totalTokensSaved: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class ContextManagerService {
  private readonly logger = new Logger(ContextManagerService.name);

  // Configuration
  private readonly MAX_RECENT_MESSAGES = 10; // Garder 10 messages récents
  private readonly MAX_SUMMARY_TOKENS = 200; // Résumé max 200 tokens
  private readonly COMPRESSION_THRESHOLD = 20; // Compresser si > 20 messages

  constructor(
    private readonly llmRouter: LLMRouterService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Compresse l'historique d'une conversation pour optimiser les tokens
   */
  async compressHistory(
    messages: ConversationMessage[],
    brandId?: string,
  ): Promise<CompressedContext> {
    // Si peu de messages, pas besoin de compression
    if (messages.length <= this.MAX_RECENT_MESSAGES) {
      return {
        summary: '',
        recentMessages: messages,
        totalTokensSaved: 0,
      };
    }

    // Séparer messages récents et anciens
    const recentMessages = messages.slice(-this.MAX_RECENT_MESSAGES);
    const oldMessages = messages.slice(0, -this.MAX_RECENT_MESSAGES);

    // Vérifier cache pour le résumé
    const cacheKey = `context-summary:${this.hashMessages(oldMessages)}`;
    let summary = await this.cache.get<string>(cacheKey, 'context', async () => {
      return await this.summarizeMessages(oldMessages, brandId);
    }, { ttl: 86400 });

    if (!summary) {
      // Générer résumé des messages anciens
      summary = await this.summarizeMessages(oldMessages, brandId);
      
      // Mettre en cache (TTL: 24 heures)
      await this.cache.set(cacheKey, 'context', summary, { ttl: 86400 });
    }

    // Calculer tokens économisés (approximation)
    const oldMessagesTokens = this.estimateTokens(oldMessages);
    const summaryTokens = this.estimateTokens([{ role: 'assistant', content: summary }]);
    const tokensSaved = oldMessagesTokens - summaryTokens;

    this.logger.debug(
      `Compressed ${oldMessages.length} messages into summary, saved ~${tokensSaved} tokens`,
    );

    return {
      summary,
      recentMessages,
      totalTokensSaved: tokensSaved,
    };
  }

  /**
   * Summarize des messages anciens avec LLM
   */
  private async summarizeMessages(
    messages: ConversationMessage[],
    brandId?: string,
  ): Promise<string> {
    try {
      const messagesText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      const systemPrompt = `Tu es un expert en résumé de conversations. Résume cette conversation en conservant:
1. Les points clés discutés
2. Les décisions prises
3. Le contexte important
4. Les préférences utilisateur mentionnées

Résumé doit être concis (max ${this.MAX_SUMMARY_TOKENS} tokens) et structuré.`;

      const userPrompt = `Résume cette conversation:\n\n${messagesText}`;

      const messagesForLLM: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // Utiliser Claude Haiku (rapide + pas cher) pour summarization
      const response = await this.llmRouter.chat({
        provider: LLMProvider.ANTHROPIC,
        model: LLM_MODELS.anthropic.CLAUDE_3_HAIKU,
        messages: messagesForLLM,
        temperature: 0.3, // Basse température pour résumé factuel
        maxTokens: this.MAX_SUMMARY_TOKENS,
        brandId,
        agentType: 'luna', // Par défaut, peut être ajusté
        enableFallback: true,
      });

      return response.content.trim();
    } catch (error) {
      this.logger.error(
        `Failed to summarize messages: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      
      // Fallback: résumé très basique
      return this.fallbackSummary(messages);
    }
  }

  /**
   * Fallback: résumé très basique sans LLM
   */
  private fallbackSummary(messages: ConversationMessage[]): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    return `Conversation précédente: ${userMessages.length} messages utilisateur, ${assistantMessages.length} réponses assistant. Points clés: ${userMessages.slice(0, 3).map((m) => m.content.substring(0, 50)).join('; ')}...`;
  }

  /**
   * Construit le contexte optimisé pour le LLM
   */
  buildOptimizedContext(
    compressed: CompressedContext,
    currentMessage: string,
  ): Message[] {
    const messages: Message[] = [];

    // Ajouter résumé si disponible
    if (compressed.summary) {
      messages.push({
        role: 'system',
        content: `Contexte de conversation précédente:\n${compressed.summary}\n\nUtilise ce contexte pour répondre de manière cohérente.`,
      });
    }

    // Ajouter messages récents
    compressed.recentMessages.forEach((msg) => {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    });

    // Ajouter message actuel
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  /**
   * Estime le nombre de tokens (approximation: 1 token ≈ 4 caractères)
   */
  private estimateTokens(messages: ConversationMessage[]): number {
    const totalChars = messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );
    return Math.ceil(totalChars / 4);
  }

  /**
   * Hash simple des messages pour cache key
   */
  private hashMessages(messages: ConversationMessage[]): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join('|');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
