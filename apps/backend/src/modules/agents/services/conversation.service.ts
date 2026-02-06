/**
 * @fileoverview Service de gestion des conversations avec les agents
 * @module ConversationService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ Validation Zod
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';
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

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Métadonnées de message avec typage strict
 */
export interface ConversationMessageMetadata {
  intent?: string;
  actions?: Array<{
    type: string;
    label: string;
    payload: Record<string, unknown>;
    requiresConfirmation: boolean;
  }>;
  [key: string]: unknown; // Pour extensibilité
}

/**
 * Message de conversation avec typage strict
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ConversationMessageMetadata;
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
   * Récupère l'historique d'une conversation avec typage strict et validation
   */
  async getHistory(conversationId: string, limit: number = 10): Promise<ConversationMessage[]> {
    // ✅ Validation des entrées
    if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length === 0) {
      this.logger.warn('Invalid conversationId provided to getHistory');
      return [];
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      this.logger.warn(`Invalid limit provided to getHistory: ${limit}, using default 10`);
      limit = 10;
    }

    try {
      const messages = await this.prisma.agentMessage.findMany({
        where: { conversationId: conversationId.trim() },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      // ✅ Normalisation avec gardes
      return messages.map((msg) => this.normalizeMessage(msg));
    } catch (error) {
      this.logger.error(
        `Failed to get history: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return [];
    }
  }

  /**
   * Normalise un message depuis Prisma avec gardes
   */
  private normalizeMessage(msg: {
    role: string;
    content: string;
    metadata: unknown;
  }): ConversationMessage {
    const validRoles = ['user', 'assistant', 'system'] as const;
    const role = validRoles.includes(msg.role as typeof validRoles[number])
      ? (msg.role as typeof validRoles[number])
      : 'user';

    return {
      role,
      content: typeof msg.content === 'string' ? msg.content.trim() : '',
      metadata: this.normalizeMessageMetadata(msg.metadata),
    };
  }

  /**
   * Normalise les métadonnées de message avec gardes
   */
  private normalizeMessageMetadata(metadata: unknown): ConversationMessageMetadata | undefined {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return undefined;
    }

    const meta = metadata as Partial<ConversationMessageMetadata>;
    const result: ConversationMessageMetadata = {};

    if (typeof meta.intent === 'string' && meta.intent.trim().length > 0) {
      result.intent = meta.intent.trim();
    }

    if (Array.isArray(meta.actions)) {
      result.actions = meta.actions.filter((action): action is ConversationMessageMetadata['actions'][0] => {
        return (
          action &&
          typeof action === 'object' &&
          typeof action.type === 'string' &&
          typeof action.label === 'string' &&
          typeof action.requiresConfirmation === 'boolean'
        );
      });
    }

    // ✅ Copier les autres propriétés pour extensibilité
    Object.keys(meta).forEach((key) => {
      if (key !== 'intent' && key !== 'actions' && !(key in result)) {
        result[key] = meta[key];
      }
    });

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Ajoute un message à une conversation avec validation robuste
   */
  async addMessage(
    conversationId: string,
    message: ConversationMessage,
  ): Promise<void> {
    // ✅ Validation des entrées
    if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length === 0) {
      this.logger.warn('Invalid conversationId provided to addMessage');
      throw new BadRequestException('Conversation ID is required');
    }

    if (!message || typeof message !== 'object') {
      this.logger.warn('Invalid message provided to addMessage');
      throw new BadRequestException('Message is required');
    }

    if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
      this.logger.warn('Invalid message content provided to addMessage');
      throw new BadRequestException('Message content is required');
    }

    const validRoles = ['user', 'assistant', 'system'] as const;
    if (!validRoles.includes(message.role)) {
      this.logger.warn(`Invalid message role provided: ${message.role}`);
      throw new BadRequestException(`Invalid message role. Must be one of: ${validRoles.join(', ')}`);
    }

    try {
      // ✅ Normaliser les métadonnées
      const normalizedMetadata = this.normalizeMessageMetadata(message.metadata);

      await this.prisma.agentMessage.create({
        data: {
          conversationId: conversationId.trim(),
          role: message.role,
          content: message.content.trim(),
          intent: normalizedMetadata?.intent,
          actions: normalizedMetadata?.actions ? (normalizedMetadata.actions as Prisma.InputJsonValue) : undefined,
          metadata: normalizedMetadata ? (normalizedMetadata as Prisma.InputJsonValue) : {},
        },
      });

      // ✅ Mettre à jour la date de mise à jour de la conversation
      await this.prisma.agentConversation.update({
        where: { id: conversationId.trim() },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Failed to add message: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
