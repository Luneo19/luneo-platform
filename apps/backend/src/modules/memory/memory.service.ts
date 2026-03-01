import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class MemoryService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getContactMemory(user: CurrentUser, contactId: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId: user.organizationId },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            status: true,
            summary: true,
            sentiment: true,
            intent: true,
            updatedAt: true,
            satisfactionRating: true,
          },
        },
      },
    });

    if (!contact) throw new NotFoundException('Contact introuvable');

    const episodicFacts = contact.conversations
      .filter((conversation) => Boolean(conversation.summary))
      .slice(0, 10)
      .map((conversation) => ({
        conversationId: conversation.id,
        summary: conversation.summary,
        intent: conversation.intent,
        sentiment: conversation.sentiment,
        satisfactionRating: conversation.satisfactionRating,
        updatedAt: conversation.updatedAt,
      }));

    return {
      contact: {
        id: contact.id,
        email: contact.email,
        phone: contact.phone,
        firstName: contact.firstName,
        lastName: contact.lastName,
        leadScore: contact.leadScore,
        leadStatus: contact.leadStatus,
        churnRisk: contact.churnRisk,
        aiProfile: contact.aiProfile,
        tags: contact.tags,
        segments: contact.segments,
      },
      episodicFacts,
    };
  }

  async summarizeConversation(user: CurrentUser, conversationId: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: user.organizationId, deletedAt: null },
      include: {
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, createdAt: true },
        },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation introuvable');

    const userMessages = conversation.messages.filter((m) => m.role === MessageRole.USER);
    const assistantMessages = conversation.messages.filter((m) => m.role === MessageRole.ASSISTANT);
    const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? '';

    const summary = [
      `Canal: ${conversation.channelType}`,
      `Messages utilisateur: ${userMessages.length}`,
      `Messages assistant: ${assistantMessages.length}`,
      `Derniere demande: ${lastUserMessage.slice(0, 240)}`,
    ].join(' | ');

    const updated = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { summary },
      select: { id: true, summary: true, updatedAt: true },
    });

    if (conversation.contactId) {
      await this.prisma.contact.update({
        where: { id: conversation.contactId },
        data: {
          totalMessages: {
            increment: Math.max(conversation.messages.length, 0),
          },
          lastInteractionAt: new Date(),
        },
      });
    }

    return updated;
  }
}
