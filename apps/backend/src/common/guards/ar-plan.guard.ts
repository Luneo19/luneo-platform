// @ts-nocheck
/**
 * AR Plan Guard
 * Ensures the user's brand has AR enabled in their subscription plan.
 * AR is available on Professional, Business, and Enterprise plans.
 *
 * - PLATFORM_ADMIN bypasses (can manage any brand).
 * - Other roles: require brand.subscriptionPlan in [PROFESSIONAL, BUSINESS, ENTERPRISE]
 *   AND brand.subscriptionStatus in [ACTIVE, TRIALING].
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

const AR_UPGRADE_MESSAGE =
  'AR Studio est disponible à partir du plan Professional. Mettez à niveau votre abonnement pour accéder aux fonctionnalités AR.';

const AR_SUBSCRIPTION_INACTIVE_MESSAGE =
  'Votre abonnement n\'est pas actif. Veuillez vérifier votre facturation pour accéder à AR Studio.';

const AR_ENABLED_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.PROFESSIONAL,
  SubscriptionPlan.BUSINESS,
  SubscriptionPlan.ENTERPRISE,
];

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

@Injectable()
export class ARPlanGuard implements CanActivate {
  private readonly logger = new Logger(ARPlanGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser | undefined;

    if (!user) {
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    // Platform admins bypass
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    const brandId = user.brandId;
    if (!brandId) {
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        readOnlyMode: true,
      },
    });

    if (!brand) {
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    // Check plan allows AR
    if (!AR_ENABLED_PLANS.includes(brand.subscriptionPlan)) {
      this.logger.warn(
        `AR access denied for brand ${brandId}: plan ${brand.subscriptionPlan} does not include AR`,
      );
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    // Check subscription is active
    if (!ACTIVE_STATUSES.includes(brand.subscriptionStatus)) {
      this.logger.warn(
        `AR access denied for brand ${brandId}: subscription status ${brand.subscriptionStatus}`,
      );
      throw new ForbiddenException(AR_SUBSCRIPTION_INACTIVE_MESSAGE);
    }

    // Check read-only mode (non-payment grace period)
    if (brand.readOnlyMode) {
      const method = request.method?.toUpperCase();
      if (method && method !== 'GET') {
        throw new ForbiddenException(
          'Votre compte est en mode lecture seule. Veuillez résoudre votre facturation.',
        );
      }
    }

    return true;
  }
}
