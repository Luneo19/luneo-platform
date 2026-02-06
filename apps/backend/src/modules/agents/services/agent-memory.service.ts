/**
 * @fileoverview Service de mémoire contextuelle pour les agents
 * @module AgentMemoryService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentContext {
  lastIntent?: string;
  lastDataAccessed?: string[];
  preferences?: Record<string, unknown>;
  sessionData?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Met à jour le contexte d'une conversation
   */
  async updateContext(conversationId: string, context: AgentContext): Promise<void> {
    const conversation = await this.prisma.agentConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const currentContext = (conversation.context || {}) as AgentContext;

    await this.prisma.agentConversation.update({
      where: { id: conversationId },
      data: {
        context: {
          ...currentContext,
          ...context,
        } as any,
      },
    });

    // Invalider le cache
    await this.cache.invalidate(`agent-context:${conversationId}`, 'cache');
  }

  /**
   * Récupère le contexte d'une conversation
   */
  async getContext(conversationId: string): Promise<AgentContext> {
    const cacheKey = `agent-context:${conversationId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const conversation = await this.prisma.agentConversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          return {};
        }

        return (conversation.context || {}) as AgentContext;
      },
      300 // Cache 5 minutes
    );
  }
}
