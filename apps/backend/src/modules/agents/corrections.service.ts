import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

interface CreateCorrectionDto {
  messageId: string;
  conversationId: string;
  originalContent: string;
  correctedContent: string;
  userQuestion?: string;
  correctedBy: string;
}

@Injectable()
export class CorrectionsService {
  private readonly logger = new Logger(CorrectionsService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async createCorrection(agentId: string, organizationId: string, dto: CreateCorrectionDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const correction = await this.prisma.agentCorrection.create({
      data: {
        agentId,
        messageId: dto.messageId,
        conversationId: dto.conversationId,
        originalContent: dto.originalContent,
        correctedContent: dto.correctedContent,
        userQuestion: dto.userQuestion,
        correctedBy: dto.correctedBy,
        priority: 'HIGH',
      },
    });

    this.logger.log(`Correction created for agent ${agentId}: ${correction.id}`);

    return correction;
  }

  async listCorrections(agentId: string, organizationId: string, page = 1, limit = 20) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const [corrections, total] = await Promise.all([
      this.prisma.agentCorrection.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.agentCorrection.count({ where: { agentId } }),
    ]);

    return {
      data: corrections,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPendingCorrections(agentId: string) {
    return this.prisma.agentCorrection.findMany({
      where: { agentId, indexedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsIndexed(correctionId: string) {
    return this.prisma.agentCorrection.update({
      where: { id: correctionId },
      data: { indexedAt: new Date() },
    });
  }
}
