import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type CreateExperimentParams = {
  userId: string;
  name: string;
  description?: string;
  brandId?: string;
  basePrompt: string;
  variantA: string;
  variantB: string;
  provider?: string;
  model?: string;
  parameters?: Record<string, unknown>;
  sampleCount?: number;
};

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createExperiment(params: CreateExperimentParams) {
    const experiment = await this.prisma.aIPromptExperiment.create({
      data: {
        userId: params.userId,
        name: params.name,
        description: params.description,
        brandId: params.brandId,
        basePrompt: params.basePrompt,
        variantA: params.variantA,
        variantB: params.variantB,
        provider: params.provider ?? 'stability',
        model: params.model ?? 'sdxl-1.0',
        parameters: (params.parameters ?? {}) as any,
        sampleCount: params.sampleCount ?? 5,
        samplesA: [],
        samplesB: [],
      },
    });
    this.logger.log(`A/B experiment created: ${experiment.id}`);
    return experiment;
  }

  async getExperiment(id: string, userId: string) {
    const experiment = await this.prisma.aIPromptExperiment.findFirst({
      where: { id, userId },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');
    return experiment;
  }

  async listExperiments(userId: string, brandId?: string, status?: string) {
    return this.prisma.aIPromptExperiment.findMany({
      where: {
        userId,
        ...(brandId ? { brandId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async completeExperiment(id: string, userId: string) {
    const experiment = await this.getExperiment(id, userId);
    if (experiment.status === 'COMPLETED' || experiment.status === 'CANCELLED') {
      throw new BadRequestException('Experiment already completed or cancelled');
    }

    const metricsA = (experiment.metricsA ?? {}) as Record<string, number>;
    const metricsB = (experiment.metricsB ?? {}) as Record<string, number>;
    const avgA = this.aggregateMetrics(metricsA);
    const avgB = this.aggregateMetrics(metricsB);

    let winner: string | null = null;
    let winReason: string | null = null;
    if (avgA > avgB) {
      winner = 'A';
      winReason = `Variant A had higher aggregate score (${avgA.toFixed(2)} vs ${avgB.toFixed(2)})`;
    } else if (avgB > avgA) {
      winner = 'B';
      winReason = `Variant B had higher aggregate score (${avgB.toFixed(2)} vs ${avgA.toFixed(2)})`;
    } else {
      winReason = 'No clear winner; metrics were tied';
    }

    const updated = await this.prisma.aIPromptExperiment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        winner,
        winReason,
      },
    });
    this.logger.log(`Experiment ${id} completed; winner: ${winner ?? 'tie'}`);
    return updated;
  }

  async recordMetric(experimentId: string, variant: 'A' | 'B', metric: string, value: number) {
    const experiment = await this.prisma.aIPromptExperiment.findFirst({
      where: { id: experimentId },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');
    if (experiment.status === 'COMPLETED' || experiment.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record metrics for completed or cancelled experiment');
    }

    const current = (variant === 'A' ? experiment.metricsA : experiment.metricsB) as Record<string, number> | null ?? {};
    const updated = { ...current, [metric]: value };
    await this.prisma.aIPromptExperiment.update({
      where: { id: experimentId },
      data: variant === 'A' ? { metricsA: updated } : { metricsB: updated },
    });
    return { recorded: true, variant, metric, value };
  }

  private aggregateMetrics(metrics: Record<string, number>): number {
    const values = Object.values(metrics).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
