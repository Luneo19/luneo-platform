/**
 * @fileoverview Controller admin pour les metriques et alertes des agents IA
 * @module AgentsAdminController
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { AgentAlertsService } from './ai-monitor/services/agent-alerts.service';
import { AnalyticsService } from './ai-monitor/services/analytics.service';
import { MetricsService } from './ai-monitor/services/metrics.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

@ApiTags('Agents Admin')
@ApiBearerAuth()
@Controller('agents/admin')
@UseGuards(JwtAuthGuard)
export class AgentsAdminController {
  private readonly logger = new Logger(AgentsAdminController.name);

  constructor(
    private readonly agentAlerts: AgentAlertsService,
    private readonly analytics: AnalyticsService,
    private readonly metrics: MetricsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Dashboard overview : metriques globales
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard metriques agents' })
  @ApiResponse({ status: 200, description: 'Metriques globales' })
  async getDashboard(
    @CurrentBrand() brand: { id: string } | null,
    @Query('days') days?: string,
  ) {
    const brandId = brand?.id;
    const daysBack = parseInt(days || '7', 10);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const [usageLogs, alerts, metricsSummary] = await Promise.all([
      this.prisma.aIUsageLog.aggregate({
        where: {
          ...(brandId ? { brandId } : {}),
          createdAt: { gte: since },
        },
        _sum: {
          totalTokens: true,
          costCents: true,
        },
        _count: true,
        _avg: {
          latencyMs: true,
        },
      }),
      this.agentAlerts.getActiveAlerts(brandId),
      this.agentAlerts.getMetricsSummary(brandId, { start: since, end: new Date() }),
    ]);

    const errorLogs = await this.prisma.aIUsageLog.count({
      where: {
        ...(brandId ? { brandId } : {}),
        createdAt: { gte: since },
        success: false,
      },
    });

    const totalRequests = usageLogs._count;
    const errorRate = totalRequests > 0 ? (errorLogs / totalRequests) * 100 : 0;

    return {
      success: true,
      data: {
        period: { days: daysBack, since: since.toISOString() },
        overview: {
          totalRequests,
          totalTokens: usageLogs._sum.totalTokens || 0,
          totalCostCents: usageLogs._sum.costCents || 0,
          totalCostDollars: ((usageLogs._sum.costCents || 0) / 100).toFixed(2),
          avgLatencyMs: Math.round(usageLogs._avg.latencyMs || 0),
          errorRate: Number(errorRate.toFixed(2)),
          errorCount: errorLogs,
        },
        activeAlerts: alerts,
        metricsSummary,
      },
    };
  }

  /**
   * Usage par provider
   */
  @Get('usage-by-provider')
  @ApiOperation({ summary: 'Usage par provider LLM' })
  async getUsageByProvider(
    @CurrentBrand() brand: { id: string } | null,
    @Query('days') days?: string,
  ) {
    const brandId = brand?.id;
    const daysBack = parseInt(days || '30', 10);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const usage = await this.prisma.aIUsageLog.groupBy({
      by: ['provider'],
      where: {
        ...(brandId ? { brandId } : {}),
        createdAt: { gte: since },
      },
      _sum: {
        totalTokens: true,
        costCents: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
    });

    return {
      success: true,
      data: usage.map((u) => ({
        provider: u.provider,
        requests: u._count,
        totalTokens: u._sum.totalTokens || 0,
        costCents: u._sum.costCents || 0,
        costDollars: ((u._sum.costCents || 0) / 100).toFixed(2),
        avgLatencyMs: Math.round(u._avg.latencyMs || 0),
      })),
    };
  }

  /**
   * Usage par agent (luna/aria/nova)
   */
  @Get('usage-by-agent')
  @ApiOperation({ summary: 'Usage par agent' })
  async getUsageByAgent(
    @CurrentBrand() brand: { id: string } | null,
    @Query('days') days?: string,
  ) {
    const brandId = brand?.id;
    const daysBack = parseInt(days || '30', 10);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const usage = await this.prisma.aIUsageLog.groupBy({
      by: ['operation'],
      where: {
        ...(brandId ? { brandId } : {}),
        createdAt: { gte: since },
      },
      _sum: {
        totalTokens: true,
        costCents: true,
      },
      _count: true,
    });

    return {
      success: true,
      data: usage.map((u) => ({
        agent: u.operation,
        requests: u._count,
        totalTokens: u._sum.totalTokens || 0,
        costCents: u._sum.costCents || 0,
        costDollars: ((u._sum.costCents || 0) / 100).toFixed(2),
      })),
    };
  }

  /**
   * Historique des couts par jour
   */
  @Get('cost-history')
  @ApiOperation({ summary: 'Historique des couts par jour' })
  async getCostHistory(
    @CurrentBrand() brand: { id: string } | null,
    @Query('days') days?: string,
  ) {
    const brandId = brand?.id;
    const daysBack = parseInt(days || '30', 10);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.aIUsageLog.findMany({
      where: {
        ...(brandId ? { brandId } : {}),
        createdAt: { gte: since },
        success: true,
      },
      select: {
        costCents: true,
        totalTokens: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyCosts: Record<string, { costCents: number; tokens: number; requests: number }> = {};

    for (const log of logs) {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!dailyCosts[date]) {
        dailyCosts[date] = { costCents: 0, tokens: 0, requests: 0 };
      }
      dailyCosts[date].costCents += log.costCents;
      dailyCosts[date].tokens += log.totalTokens;
      dailyCosts[date].requests += 1;
    }

    return {
      success: true,
      data: Object.entries(dailyCosts).map(([date, values]) => ({
        date,
        costCents: values.costCents,
        costDollars: (values.costCents / 100).toFixed(2),
        tokens: values.tokens,
        requests: values.requests,
      })),
    };
  }

  /**
   * Alertes actives
   */
  @Get('alerts')
  @ApiOperation({ summary: 'Alertes actives' })
  async getAlerts(
    @CurrentBrand() brand: { id: string } | null,
  ) {
    const alerts = await this.agentAlerts.getActiveAlerts(brand?.id);

    return {
      success: true,
      data: alerts,
    };
  }

  /**
   * Acquitter une alerte
   */
  @Post('alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acquitter une alerte' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.agentAlerts.acknowledgeAlert(alertId, user.id);

    return { success: true, message: 'Alerte acquittee' };
  }

  /**
   * Resoudre une alerte
   */
  @Post('alerts/:alertId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resoudre une alerte' })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.agentAlerts.resolveAlert(alertId, user.id);

    return { success: true, message: 'Alerte resolue' };
  }

  /**
   * Top modeles utilises
   */
  @Get('top-models')
  @ApiOperation({ summary: 'Top modeles LLM utilises' })
  async getTopModels(
    @CurrentBrand() brand: { id: string } | null,
    @Query('days') days?: string,
  ) {
    const brandId = brand?.id;
    const daysBack = parseInt(days || '30', 10);
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const models = await this.prisma.aIUsageLog.groupBy({
      by: ['model', 'provider'],
      where: {
        ...(brandId ? { brandId } : {}),
        createdAt: { gte: since },
      },
      _sum: {
        totalTokens: true,
        costCents: true,
      },
      _count: true,
      orderBy: { _count: { model: 'desc' } },
      take: 10,
    });

    return {
      success: true,
      data: models.map((m) => ({
        model: m.model,
        provider: m.provider,
        requests: m._count,
        totalTokens: m._sum.totalTokens || 0,
        costCents: m._sum.costCents || 0,
        costDollars: ((m._sum.costCents || 0) / 100).toFixed(2),
      })),
    };
  }
}
