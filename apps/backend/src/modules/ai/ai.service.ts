import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async estimateCost(prompt: string, options: any): Promise<number> {
    // Simple cost estimation based on prompt length and options
    const baseCost = 0.01; // 1 cent per character
    const promptCost = prompt.length * baseCost;
    const optionsCost = options.highRes ? 0.05 : 0.02; // High-res costs more
    
    return Math.round((promptCost + optionsCost) * 100); // Return in cents
  }

  async checkUserQuota(userId: string, estimatedCost: number): Promise<boolean> {
    const quota = await this.prisma.userQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      return false;
    }

    // Check if user has enough quota
    return quota.monthlyUsed < quota.monthlyLimit && 
           quota.costUsedCents + estimatedCost <= quota.costLimitCents;
  }

  async updateUserQuota(userId: string, cost: number): Promise<void> {
    await this.prisma.userQuota.update({
      where: { userId },
      data: {
        monthlyUsed: {
          increment: 1,
        },
        costUsedCents: {
          increment: cost,
        },
      },
    });
  }

  async recordAICost(brandId: string, provider: string, model: string, cost: number, metadata: any): Promise<void> {
    await this.prisma.aICost.create({
      data: {
        brandId,
        provider,
        model,
        costCents: cost,
        tokens: metadata.tokens,
        duration: metadata.duration,
      },
    });
  }
}
