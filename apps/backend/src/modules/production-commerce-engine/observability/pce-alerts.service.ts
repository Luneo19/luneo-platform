import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { AlertInfo } from '../interfaces/pce.interfaces';

@Injectable()
export class PCEAlertsService {
  private readonly logger = new Logger(PCEAlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAlerts(brandId: string, limit = 20): Promise<AlertInfo[]> {
    const errors = await this.prisma.pipelineError.findMany({
      where: {
        pipeline: { brandId },
        resolvedAt: null,
      },
      include: { pipeline: { select: { id: true, orderId: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return errors.map((err) => ({
      id: err.id,
      type: err.retryable ? ('warning' as const) : ('error' as const),
      message: err.error,
      stage: err.stage,
      pipelineId: err.pipeline.id,
      createdAt: err.createdAt,
    }));
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.prisma.pipelineError.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });
  }
}
