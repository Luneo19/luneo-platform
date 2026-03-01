import { Injectable } from '@nestjs/common';
import { ChannelType, SlaPriority } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class SlaService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async upsertConfig(input: {
    organizationId: string;
    priority: SlaPriority;
    channelType?: ChannelType;
    firstResponseTargetSeconds: number;
    resolutionTargetSeconds: number;
  }) {
    const existing = await this.prisma.sLAConfig.findFirst({
      where: {
        organizationId: input.organizationId,
        priority: input.priority,
        channelType: input.channelType ?? null,
      },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.sLAConfig.update({
        where: { id: existing.id },
        data: {
          firstResponseTargetSeconds: input.firstResponseTargetSeconds,
          resolutionTargetSeconds: input.resolutionTargetSeconds,
        },
      });
    }

    return this.prisma.sLAConfig.create({
      data: {
        organizationId: input.organizationId,
        priority: input.priority,
        channelType: input.channelType,
        firstResponseTargetSeconds: input.firstResponseTargetSeconds,
        resolutionTargetSeconds: input.resolutionTargetSeconds,
      },
    });
  }

  async getConfigs(organizationId: string) {
    return this.prisma.sLAConfig.findMany({
      where: { organizationId },
      orderBy: [{ priority: 'asc' }, { channelType: 'asc' }],
    });
  }

  async listBreaches(organizationId: string, limit = 50) {
    return this.prisma.sLABreach.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
    });
  }
}
