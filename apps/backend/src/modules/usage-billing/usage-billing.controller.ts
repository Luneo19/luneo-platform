import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsageMeteringService } from './services/usage-metering.service';
import {
  UsageTrackingService,
  UsageStatsResult,
} from './services/usage-tracking.service';
import { QuotasService } from './services/quotas.service';
import { BillingCalculationService } from './services/billing-calculation.service';
import {
  UsageReportingService,
  MonthlyReport,
  ExecutiveSummary,
  MetricDetail,
} from './services/usage-reporting.service';
import { UsageMetricType } from './interfaces/usage.interface';
import { UsageTopUpService } from './services/usage-topup.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Controller pour la gestion du billing usage-based
 */
@ApiTags('Usage & Billing')
@Controller('usage-billing')
@ApiBearerAuth()
export class UsageBillingController {
  constructor(
    private readonly meteringService: UsageMeteringService,
    private readonly trackingService: UsageTrackingService,
    private readonly quotasService: QuotasService,
    private readonly calculationService: BillingCalculationService,
    private readonly reportingService: UsageReportingService,
    private readonly topUpService: UsageTopUpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Enregistrer une métrique d'usage manuellement
   */
  @Post('record')
  @ApiOperation({ summary: 'Record a usage metric' })
  @ApiResponse({ status: 201, description: 'Usage recorded' })
  async recordUsage(
    @Body()
    body: {
      brandId: string;
      metric: UsageMetricType;
      value?: number;
      metadata?: Record<string, any>;
    },
  ) {
    return this.meteringService.recordUsage(
      body.brandId,
      body.metric,
      body.value,
      body.metadata,
    );
  }

  /**
   * Récupérer l'usage actuel d'un brand
   */
  @Get('current/:brandId')
  @ApiOperation({ summary: 'Get current usage for a brand' })
  @ApiResponse({ status: 200, description: 'Current usage retrieved' })
  async getCurrentUsage(@Param('brandId') brandId: string) {
    const usage = await this.meteringService.getCurrentUsage(brandId);
    return { brandId, usage };
  }

  @Post('share')
  @ApiOperation({ summary: 'Generate a signed quota snapshot token' })
  @ApiResponse({ status: 201, description: 'Share token generated' })
  async createShareToken(
    @Req() req: Request,
    @Body()
    body: {
      brandId?: string;
      ttlMs?: number;
      shareBaseUrl?: string;
    },
  ) {
    const brandId = body.brandId ?? req.brandId ?? req.user?.brandId ?? undefined;
    if (!brandId) {
      throw new BadRequestException('brandId is required');
    }

    const { token, snapshot, expiresAt } = await this.quotasService.createShareToken(
      brandId,
      body.ttlMs,
    );
    const shareBase =
      body.shareBaseUrl ??
      this.configService.get<string>('FRONTEND_SHARE_URL') ??
      this.configService.get<string>('FRONTEND_URL');
    const url = shareBase ? `${shareBase.replace(/\/$/, '')}/share/quota/${token}` : undefined;
    return { token, url, snapshot, expiresAt };
  }

  @Get('share/:token')
  @ApiOperation({ summary: 'Resolve a signed quota snapshot token' })
  @ApiResponse({ status: 200, description: 'Share snapshot retrieved' })
  async getShareSnapshot(@Param('token') token: string) {
    return this.quotasService.resolveShareToken(token);
  }

  /**
   * Vérifier un quota avant action
   */
  @Post('check-quota')
  @ApiOperation({ summary: 'Check if action is within quota' })
  @ApiResponse({ status: 200, description: 'Quota check result' })
  async checkQuota(
    @Body()
    body: {
      brandId: string;
      metric: UsageMetricType;
      requestedAmount?: number;
    },
  ) {
    return this.quotasService.checkQuota(
      body.brandId,
      body.metric,
      body.requestedAmount,
    );
  }

  /**
   * Récupérer le résumé d'usage complet
   */
  @Get('summary/:brandId')
  @ApiOperation({ summary: 'Get complete usage summary with quotas and alerts' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved' })
  async getUsageSummary(@Param('brandId') brandId: string) {
    return this.quotasService.getUsageSummaryWithPlan(brandId);
  }

  /**
   * Récupérer le résumé d'usage pour le brand courant
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get usage summary for current brand' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved' })
  async getCurrentBrandUsage(@Req() req: Request) {
    const brandId = req.brandId ?? req.user?.brandId ?? undefined;

    if (!brandId) {
      throw new BadRequestException('Unable to resolve brandId from request context');
    }

    return this.quotasService.getUsageSummaryWithPlan(brandId);
  }

  /**
   * Calculer la facture actuelle
   */
  @Get('bill/current/:brandId')
  @ApiOperation({ summary: 'Calculate current bill for the month' })
  @ApiResponse({ status: 200, description: 'Bill calculated' })
  async getCurrentBill(@Param('brandId') brandId: string) {
    return this.calculationService.calculateCurrentBill(brandId);
  }

  /**
   * Estimer le coût d'une action
   */
  @Post('estimate')
  @ApiOperation({ summary: 'Estimate cost of an action' })
  @ApiResponse({ status: 200, description: 'Cost estimated' })
  async estimateActionCost(
    @Body()
    body: {
      brandId: string;
      metric: UsageMetricType;
      quantity?: number;
    },
  ) {
    return this.calculationService.estimateActionCost(
      body.brandId,
      body.metric,
      body.quantity,
    );
  }

  /**
   * Projeter les coûts futurs
   */
  @Get('projections/:brandId')
  @ApiOperation({ summary: 'Project future costs based on usage trends' })
  @ApiResponse({ status: 200, description: 'Cost projections calculated' })
  async projectCosts(
    @Param('brandId') brandId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.calculationService.projectCosts(brandId, daysNum);
  }

  /**
   * Comparer les plans
   */
  @Get('compare-plans/:brandId')
  @ApiOperation({ summary: 'Compare costs across different plans' })
  @ApiResponse({ status: 200, description: 'Plan comparison retrieved' })
  async comparePlans(@Param('brandId') brandId: string) {
    return this.calculationService.comparePlans(brandId);
  }

  /**
   * Récupérer les limites d'un plan
   */
  @Get('plans/:plan')
  @ApiOperation({ summary: 'Get plan limits and features' })
  @ApiResponse({ status: 200, description: 'Plan limits retrieved' })
  async getPlanLimits(@Param('plan') plan: string) {
    return this.quotasService.getPlanLimits(plan);
  }

  /**
   * Lister tous les plans
   */
  @Get('plans')
  @ApiOperation({ summary: 'List all available plans' })
  @ApiResponse({ status: 200, description: 'All plans retrieved' })
  async getAllPlans() {
    return this.quotasService.getAllPlans();
  }

  /**
   * Créer une session de paiement Stripe pour acheter des crédits supplémentaires
   */
  @Post('topups/checkout')
  @ApiOperation({ summary: 'Create a Stripe checkout session for quota top-up' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async createTopUpCheckout(
    @Req() req: Request,
    @Body()
    body: {
      metric: UsageMetricType;
      units: number;
      brandId?: string;
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    const brandId = body.brandId ?? req.brandId ?? req.user?.brandId ?? undefined;
    if (!brandId) {
      throw new BadRequestException('brandId is required');
    }

    return this.topUpService.createTopUpSession({
      brandId,
      metric: body.metric,
      units: body.units,
      userId: req.user?.id,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
  }

  /**
   * Simuler l’impact d’un top-up sans achat
   */
  @Post('topups/simulate')
  @ApiOperation({ summary: 'Simulate quota impact before purchasing a top-up' })
  @ApiResponse({ status: 200, description: 'Simulation calculated' })
  async simulateTopUp(
    @Req() req: Request,
    @Body()
    body: {
      metric: UsageMetricType;
      units: number;
      brandId?: string;
    },
  ) {
    const brandId = body.brandId ?? req.brandId ?? req.user?.brandId ?? undefined;
    if (!brandId) {
      throw new BadRequestException('brandId is required');
    }

    return this.quotasService.simulateTopUpImpact(brandId, body.metric, body.units ?? 0);
  }

  /**
   * Lister les top-ups récents
   */
  @Get('topups/history')
  @ApiOperation({ summary: 'List recent quota top-ups for the brand' })
  @ApiResponse({ status: 200, description: 'Top-up history retrieved' })
  async listTopUps(@Req() req: Request, @Query('brandId') brandId?: string) {
    const resolvedBrandId = brandId ?? req.brandId ?? req.user?.brandId ?? undefined;
    if (!resolvedBrandId) {
      throw new BadRequestException('brandId is required');
    }

    return this.topUpService.listTopUps(resolvedBrandId);
  }

  /**
   * Générer un rapport mensuel
   */
  @Get('reports/monthly/:brandId')
  @ApiOperation({ summary: 'Generate monthly usage report' })
  @ApiResponse({ status: 200, description: 'Monthly report generated' })
  async getMonthlyReport(
    @Param('brandId') brandId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<MonthlyReport> {
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    const monthNum = parseInt(month, 10) || new Date().getMonth() + 1;
    return this.reportingService.generateMonthlyReport(brandId, yearNum, monthNum);
  }

  /**
   * Exporter l'usage en CSV
   */
  @Get('export/csv/:brandId')
  @ApiOperation({ summary: 'Export usage to CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportToCSV(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(1);
    const end = endDate ? new Date(endDate) : new Date();

    const csv = await this.reportingService.exportToCSV(brandId, start, end);

    return {
      csv,
      filename: `usage-${brandId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`,
    };
  }

  /**
   * Résumé exécutif
   */
  @Get('reports/executive/:brandId')
  @ApiOperation({ summary: 'Generate executive summary' })
  @ApiResponse({ status: 200, description: 'Executive summary generated' })
  async getExecutiveSummary(@Param('brandId') brandId: string): Promise<ExecutiveSummary> {
    return this.reportingService.generateExecutiveSummary(brandId);
  }

  /**
   * Détails d'une métrique
   */
  @Get('metrics/:brandId/:metric')
  @ApiOperation({ summary: 'Get detailed analytics for a specific metric' })
  @ApiResponse({ status: 200, description: 'Metric details retrieved' })
  async getMetricDetail(
    @Param('brandId') brandId: string,
    @Param('metric') metric: UsageMetricType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<MetricDetail> {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(1);
    const end = endDate ? new Date(endDate) : new Date();

    return this.reportingService.getMetricDetail(brandId, metric, start, end);
  }

  /**
   * Statistiques d'usage
   */
  @Get('stats/:brandId')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved' })
  async getUsageStats(
    @Param('brandId') brandId: string,
    @Query('period') period: 'day' | 'month' | 'year' = 'month',
  ): Promise<UsageStatsResult> {
    return this.trackingService.getUsageStats(brandId, period);
  }

  /**
   * Historique d'usage
   */
  @Get('history/:brandId')
  @ApiOperation({ summary: 'Get usage history' })
  @ApiResponse({ status: 200, description: 'Usage history retrieved' })
  async getUsageHistory(
    @Param('brandId') brandId: string,
    @Query('metric') metric?: UsageMetricType,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.trackingService.getUsageHistory(brandId, metric, limitNum);
  }
}
