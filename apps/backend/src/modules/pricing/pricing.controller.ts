/**
 * @fileoverview Controller pour Pricing & Rentabilité IA
 * @module PricingController
 *
 * Conforme au plan PHASE 6 - Pricing & Rentabilité IA
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AICostAuditService, AuditOptions } from './services/ai-cost-audit.service';
import { PricingPlansService, PricingOptions, PlanType } from './services/pricing-plans.service';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly aiCostAuditService: AICostAuditService,
    private readonly pricingPlansService: PricingPlansService,
  ) {}

  // ==========================================================================
  // AI COST AUDIT
  // ==========================================================================

  @Get('audit/ai-costs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Audit des coûts IA' })
  @ApiResponse({ status: 200, description: 'Audit des coûts IA récupéré' })
  async auditAICosts(
    @Query('brandId') brandId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const options: AuditOptions = {
      brandId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeProjections: true,
      includeAnomalies: true,
      includeRecommendations: true,
    };

    return this.aiCostAuditService.auditCosts(options);
  }

  @Get('audit/plan-profitability/:planId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyse de rentabilité par plan' })
  @ApiResponse({ status: 200, description: 'Analyse de rentabilité récupérée' })
  async analyzePlanProfitability(
    @Param('planId') planId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date(),
    };

    return this.aiCostAuditService.analyzePlanProfitability(planId, period);
  }

  // ==========================================================================
  // PRICING PLANS
  // ==========================================================================

  @Get('plans')
  @ApiOperation({ summary: 'Obtient tous les plans disponibles' })
  @ApiResponse({ status: 200, description: 'Plans récupérés' })
  async getAllPlans() {
    return this.pricingPlansService.getAllPlans();
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Obtient un plan spécifique' })
  @ApiResponse({ status: 200, description: 'Plan récupéré' })
  async getPlan(@Param('planId') planId: string) {
    return this.pricingPlansService.getPlan(planId as PlanType);
  }

  @Get('plans/:planId/add-ons')
  @ApiOperation({ summary: 'Obtient les add-ons disponibles pour un plan' })
  @ApiResponse({ status: 200, description: 'Add-ons récupérés' })
  async getAvailableAddOns(@Param('planId') planId: string) {
    return this.pricingPlansService.getAvailableAddOns(planId as PlanType);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calcule le prix avec add-ons' })
  @ApiResponse({ status: 200, description: 'Prix calculé' })
  async calculatePricing(@Body() options: PricingOptions) {
    return this.pricingPlansService.calculatePricing(options);
  }
}
