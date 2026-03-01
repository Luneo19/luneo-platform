import { Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class RetentionPolicyService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async purgeExpiredData(now = new Date()) {
    const conversationsThreshold = new Date(now);
    conversationsThreshold.setMonth(conversationsThreshold.getMonth() - 24);

    const contactsThreshold = new Date(now);
    contactsThreshold.setMonth(contactsThreshold.getMonth() - 36);

    const [expiredConversations, staleContacts] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          updatedAt: { lt: conversationsThreshold },
          deletedAt: null,
        },
        select: { id: true },
        take: 1000,
      }),
      this.prisma.contact.findMany({
        where: {
          lastInteractionAt: { lt: contactsThreshold },
        },
        select: { id: true },
        take: 1000,
      }),
    ]);

    return {
      conversationsToReview: expiredConversations.length,
      contactsToReview: staleContacts.length,
      generatedAt: now.toISOString(),
    };
  }
}
