// @ts-nocheck
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class BulkGeneratorService {
  private readonly logger = new Logger(BulkGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBulkJob(params: {
    userId: string;
    brandId: string;
    name: string;
    description?: string;
    template: string;
    variables: Record<string, string>[];
    provider?: string;
    model?: string;
    parameters?: Record<string, unknown>;
    batchSize?: number;
  }) {
    if (!params.variables.length) throw new BadRequestException('Variables array cannot be empty');
    if (params.variables.length > 1000) throw new BadRequestException('Maximum 1000 items per bulk job');

    const estimatedCreditsPerItem = 2; // Base cost per generation
    const estimatedCostPerItem = 0.02; // EUR per generation
    const estimatedDuration = params.variables.length * 5; // 5 seconds per item

    const job = await this.prisma.aIBulkJob.create({
      data: {
        userId: params.userId,
        brandId: params.brandId,
        name: params.name,
        description: params.description,
        template: params.template,
        variables: params.variables,
        variablesCount: params.variables.length,
        estimatedCost: params.variables.length * estimatedCostPerItem * 100,
        estimatedCredits: params.variables.length * estimatedCreditsPerItem,
        estimatedDuration,
        provider: params.provider,
        model: params.model,
        parameters: (params.parameters || {}) as InputJsonValue,
        batchSize: params.batchSize || 10,
      },
    });

    // Create individual generation entries
    const generations = params.variables.map((variableSet, index) => ({
      bulkJobId: job.id,
      variableSet,
      index,
    }));

    await this.prisma.aIBulkJobGeneration.createMany({ data: generations });

    this.logger.log(`Bulk job created: ${job.id} with ${params.variables.length} items`);
    return job;
  }

  async getJob(jobId: string, userId: string) {
    const job = await this.prisma.aIBulkJob.findFirst({
      where: { id: jobId, userId },
      include: { generations: { orderBy: { index: 'asc' }, take: 50 } },
    });
    if (!job) throw new BadRequestException('Bulk job not found');
    return job;
  }

  async listJobs(userId: string, brandId?: string, status?: string) {
    return this.prisma.aIBulkJob.findMany({
      where: {
        userId,
        ...(brandId ? { brandId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await this.prisma.aIBulkJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new BadRequestException('Bulk job not found');
    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      throw new BadRequestException('Job cannot be cancelled in current state');
    }
    return this.prisma.aIBulkJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }

  async getJobProgress(jobId: string): Promise<{ completed: number; failed: number; total: number; percent: number }> {
    const job = await this.prisma.aIBulkJob.findUnique({ where: { id: jobId } });
    if (!job) throw new BadRequestException('Bulk job not found');
    return {
      completed: job.completedCount,
      failed: job.failedCount,
      total: job.variablesCount,
      percent: Math.round(((job.completedCount + job.failedCount) / job.variablesCount) * 100),
    };
  }
}
