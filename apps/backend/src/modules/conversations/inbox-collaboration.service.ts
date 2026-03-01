import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignedByType, Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class InboxCollaborationService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async assignConversation(
    conversationId: string,
    assigneeUserId: string,
    assignedBy: AssignedByType,
    user: CurrentUser,
  ) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: user.organizationId },
      select: { id: true, organizationId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');

    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: user.organizationId,
        userId: assigneeUserId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!member) throw new BadRequestException('Assignee hors organisation');

    const assignment = await this.prisma.conversationAssignment.create({
      data: {
        conversationId: conversation.id,
        organizationId: conversation.organizationId,
        assignedToUserId: assigneeUserId,
        assignedBy,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        assignedToId: assigneeUserId,
        assignedAt: assignment.assignedAt,
      },
    });

    return assignment;
  }

  async addInternalNote(
    conversationId: string,
    content: string,
    user: CurrentUser,
  ) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    if (!content.trim()) throw new BadRequestException('Contenu requis');

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId: user.organizationId },
      select: { id: true, organizationId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');

    return this.prisma.internalNote.create({
      data: {
        conversationId: conversation.id,
        organizationId: conversation.organizationId,
        authorId: user.id,
        content: content.trim(),
      },
    });
  }

  async listInternalNotes(conversationId: string, user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.internalNote.findMany({
      where: {
        conversationId,
        organizationId: user.organizationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertAssignmentRule(
    user: CurrentUser,
    payload: {
      name: string;
      conditions?: Record<string, unknown>;
      assignToUserId?: string;
      assignToTeam?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    if (!payload.name.trim()) throw new BadRequestException('Nom de regle requis');

    return this.prisma.assignmentRule.create({
      data: {
        organizationId: user.organizationId,
        name: payload.name.trim(),
        conditions: payload.conditions as Prisma.InputJsonValue | undefined,
        assignToUserId: payload.assignToUserId,
        assignToTeam: payload.assignToTeam,
        priority: payload.priority ?? 100,
        isActive: payload.isActive ?? true,
      },
    });
  }

  async listAssignmentRules(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.assignmentRule.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createCannedResponse(
    user: CurrentUser,
    payload: {
      title: string;
      content: string;
      category?: string;
      shortcut?: string;
    },
  ) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    if (!payload.title.trim() || !payload.content.trim()) {
      throw new BadRequestException('Titre et contenu requis');
    }

    return this.prisma.cannedResponse.create({
      data: {
        organizationId: user.organizationId,
        title: payload.title.trim(),
        content: payload.content.trim(),
        category: payload.category,
        shortcut: payload.shortcut,
        createdById: user.id,
      },
    });
  }

  async listCannedResponses(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.cannedResponse.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { usageCount: 'desc' },
    });
  }
}
