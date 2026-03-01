import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class DataDeletionService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async requestDeletion(
    organizationId: string,
    contactId: string,
    requestedByUserId?: string,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException('Contact introuvable');

    return this.prisma.dataDeletionRequest.create({
      data: {
        organizationId,
        contactId,
        requestedBy: requestedByUserId ? 'ADMIN' : 'AUTOMATED',
        requestedByUserId,
        status: 'PENDING',
      },
    });
  }
}
