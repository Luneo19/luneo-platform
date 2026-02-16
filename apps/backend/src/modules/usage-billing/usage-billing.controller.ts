import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { Roles } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/types/user.types';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { QuotasService } from './services/quotas.service';
import { BillingCalculationService } from './services/billing-calculation.service';
import { UsageReportingService } from './services/usage-reporting.service';
import { UsageReconciliationService } from './services/usage-reconciliation.service';
import { UsageMetricType } from './interfaces/usage.interface';

/**
 * Controller pour la gestion du billing usage-based
 * BrandOwnershipGuard ensures users can only access their own brand's data.
 * SUPER_ADMIN / PLATFORM_ADMIN bypass this check.
 */
@ApiTags('Usage & Billing')
@Controller('usage-billing')
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
@ApiBearerAuth()
export class UsageBillingController {
  constructor(
    private readonly meteringService: UsageMeteringService,
    private readonly trackingService: UsageTrackingService,
    private readonly quotasService: QuotasService,
    private readonly calculationService: BillingCalculationService,
    private readonly reportingService: UsageReportingService,
    private readonly reconciliationService: UsageReconciliationService,
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
   * Récupérer le résumé d'usage pour le brand de l'utilisateur connecté.
   * C'est l'endpoint utilisé par le frontend (pas de brandId dans l'URL).
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get usage summary for current user brand' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved' })
  async getMyUsageSummary(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      throw new NotFoundException('Aucun brand associé à votre compte');
    }
    const summary = await this.quotasService.getUsageSummary(brandId);
    const plan = await this.quotasService.getPlanForBrand(brandId);
    return { summary, plan };
  }

  /**
   * Récupérer le résumé d'usage complet (admin / explicit brandId)
   */
  @Get('summary/:brandId')
  @ApiOperation({ summary: 'Get complete usage summary with quotas and alerts' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved' })
  async getUsageSummary(@Param('brandId') brandId: string) {
    return this.quotasService.getUsageSummary(brandId);
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
   * Générer un rapport mensuel
   */
  @Get('reports/monthly/:brandId')
  @ApiOperation({ summary: 'Generate monthly usage report' })
  @ApiResponse({ status: 200, description: 'Monthly report generated' })
  async getMonthlyReport(
    @Param('brandId') brandId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
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
  async getExecutiveSummary(@Param('brandId') brandId: string) {
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
  ) {
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
  ) {
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

  /**
   * Lancer la reconciliation usage local vs Stripe (admin only)
   */
  @Post('admin/reconciliation')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Run usage reconciliation (admin only)' })
  @ApiResponse({ status: 200, description: 'Reconciliation report' })
  async runReconciliation() {
    return this.reconciliationService.runDailyReconciliation();
  }
}
