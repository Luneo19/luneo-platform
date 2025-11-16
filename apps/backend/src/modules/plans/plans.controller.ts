import { Controller, Get, UseGuards, Post, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService, PlanType } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('current')
  @ApiOperation({ summary: 'Récupérer le plan actuel de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Plan actuel récupéré avec succès' })
  async getCurrentPlan(@Req() req: Request) {
    const user = this.requireUser(req);
    const plan = await this.plansService.getUserPlan(user.id);
    const limits = await this.plansService.getUserLimits(user.id);
    const planInfo = this.plansService.getPlanInfo(plan);

    return {
      plan,
      limits,
      info: planInfo
    };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Récupérer les limites du plan actuel' })
  @ApiResponse({ status: 200, description: 'Limites récupérées avec succès' })
  async getLimits(@Req() req: Request) {
    const user = this.requireUser(req);
    const limits = await this.plansService.getUserLimits(user.id);
    const designLimit = await this.plansService.checkDesignLimit(user.id);
    const teamLimit = await this.plansService.checkTeamLimit(user.id);

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
  async checkDesignLimit(@Req() req: Request) {
    const user = this.requireUser(req);
    return this.plansService.checkDesignLimit(user.id);
  }

  @Get('team/check')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur peut inviter un membre' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async checkTeamLimit(@Req() req: Request) {
    const user = this.requireUser(req);
    return this.plansService.checkTeamLimit(user.id);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrader le plan de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Plan upgradé avec succès' })
  async upgradePlan(@Req() req: Request, @Body() body: { plan: PlanType }) {
    const user = this.requireUser(req);
    await this.plansService.upgradeUserPlan(user.id, body.plan);
    
    return {
      success: true,
      message: 'Plan upgradé avec succès',
      newPlan: body.plan
    };
  }

  @Get('features/:feature')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur a accès à une fonctionnalité' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async hasFeature(@Req() req: Request, @Param('feature') feature: string) {
    const user = this.requireUser(req);
    const hasAccess = await this.plansService.hasFeature(user.id, feature as any);
    
    return {
      feature,
      hasAccess
    };
  }

  private requireUser(req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return req.user;
  }
}
