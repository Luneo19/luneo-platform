import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { LLM_COSTS_PER_1K_TOKENS } from '../services/llm-provider.enum';

export interface CostRecord {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  latencyMs: number;
  agentType?: string;
  brandId?: string;
  userId?: string;
  conversationId?: string;
}

@Injectable()
export class CostTrackerService {
  private readonly logger = new Logger(CostTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  calculateCostCents(model: string, promptTokens: number, completionTokens: number): number {
    const costs = LLM_COSTS_PER_1K_TOKENS[model];
    if (!costs) return 0;
    const costUsd = (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
    return Math.ceil(costUsd * 100); // Convert to cents
  }

  async recordCost(record: CostRecord): Promise<void> {
    try {
      // Record in AIUsageLog
      await this.prisma.aIUsageLog.create({
        data: {
          userId: record.userId || 'system',
          brandId: record.brandId,
          agentId: record.agentType,
          provider: record.provider,
          model: record.model,
          promptTokens: record.promptTokens,
          completionTokens: record.completionTokens,
          totalTokens: record.totalTokens,
          costCents: record.costCents,
          latencyMs: record.latencyMs,
          requestType: 'chat',
          success: true,
        },
      });

      // Record in AICost (aggregate)
      if (record.brandId) {
        await this.prisma.aICost.create({
          data: {
            brandId: record.brandId,
            provider: record.provider,
            model: record.model,
            costCents: record.costCents,
            tokens: record.totalTokens,
            duration: Math.ceil(record.latencyMs / 1000),
          },
        });
      }

      // Update quota usage
      await this.updateQuotaUsage(record);
    } catch (error) {
      this.logger.error(`Failed to record cost: ${error}`);
    }
  }

  async getDailyCost(brandId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.aIUsageLog.aggregate({
      where: {
        brandId,
        createdAt: { gte: today },
      },
      _sum: { costCents: true },
    });

    return result._sum.costCents || 0;
  }

  async getMonthlyCost(brandId: string): Promise<number> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.aIUsageLog.aggregate({
      where: {
        brandId,
        createdAt: { gte: firstOfMonth },
      },
      _sum: { costCents: true },
    });

    return result._sum.costCents || 0;
  }

  private async updateQuotaUsage(record: CostRecord): Promise<void> {
    if (!record.brandId) return;

    try {
      const quota = await this.prisma.aIQuota.findFirst({
        where: { brandId: record.brandId },
      });

      if (quota) {
        await this.prisma.aIQuota.update({
          where: { id: quota.id },
          data: {
            usedRequests: { increment: 1 },
            usedTokens: { increment: record.totalTokens },
            monthlyUsed: { increment: 1 },
          },
        });
      }
    } catch {
      // Non-critical
    }
  }
}
