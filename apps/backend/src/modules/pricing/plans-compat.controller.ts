import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PricingPlansService } from './services/pricing-plans.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PLAN_CONFIGS } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

@ApiTags('Plans')
@Controller('plans')
export class PlansCompatController {
  constructor(
    private readonly pricingPlansService: PricingPlansService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Compat: liste des plans pour le frontend' })
  async getAllPlansCompat() {
    const paidPlans = await this.pricingPlansService.getAllPlans();
    const free = PLAN_CONFIGS[PlanTier.FREE];

    return [
      {
        id: PlanTier.FREE,
        name: free.info.name,
        description: free.info.description,
        monthlyPriceCents: free.pricing.monthlyPrice * 100,
        yearlyPriceCents: free.pricing.yearlyPrice * 100,
        limits: {
          designs_per_month: free.limits.conversationsPerMonth,
          team_members: free.limits.teamMembers,
          storage_gb: free.limits.storageGB,
          api_calls: free.quotas.find((q) => q.metric === 'api_calls')?.limit ?? 0,
        },
        features: free.info.features,
      },
      ...paidPlans,
    ];
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compat: plan courant avec limites et usage' })
  async getCurrentPlanCompat(@Request() req: { user?: { id?: string } }) {
    const userId = req.user?.id;
    if (!userId) {
      const free = PLAN_CONFIGS[PlanTier.FREE];
      return {
        plan: PlanTier.FREE,
        limits: {
          designsPerMonth: free.limits.conversationsPerMonth,
          teamMembers: free.limits.teamMembers,
          storageGB: free.limits.storageGB,
          apiAccess: free.limits.apiAccess,
          advancedAnalytics: free.limits.advancedAnalytics,
          prioritySupport: free.limits.prioritySupport,
          customExport: false,
          whiteLabel: free.limits.whiteLabel,
        },
        usage: {
          designs: { canCreate: true, remaining: free.limits.conversationsPerMonth },
          team: { canInvite: true, remaining: free.limits.teamMembers },
        },
        info: {
          name: free.info.name,
          price: free.pricing.monthlyPrice,
          description: free.info.description,
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });

    const org = user?.memberships?.[0]?.organization;
    const plan = (org?.plan || PlanTier.FREE).toString().toLowerCase() as PlanTier;
    const safePlan = PLAN_CONFIGS[plan] ? plan : PlanTier.FREE;
    const config = PLAN_CONFIGS[safePlan];

    const teamMembersUsed = await this.prisma.organizationMember.count({
      where: { organizationId: org?.id || '', isActive: true },
    });

    const conversationsUsed = Number(org?.conversationsUsed || 0);
    const remainingDesigns = config.limits.conversationsPerMonth < 0
      ? -1
      : Math.max(0, config.limits.conversationsPerMonth - conversationsUsed);
    const remainingTeam = config.limits.teamMembers < 0
      ? -1
      : Math.max(0, config.limits.teamMembers - teamMembersUsed);

    return {
      plan: safePlan,
      limits: {
        designsPerMonth: config.limits.conversationsPerMonth,
        teamMembers: config.limits.teamMembers,
        storageGB: config.limits.storageGB,
        apiAccess: config.limits.apiAccess,
        advancedAnalytics: config.limits.advancedAnalytics,
        prioritySupport: config.limits.prioritySupport,
        customExport: config.limits.advancedAnalytics,
        whiteLabel: config.limits.whiteLabel,
      },
      usage: {
        designs: {
          canCreate: remainingDesigns !== 0,
          remaining: remainingDesigns,
        },
        team: {
          canInvite: remainingTeam !== 0,
          remaining: remainingTeam,
        },
      },
      info: {
        name: config.info.name,
        price: config.pricing.monthlyPrice,
        description: config.info.description,
      },
    };
  }
}
