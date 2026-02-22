/**
 * @fileoverview Service de gestion des conversations avec les agents
 * @module ConversationService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ Validation Zod
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const ConversationCreateSchema = z.object({
  id: z.string().min(1).optional(),
  shopId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
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
      type ActionItem = NonNullable<ConversationMessageMetadata['actions']>[number];
      result.actions = meta.actions.filter((action): action is ActionItem => {
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
   * Liste les conversations d'un utilisateur
   */
  async listConversations(params: {
    userId: string;
    brandId?: string;
    agentType?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    agentType: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    lastMessage?: string;
  }>> {
    try {
      const where: Prisma.AgentConversationWhereInput = {
        userId: params.userId,
      };
      if (params.brandId) where.brandId = params.brandId;
      if (params.agentType) where.agentType = params.agentType;

      const conversations = await this.prisma.agentConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: params.limit || 20,
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true },
          },
        },
      });

      return conversations.map((conv) => ({
        id: conv.id,
        agentType: conv.agentType,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0]?.content?.substring(0, 100),
      }));
    } catch (error) {
      this.logger.error(`Failed to list conversations: ${error instanceof Error ? error.message : 'Unknown'}`);
      return [];
    }
  }

  /**
   * Récupère une conversation spécifique avec ses messages
   */
  async getConversation(conversationId: string, userId: string): Promise<{
    id: string;
    agentType: string;
    createdAt: Date;
    updatedAt: Date;
    messages: ConversationMessage[];
  } | null> {
    try {
      const conversation = await this.prisma.agentConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) return null;

      return {
        id: conversation.id,
        agentType: conversation.agentType,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((msg) => this.normalizeMessage(msg)),
      };
    } catch (error) {
      this.logger.error(`Failed to get conversation: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      const conversation = await this.prisma.agentConversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      await this.prisma.agentMessage.deleteMany({
        where: { conversationId },
      });

      await this.prisma.agentConversation.delete({
        where: { id: conversationId },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
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
