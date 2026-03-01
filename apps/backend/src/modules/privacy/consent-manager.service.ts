import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class ConsentManagerService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async setConsent(input: {
    organizationId: string;
    contactId: string;
    consentType: ConsentType;
    granted: boolean;
    ipAddress?: string;
    userAgent?: string;
    policyVersion?: string;
  }) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: input.contactId,
        organizationId: input.organizationId,
      },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException('Contact introuvable');

    return this.prisma.consentRecord.create({
      data: {
        organizationId: input.organizationId,
        contactId: input.contactId,
        consentType: input.consentType,
        granted: input.granted,
        grantedAt: input.granted ? new Date() : null,
        revokedAt: input.granted ? null : new Date(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        policyVersion: input.policyVersion,
      },
    });
  }
}
