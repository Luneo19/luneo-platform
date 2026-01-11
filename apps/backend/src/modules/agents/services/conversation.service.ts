/**
 * @fileoverview Service de gestion des conversations avec les agents
 * @module ConversationService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ Validation Zod
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const ConversationCreateSchema = z.object({
  id: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(), // Alias pour brandId pour compatibilité
  brandId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  agentType: z.enum(['luna', 'aria', 'nova']),
});

export type ConversationCreate = z.infer<typeof ConversationCreateSchema>;

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère ou crée une conversation
   */
  async getOrCreate(input: ConversationCreate): Promise<{ id: string }> {
    const validated = ConversationCreateSchema.parse(input);
    const brandId = validated.brandId || validated.shopId;

    if (validated.id) {
      const existing = await this.prisma.agentConversation.findUnique({
        where: { id: validated.id },
      });

      if (existing) {
        return { id: existing.id };
      }
    }

    const conversation = await this.prisma.agentConversation.create({
      data: {
        brandId: brandId || undefined,
        userId: validated.userId || undefined,
        sessionId: validated.sessionId || undefined,
        agentType: validated.agentType,
        context: {},
      },
    });

    return { id: conversation.id };
  }

  /**
   * Récupère l'historique d'une conversation
   */
  async getHistory(conversationId: string, limit: number = 10): Promise<ConversationMessage[]> {
    const messages = await this.prisma.agentMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      metadata: (msg.metadata || {}) as Record<string, unknown>,
    }));
  }

  /**
   * Ajoute un message à une conversation
   */
  async addMessage(
    conversationId: string,
    message: ConversationMessage,
  ): Promise<void> {
    await this.prisma.agentMessage.create({
      data: {
        conversationId,
        role: message.role,
        content: message.content,
        intent: message.metadata?.intent as string | undefined,
        actions: message.metadata?.actions as unknown,
        metadata: message.metadata || {},
      },
    });

    // Mettre à jour la date de mise à jour de la conversation
    await this.prisma.agentConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }
}
