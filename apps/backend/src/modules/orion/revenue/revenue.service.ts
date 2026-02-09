import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type RevenueOverview = {
  mrr: number;
  arr: number;
  growthRate: number;
  churnRevenue: number;
  expansionRevenue: number;
};

export type UpsellOpportunity = {
  id: string;
  customerId: string;
  customerName: string;
  currentPlan: string;
  usagePercent: number;
  potentialMrr: number;
  confidence: 'high' | 'medium' | 'low';
};

export type LeadScore = {
  id: string;
  userId: string;
  email: string;
  score: number;
  source: string;
  lastActivity: string;
  status: 'hot' | 'warm' | 'cold';
};

export type ExperimentVariant = { id: string; name: string; config?: Record<string, unknown>; weight: number };

export type CreateExperimentDto = {
  name: string;
  description: string;
  type: string;
  variants: ExperimentVariant[];
  targetAudience?: Record<string, unknown>;
};

export type UpdateExperimentDto = {
  name?: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  variants?: ExperimentVariant[];
  targetAudience?: Record<string, unknown>;
};

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRevenueOverview(): Promise<RevenueOverview> {
    // No dedicated revenue aggregate in schema; use computed/mock data
    const mrr = 12450;
    const arr = mrr * 12;
    return {
      mrr,
      arr,
      growthRate: 0.082,
      churnRevenue: 420,
      expansionRevenue: 2100,
    };
  }

  async getUpsellOpportunities(limit = 10): Promise<UpsellOpportunity[]> {
    // Mock: users near plan limits (usage > 80%). In production, join usage/limits from product usage tables.
    const users = await this.prisma.user.findMany({
      take: Math.min(limit, 6),
      select: { id: true, email: true, firstName: true, lastName: true },
      where: { role: { not: UserRole.PLATFORM_ADMIN } },
    }).catch(() => []);

    const plans = ['Starter', 'Professional', 'Starter', 'Professional', 'Starter', 'Professional'];
    const usagePcts = [92, 87, 85, 94, 81, 88];
    const potentialMrrs = [29, 79, 29, 79, 29, 79];
    const confidences: ('high' | 'medium' | 'low')[] = ['high', 'high', 'medium', 'high', 'medium', 'high'];

    return users.slice(0, 6).map((u, i) => ({
      id: u.id,
      customerId: u.id,
      customerName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email?.split('@')[0] || 'Customer',
      currentPlan: plans[i] ?? 'Starter',
      usagePercent: usagePcts[i] ?? 85,
      potentialMrr: potentialMrrs[i] ?? 49,
      confidence: confidences[i] ?? 'medium',
    }));
  }

  async getLeadScores(limit = 10): Promise<LeadScore[]> {
    // Mock: lead scores for trial/free users based on engagement
    const users = await this.prisma.user.findMany({
      take: Math.min(limit, 8),
      select: { id: true, email: true, createdAt: true },
      where: { role: { not: UserRole.PLATFORM_ADMIN } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    const sources = ['Organic', 'Paid', 'Referral', 'Direct', 'Organic', 'Paid', 'Referral', 'Direct'];
    const scores = [85, 72, 68, 45, 91, 58, 62, 38];
    const statuses: ('hot' | 'warm' | 'cold')[] = ['hot', 'warm', 'warm', 'cold', 'hot', 'warm', 'warm', 'cold'];
    const lastActivities = ['2 hours ago', '1 day ago', '3 days ago', '1 week ago', '30 min ago', '2 days ago', '4 days ago', '2 weeks ago'];

    return users.slice(0, 8).map((u, i) => ({
      id: u.id,
      userId: u.id,
      email: u.email ?? '',
      score: scores[i] ?? 50,
      source: sources[i] ?? 'Direct',
      lastActivity: lastActivities[i] ?? '1 day ago',
      status: statuses[i] ?? 'warm',
    }));
  }

  async getExperiments() {
    return this.prisma.experiment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { assignments: true } } },
    });
  }

  async createExperiment(data: CreateExperimentDto) {
    return this.prisma.experiment.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        variants: (data.variants ?? []) as object,
        targetAudience: data.targetAudience as object | undefined,
        status: 'draft',
      },
    });
  }

  async updateExperiment(id: string, data: UpdateExperimentDto) {
    const existing = await this.prisma.experiment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Experiment not found');
    return this.prisma.experiment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.variants !== undefined && { variants: data.variants as object }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience as object }),
      },
    });
  }
}
