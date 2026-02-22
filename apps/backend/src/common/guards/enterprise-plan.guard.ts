import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Plan, PlatformRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

const ENTERPRISE_ONLY_MESSAGE =
  'Le SSO est disponible uniquement sur le plan Enterprise';

/**
 * Guard that ensures the user's organization is on the Enterprise plan.
 * Use on SSO Enterprise (and other enterprise-only) endpoints.
 *
 * - ADMIN bypasses (they can manage any organization).
 * - Other roles: require request.user.organizationId and org.plan === ENTERPRISE.
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

    if (user.role === PlatformRole.ADMIN) {
      return true;
    }

    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new ForbiddenException(ENTERPRISE_ONLY_MESSAGE);
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org || org.plan !== Plan.ENTERPRISE) {
      throw new ForbiddenException(ENTERPRISE_ONLY_MESSAGE);
    }

    return true;
  }
}
