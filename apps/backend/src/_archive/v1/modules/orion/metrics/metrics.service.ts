// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class OrionMetricsService {
  private readonly logger = new Logger(OrionMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================
  // CAC (Customer Acquisition Cost)
  // =========================================

  /**
   * Record marketing spend for a given date/channel
   */
  async recordMarketingSpend(data: {
    date: Date;
    channel: string;
    amount: number;
    currency?: string;
    notes?: string;
    createdBy?: string;
  }) {
    return this.prisma.marketingSpend.create({
      data: {
        date: data.date,
        channel: data.channel.toLowerCase(),
        amount: data.amount,
        currency: data.currency || 'eur',
        notes: data.notes,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * List marketing spends with optional filters
   */
  async listMarketingSpends(params?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params?.startDate || params?.endDate) {
      where.date = {
        ...(params?.startDate ? { gte: params.startDate } : {}),
        ...(params?.endDate ? { lte: params.endDate } : {}),
      };
    }
    if (params?.channel) {
      where.channel = params.channel.toLowerCase();
    }
    return this.prisma.marketingSpend.findMany({
      where,
      orderBy: { date: 'desc' },
      take: params?.limit || 100,
    });
  }

  /**
   * Calculate CAC for a given period
   * CAC = Total Marketing Spend / New Customers
   */
  async calculateCAC(startDate: Date, endDate: Date): Promise<{
    cac: number | null;
    totalSpend: number;
    newCustomers: number;
    byChannel: Array<{ channel: string; spend: number; customers: number; cac: number | null }>;
  }> {
    const [spendResult, newCustomers] = await Promise.all([
      this.prisma.marketingSpend.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
    ]);

    const totalSpendCents = spendResult._sum.amount || 0;
    const totalSpend = totalSpendCents / 100;
    const cac = newCustomers > 0 ? Math.round((totalSpend / newCustomers) * 100) / 100 : null;

    // Breakdown by channel
    const spendByChannel = await this.prisma.marketingSpend.groupBy({
      by: ['channel'],
      _sum: { amount: true },
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const byChannel = spendByChannel.map((row) => ({
      channel: row.channel,
      spend: (row._sum.amount || 0) / 100,
      customers: 0, // Cannot attribute customers to specific channels without attribution tracking
      cac: null as number | null,
    }));

    return { cac, totalSpend, newCustomers, byChannel };
  }

  // =========================================
  // NPS (Net Promoter Score)
  // =========================================

  /**
   * Record an NPS response
   */
  async recordNPSResponse(data: {
    userId: string;
    score: number;
    comment?: string;
    source?: string;
  }) {
    if (data.score < 0 || data.score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }
    return this.prisma.nPSResponse.create({
      data: {
        userId: data.userId,
        score: data.score,
        comment: data.comment,
        source: data.source || 'in_app',
      },
    });
  }

  /**
   * Calculate NPS for a given period
   * NPS = % Promoters (9-10) - % Detractors (0-6)
   */
  async calculateNPS(startDate?: Date, endDate?: Date): Promise<{
    nps: number | null;
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    averageScore: number | null;
    trend: Array<{ month: string; nps: number; count: number }>;
  }> {
    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const responses = await this.prisma.nPSResponse.findMany({
      where,
      select: { score: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (responses.length === 0) {
      return {
        nps: null,
        totalResponses: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        averageScore: null,
        trend: [],
      };
    }

    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score <= 6).length;
    const total = responses.length;

    const nps = Math.round(((promoters - detractors) / total) * 100);
    const averageScore = Math.round((responses.reduce((sum, r) => sum + r.score, 0) / total) * 10) / 10;

    // Monthly trend
    const monthlyMap = new Map<string, { scores: number[]; count: number }>();
    for (const r of responses) {
      const month = r.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const entry = monthlyMap.get(month) || { scores: [], count: 0 };
      entry.scores.push(r.score);
      entry.count++;
      monthlyMap.set(month, entry);
    }

    const trend = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const p = data.scores.filter((s) => s >= 9).length;
      const d = data.scores.filter((s) => s <= 6).length;
      return {
        month,
        nps: Math.round(((p - d) / data.count) * 100),
        count: data.count,
      };
    });

    return { nps, totalResponses: total, promoters, passives, detractors, averageScore, trend };
  }

  // =========================================
  // Trial Conversion Rate
  // =========================================

  /**
   * Calculate trial-to-paid conversion rate
   * Looks at users who started on free plan and upgraded to a paid plan
   */
  async calculateTrialConversion(startDate?: Date, endDate?: Date): Promise<{
    conversionRate: number | null;
    totalTrialUsers: number;
    convertedUsers: number;
    averageDaysToConvert: number | null;
    byPlan: Array<{ plan: string; count: number }>;
  }> {
    const dateFilter = startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {};

    // Total users who registered (trial users = all users since everyone starts on free)
    const totalTrialUsers = await this.prisma.user.count({
      where: { ...dateFilter, deletedAt: null },
    });

    // Users who converted: brands with a non-free plan and at least one paid invoice
    // Brand.plan tracks the current plan; Invoice tracks payment history
    const paidBrands = await this.prisma.brand.findMany({
      where: {
        plan: { not: 'starter' }, // Any plan other than the free starter plan
        invoices: {
          some: {
            status: 'PAID',
            amount: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        subscriptionPlan: true,
        plan: true,
        createdAt: true,
        invoices: {
          where: { status: 'PAID', amount: { gt: 0 } },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const convertedUsers = paidBrands.length;
    const conversionRate =
      totalTrialUsers > 0
        ? Math.round((convertedUsers / totalTrialUsers) * 10000) / 100
        : null;

    // Average days to convert (brand creation → first paid invoice)
    let averageDaysToConvert: number | null = null;
    if (convertedUsers > 0) {
      const totalDays = paidBrands.reduce((sum, brand) => {
        const firstInvoice = brand.invoices[0];
        if (firstInvoice?.createdAt && brand.createdAt) {
          const diff = firstInvoice.createdAt.getTime() - brand.createdAt.getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      averageDaysToConvert = Math.round((totalDays / convertedUsers) * 10) / 10;
    }

    // Breakdown by plan
    const planCounts = new Map<string, number>();
    for (const brand of paidBrands) {
      const plan = brand.subscriptionPlan || brand.plan || 'unknown';
      planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
    }
    const byPlan = Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count }));

    return { conversionRate, totalTrialUsers, convertedUsers, averageDaysToConvert, byPlan };
  }

  // =========================================
  // Aggregated KPIs (all metrics at once)
  // =========================================

  async getAllKPIs(): Promise<{
    cac: { value: number | null; totalSpend: number; newCustomers: number };
    nps: { value: number | null; totalResponses: number; promoters: number; detractors: number };
    trialConversion: { rate: number | null; totalTrial: number; converted: number; avgDays: number | null };
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [cac, nps, trial] = await Promise.all([
      this.calculateCAC(thirtyDaysAgo, now),
      this.calculateNPS(),
      this.calculateTrialConversion(),
    ]);

    return {
      cac: { value: cac.cac, totalSpend: cac.totalSpend, newCustomers: cac.newCustomers },
      nps: { value: nps.nps, totalResponses: nps.totalResponses, promoters: nps.promoters, detractors: nps.detractors },
      trialConversion: { rate: trial.conversionRate, totalTrial: trial.totalTrialUsers, converted: trial.convertedUsers, avgDays: trial.averageDaysToConvert },
    };
  }
}
