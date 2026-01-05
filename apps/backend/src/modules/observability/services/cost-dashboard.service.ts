import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface CostBreakdown {
  feature: string;
  provider: string;
  costCents: number;
  usage: number;
  unit: string;
  period: 'day' | 'week' | 'month';
}

export interface TenantCost {
  brandId: string;
  brandName: string;
  totalCostCents: number;
  breakdown: CostBreakdown[];
  period: string;
}

export interface CostDashboard {
  period: string;
  totalCostCents: number;
  byFeature: Record<string, number>;
  byProvider: Record<string, number>;
  byTenant: TenantCost[];
  trends: Array<{
    date: string;
    costCents: number;
  }>;
}

@Injectable()
export class CostDashboardService {
  private readonly logger = new Logger(CostDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère le dashboard de coûts global
   */
  async getCostDashboard(
    period: 'day' | 'week' | 'month' = 'month',
    startDate?: Date,
    endDate?: Date,
  ): Promise<CostDashboard> {
    const now = new Date();
    const start = startDate || this.getPeriodStart(period, now);
    const end = endDate || now;

    // Récupérer les coûts IA
    const aiCosts = await this.getAICosts(start, end);

    // Récupérer les coûts par tenant
    const tenantCosts = await this.getTenantCosts(start, end);

    // Calculer les totaux
    const totalCostCents = aiCosts.reduce((sum, cost) => sum + cost.costCents, 0);

    // Grouper par feature
    const byFeature: Record<string, number> = {};
    for (const cost of aiCosts) {
      byFeature[cost.feature] = (byFeature[cost.feature] || 0) + cost.costCents;
    }

    // Grouper par provider
    const byProvider: Record<string, number> = {};
    for (const cost of aiCosts) {
      byProvider[cost.provider] = (byProvider[cost.provider] || 0) + cost.costCents;
    }

    // Calculer les trends
    const trends = await this.getCostTrends(start, end, period);

    return {
      period: `${start.toISOString()} to ${end.toISOString()}`,
      totalCostCents,
      byFeature,
      byProvider,
      byTenant: tenantCosts,
      trends,
    };
  }

  /**
   * Récupère les coûts IA
   */
  private async getAICosts(start: Date, end: Date): Promise<CostBreakdown[]> {
    const costs = await this.prisma.aICost.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Grouper par feature et provider
    const breakdown: Record<string, CostBreakdown> = {};

    for (const cost of costs) {
      const key = `${cost.provider}_${cost.model}`;
      if (!breakdown[key]) {
        breakdown[key] = {
          feature: this.getFeatureFromModel(cost.model),
          provider: cost.provider,
          costCents: 0,
          usage: 0,
          unit: cost.tokens ? 'tokens' : 'requests',
          period: 'month',
        };
      }

      breakdown[key].costCents += cost.costCents;
      breakdown[key].usage += cost.tokens || 1;
    }

    return Object.values(breakdown);
  }

  /**
   * Récupère les coûts par tenant
   */
  private async getTenantCosts(start: Date, end: Date): Promise<TenantCost[]> {
    const costs = await this.prisma.aICost.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Grouper par brand
    const byBrand: Record<string, TenantCost> = {};

    for (const cost of costs) {
      const brandId = cost.brandId;
      if (!byBrand[brandId]) {
        byBrand[brandId] = {
          brandId,
          brandName: cost.brand.name,
          totalCostCents: 0,
          breakdown: [],
          period: 'month',
        };
      }

      byBrand[brandId].totalCostCents += cost.costCents;

      // Ajouter au breakdown
      const feature = this.getFeatureFromModel(cost.model);
      const existing = byBrand[brandId].breakdown.find(
        (b) => b.feature === feature && b.provider === cost.provider,
      );

      if (existing) {
        existing.costCents += cost.costCents;
        existing.usage += cost.tokens || 1;
      } else {
        byBrand[brandId].breakdown.push({
          feature,
          provider: cost.provider,
          costCents: cost.costCents,
          usage: cost.tokens || 1,
          unit: cost.tokens ? 'tokens' : 'requests',
          period: 'month',
        });
      }
    }

    // Trier par coût décroissant
    return Object.values(byBrand).sort((a, b) => b.totalCostCents - a.totalCostCents);
  }

  /**
   * Récupère les trends de coûts
   */
  private async getCostTrends(
    start: Date,
    end: Date,
    period: 'day' | 'week' | 'month',
  ): Promise<Array<{ date: string; costCents: number }>> {
    // TODO: Agréger par jour/semaine/mois
    const costs = await this.prisma.aICost.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        costCents: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Grouper par période
    const trends: Record<string, number> = {};

    for (const cost of costs) {
      const dateKey = this.getDateKey(cost.createdAt, period);
      trends[dateKey] = (trends[dateKey] || 0) + cost.costCents;
    }

    return Object.entries(trends)
      .map(([date, costCents]) => ({ date, costCents }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Détermine la feature depuis le modèle
   */
  private getFeatureFromModel(model: string): string {
    if (model.includes('dall-e') || model.includes('sdxl')) {
      return 'image-generation';
    } else if (model.includes('gpt')) {
      return 'text-generation';
    } else {
      return 'other';
    }
  }

  /**
   * Obtient la clé de date pour le groupement
   */
  private getDateKey(date: Date, period: 'day' | 'week' | 'month'): string {
    if (period === 'day') {
      return date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const week = this.getWeekNumber(date);
      return `${date.getFullYear()}-W${week}`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * Obtient le numéro de semaine
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Obtient le début de période
   */
  private getPeriodStart(period: 'day' | 'week' | 'month', date: Date): Date {
    const start = new Date(date);
    if (period === 'day') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    return start;
  }

  /**
   * Récupère le coût d'un tenant spécifique
   */
  async getTenantCost(brandId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<TenantCost> {
    const now = new Date();
    const start = this.getPeriodStart(period, now);

    const costs = await this.prisma.aICost.findMany({
      where: {
        brandId,
        createdAt: {
          gte: start,
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalCostCents = costs.reduce((sum, cost) => sum + cost.costCents, 0);

    const breakdown: CostBreakdown[] = [];
    const byKey: Record<string, CostBreakdown> = {};

    for (const cost of costs) {
      const feature = this.getFeatureFromModel(cost.model);
      const key = `${feature}_${cost.provider}`;

      if (!byKey[key]) {
        byKey[key] = {
          feature,
          provider: cost.provider,
          costCents: 0,
          usage: 0,
          unit: cost.tokens ? 'tokens' : 'requests',
          period,
        };
      }

      byKey[key].costCents += cost.costCents;
      byKey[key].usage += cost.tokens || 1;
    }

    return {
      brandId,
      brandName: costs[0]?.brand.name || 'Unknown',
      totalCostCents,
      breakdown: Object.values(byKey),
      period,
    };
  }
}






























