/**
 * AR Plan Guard
 * Ensures the user's organization has AR enabled in their subscription plan.
 * AR is available on Pro, Business, and Enterprise plans.
 *
 * - ADMIN bypasses (can manage any organization).
 * - Other roles: require org.plan in [PRO, BUSINESS, ENTERPRISE]
 *   AND org.status in [ACTIVE, TRIAL].
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Plan, OrgStatus, PlatformRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

const AR_UPGRADE_MESSAGE =
  'AR Studio est disponible à partir du plan Professional. Mettez à niveau votre abonnement pour accéder aux fonctionnalités AR.';

const AR_SUBSCRIPTION_INACTIVE_MESSAGE =
  'Votre abonnement n\'est pas actif. Veuillez vérifier votre facturation pour accéder à AR Studio.';

const AR_ENABLED_PLANS: Plan[] = [
  Plan.PRO,
  Plan.BUSINESS,
  Plan.ENTERPRISE,
];

const ACTIVE_STATUSES: OrgStatus[] = [
  OrgStatus.ACTIVE,
  OrgStatus.TRIAL,
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

    if (user.role === PlatformRole.ADMIN) {
      return true;
    }

    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        status: true,
      },
    });

    if (!org) {
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    if (!AR_ENABLED_PLANS.includes(org.plan)) {
      this.logger.warn(
        `AR access denied for organization ${organizationId}: plan ${org.plan} does not include AR`,
      );
      throw new ForbiddenException(AR_UPGRADE_MESSAGE);
    }

    if (!ACTIVE_STATUSES.includes(org.status)) {
      this.logger.warn(
        `AR access denied for organization ${organizationId}: status ${org.status}`,
      );
      throw new ForbiddenException(AR_SUBSCRIPTION_INACTIVE_MESSAGE);
    }

    // @ts-expect-error V2 migration — readOnlyMode not yet on Organization model
    if (org.readOnlyMode) {
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
