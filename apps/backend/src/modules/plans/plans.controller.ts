import { Controller, Get, UseGuards, Request, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService, PlanType } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('current')
  @ApiOperation({ summary: 'Récupérer le plan actuel de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Plan actuel récupéré avec succès' })
  async getCurrentPlan(@Request() req) {
    const plan = await this.plansService.getUserPlan(req.user.id);
    const limits = await this.plansService.getUserLimits(req.user.id);
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
  async getLimits(@Request() req) {
    const limits = await this.plansService.getUserLimits(req.user.id);
    const designLimit = await this.plansService.checkDesignLimit(req.user.id);
    const teamLimit = await this.plansService.checkTeamLimit(req.user.id);

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
  async checkDesignLimit(@Request() req) {
    return await this.plansService.checkDesignLimit(req.user.id);
  }

  @Get('team/check')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur peut inviter un membre' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async checkTeamLimit(@Request() req) {
    return await this.plansService.checkTeamLimit(req.user.id);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrader le plan de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Plan upgradé avec succès' })
  async upgradePlan(@Request() req, @Body() body: { plan: PlanType }) {
    await this.plansService.upgradeUserPlan(req.user.id, body.plan);
    
    return {
      success: true,
      message: 'Plan upgradé avec succès',
      newPlan: body.plan
    };
  }

  @Get('features/:feature')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur a accès à une fonctionnalité' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async hasFeature(@Request() req, @Param('feature') feature: string) {
    const hasAccess = await this.plansService.hasFeature(req.user.id, feature as any);
    
    return {
      feature,
      hasAccess
    };
  }
}
