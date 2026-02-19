import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PipelineStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PCE_LIMITS, PIPELINE_STAGES } from '../pce.constants';
import {
  PCE_QUOTA_KEY,
  type PCEQuotaType,
} from '../decorators/pce-quota.decorator';

type PCEPlanKey = keyof typeof PCE_LIMITS;

@Injectable()
export class PCEQuotaGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaTypes = this.reflector.get<PCEQuotaType[]>(
      PCE_QUOTA_KEY,
      context.getHandler(),
    );
    if (!quotaTypes?.length) return true;

    const request = context.switchToHttp().getRequest();
    const brandId = (request as { brandId?: string }).brandId ?? request.user?.brand?.id;
    if (!brandId) return true;

    const brandData = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { subscriptionPlan: true },
    });

    const plan = (brandData?.subscriptionPlan ?? 'FREE') as PCEPlanKey;
    const limits = PCE_LIMITS[plan] ?? PCE_LIMITS.FREE;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (const quotaType of quotaTypes) {
      switch (quotaType) {
        case 'orders': {
        const count = await this.prisma.pipeline.count({
          where: {
            brandId,
            createdAt: { gte: startOfMonth },
          },
        });
        if (
          limits.maxOrdersPerMonth !== -1 &&
          count >= limits.maxOrdersPerMonth
        ) {
          throw new ForbiddenException(
            'Order quota exceeded for current plan',
          );
        }
        break;
        }
        case 'renders': {
        const renderCount = await this.prisma.pipelineTransition.count({
          where: {
            pipeline: { brandId },
            toStage: PIPELINE_STAGES.RENDER,
            createdAt: { gte: startOfMonth },
          },
        });
        if (
          limits.maxRendersPerMonth !== -1 &&
          renderCount >= limits.maxRendersPerMonth
        ) {
          throw new ForbiddenException(
            'Render quota exceeded for current plan',
          );
        }
        break;
        }
        case 'concurrent_pipelines': {
        const active = await this.prisma.pipeline.count({
          where: {
            brandId,
            status: PipelineStatus.IN_PROGRESS,
          },
        });
        if (
          limits.maxConcurrentPipelines !== -1 &&
          active >= limits.maxConcurrentPipelines
        ) {
          throw new ForbiddenException(
            'Concurrent pipeline limit exceeded',
          );
        }
        break;
        }
      }
    }

    return true;
  }
}
