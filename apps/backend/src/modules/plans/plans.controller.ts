import { Controller, Get, UseGuards, Request, Post, Body, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService, type PlanLimits } from './plans.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { Public } from '@/common/decorators/public.decorator';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { Request as ExpressRequest } from 'express';
import { UserRole } from '@prisma/client';
import { PLAN_CONFIGS, PlanTier } from '@/libs/plans';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Public endpoint returning all plans with pricing, features and limits.
   * This is the single source of truth for the frontend pricing pages,
   * eliminating the need for duplicated plan constants in the frontend.
   */
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all available plans (public, no auth required)' })
  @ApiResponse({ status: 200, description: 'All plans with pricing, features and limits' })
  getAllPlans() {
    return Object.values(PlanTier).map((tier) => {
      const config = PLAN_CONFIGS[tier];
      return {
        id: tier.toLowerCase(),
        tier,
        name: config.info.name,
        description: config.info.description,
        price: {
          monthly: config.pricing.monthlyPrice,
          yearly: config.pricing.yearlyPrice,
          yearlyMonthly: config.pricing.yearlyPrice > 0
            ? Math.round((config.pricing.yearlyPrice / 12) * 100) / 100
            : 0,
        },
        features: config.info.features,
        limits: config.limits,
        quotas: config.quotas,
        popular: tier === PlanTier.PROFESSIONAL,
      };
    });
  }

  @Get('current')
  @ApiOperation({ summary: 'Récupérer le plan actuel de l\'utilisateur avec usage' })
  @ApiResponse({ status: 200, description: 'Plan actuel récupéré avec succès' })
  async getCurrentPlan(@Request() req: ExpressRequest) {
    const u = req.user as { id: string };
    const plan = await this.plansService.getUserPlan(u.id);
    const limits = await this.plansService.getUserLimits(u.id);
    const planInfo = this.plansService.getPlanInfo(plan);
    // CRITICAL FIX: Include usage data so PlanLimits component works
    const designLimit = await this.plansService.checkDesignLimit(u.id);
    const teamLimit = await this.plansService.checkTeamLimit(u.id);

    return {
      plan,
      limits,
      info: planInfo,
      usage: {
        designs: designLimit,
        team: teamLimit,
      },
    };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Récupérer les limites du plan actuel' })
  @ApiResponse({ status: 200, description: 'Limites récupérées avec succès' })
  async getLimits(@Request() req: ExpressRequest) {
    const u = req.user as { id: string };
    const limits = await this.plansService.getUserLimits(u.id);
    const designLimit = await this.plansService.checkDesignLimit(u.id);
    const teamLimit = await this.plansService.checkTeamLimit(u.id);

    return {
      limits,
      usage: {
        designs: designLimit,
        team: teamLimit
      }
    };
  }

  @Get('designs/check')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur peut créer un design' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async checkDesignLimit(@Request() req: ExpressRequest) {
    return await this.plansService.checkDesignLimit((req.user as { id: string }).id);
  }

  @Get('team/check')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur peut inviter un membre' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async checkTeamLimit(@Request() req: ExpressRequest) {
    return await this.plansService.checkTeamLimit((req.user as { id: string }).id);
  }

  @Post('upgrade')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Upgrader le plan d\'un utilisateur (admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Plan upgradé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux administrateurs' })
  async upgradePlan(@Request() req: ExpressRequest, @Body() body: UpgradePlanDto) {
    // CRITICAL FIX: Admin upgrades TARGET user's plan, not their own
    await this.plansService.upgradeUserPlan(body.userId, body.plan);

    return {
      success: true,
      message: 'Plan upgradé avec succès',
      userId: body.userId,
      newPlan: body.plan,
    };
  }

  @Get('features/:feature')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur a accès à une fonctionnalité' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async hasFeature(@Request() req: ExpressRequest, @Param('feature') feature: string) {
    const hasAccess = await this.plansService.hasFeature((req.user as { id: string }).id, feature as keyof PlanLimits);
    
    return {
      feature,
      hasAccess
    };
  }
}
