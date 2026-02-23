import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { PricingPlansService, PricingOptions, PlanType } from './services/pricing-plans.service';

@ApiTags('Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(
    private readonly pricingPlansService: PricingPlansService,
  ) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Obtient tous les plans disponibles' })
  @ApiResponse({ status: 200, description: 'Plans récupérés' })
  async getAllPlans() {
    return this.pricingPlansService.getAllPlans();
  }

  @Get('plans/:planId')
  @Public()
  @ApiOperation({ summary: 'Obtient un plan spécifique' })
  @ApiResponse({ status: 200, description: 'Plan récupéré' })
  async getPlan(@Param('planId') planId: string) {
    return this.pricingPlansService.getPlan(planId as PlanType);
  }

  @Get('plans/:planId/add-ons')
  @Public()
  @ApiOperation({ summary: 'Obtient les add-ons disponibles pour un plan' })
  @ApiResponse({ status: 200, description: 'Add-ons récupérés' })
  async getAvailableAddOns(@Param('planId') planId: string) {
    return this.pricingPlansService.getAvailableAddOns(planId as PlanType);
  }

  @Get('plans/:planId/addons')
  @Public()
  @ApiOperation({ summary: 'Alias - Obtient les add-ons disponibles pour un plan' })
  @ApiResponse({ status: 200, description: 'Add-ons récupérés' })
  async getAvailableAddOnsAlias(@Param('planId') planId: string) {
    return this.pricingPlansService.getAvailableAddOns(planId as PlanType);
  }

  @Post('calculate')
  @Public()
  @ApiOperation({ summary: 'Calcule le prix avec add-ons' })
  @ApiResponse({ status: 200, description: 'Prix calculé' })
  async calculatePricing(@Body() options: PricingOptions) {
    return this.pricingPlansService.calculatePricing(options);
  }
}
