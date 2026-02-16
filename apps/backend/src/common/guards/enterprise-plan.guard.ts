import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

const ENTERPRISE_ONLY_MESSAGE =
  'Le SSO est disponible uniquement sur le plan Enterprise';

/**
 * Guard that ensures the user's brand is on the Enterprise plan.
 * Use on SSO Enterprise (and other enterprise-only) endpoints.
 *
 * - PLATFORM_ADMIN and SUPER_ADMIN bypass (they can manage any brand).
 * - Other roles: require request.user.brandId and brand.subscriptionPlan === ENTERPRISE.
 */
@Injectable()
export class EnterprisePlanGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser | undefined;

    if (!user) {
      throw new ForbiddenException(ENTERPRISE_ONLY_MESSAGE);
    }

    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    const brandId = user.brandId;
    if (!brandId) {
      throw new ForbiddenException(ENTERPRISE_ONLY_MESSAGE);
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { subscriptionPlan: true },
    });

    if (!brand || brand.subscriptionPlan !== SubscriptionPlan.ENTERPRISE) {
      throw new ForbiddenException(ENTERPRISE_ONLY_MESSAGE);
    }

    return true;
  }
}
