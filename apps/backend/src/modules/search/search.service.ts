import { Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async globalSearch(organizationId: string, query: string, limit = 10) {
    const q = query.trim();
    if (!q) {
      return {
        conversations: [],
        contacts: [],
        knowledge: [],
        notes: [],
      };
    }

    const take = Math.max(1, Math.min(limit, 50));

    const [conversations, contacts, knowledge, notes] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          organizationId,
          OR: [
            { summary: { contains: q, mode: 'insensitive' } },
            { visitorName: { contains: q, mode: 'insensitive' } },
            { visitorEmail: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          summary: true,
          visitorName: true,
          visitorEmail: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take,
      }),
      this.prisma.contact.findMany({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          leadStatus: true,
        },
        take,
      }),
      this.prisma.knowledgeChunk.findMany({
        where: {
          document: {
            source: {
              knowledgeBase: {
                organizationId,
              },
            },
          },
          content: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          content: true,
          document: {
            select: {
              id: true,
              title: true,
              source: {
                select: {
                  knowledgeBaseId: true,
                },
              },
            },
          },
        },
        take,
      }),
      this.prisma.internalNote.findMany({
        where: {
          organizationId,
          content: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          conversationId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
    ]);

    return {
      conversations,
      contacts,
      knowledge,
      notes,
    };
  }
}
