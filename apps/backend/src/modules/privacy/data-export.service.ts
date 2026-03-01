import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class DataExportService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async exportContactData(organizationId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      include: {
        conversations: {
          include: { messages: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        },
      },
    });
    if (!contact) throw new NotFoundException('Contact introuvable');

    return {
      generatedAt: new Date().toISOString(),
      contact,
    };
  }
}
