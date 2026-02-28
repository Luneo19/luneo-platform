import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgStatus, PlatformRole } from '@prisma/client';
import { ALLOW_DURING_BILLING_LOCK_KEY } from '../decorators/allow-during-billing-lock.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

const GRACE_REASON_PREFIX = 'GRACE_READ_ONLY_PAYMENT_FAILED';

@Injectable()
export class BillingEntitlementsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const bypass = this.reflector.getAllAndOverride<boolean>(ALLOW_DURING_BILLING_LOCK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (bypass) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      method?: string;
      path?: string;
      user?: CurrentUser;
      organizationId?: string;
    }>();
    const method = (request.method || 'GET').toUpperCase();
    const path = request.path || '';

    if (this.isAlwaysAllowedPath(path)) {
      return true;
    }

    const user = request.user;
    if (!user) {
      return true;
    }

    if (user.role === PlatformRole.ADMIN) {
      return true;
    }

    const organizationId = request.organizationId || user.organizationId || undefined;
    if (!organizationId) {
      return true;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        status: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    if (!org) {
      return true;
    }

    const isGraceReadOnly =
      org.status === OrgStatus.ACTIVE &&
      typeof org.suspendedReason === 'string' &&
      org.suspendedReason.startsWith(GRACE_REASON_PREFIX);

    if (isGraceReadOnly) {
      if (this.isReadOnlyMethod(method)) {
        return true;
      }
      throw new ForbiddenException(
        'Votre organisation est en période de grâce (3 jours) après échec de paiement. Le mode lecture seule est actif. Veuillez mettre à jour votre moyen de paiement.',
      );
    }

    if (org.status === OrgStatus.SUSPENDED || org.status === OrgStatus.CANCELED) {
      if (this.isRecoveryPath(path)) {
        return true;
      }
      throw new ForbiddenException(
        'Votre organisation est suspendue. L’accès est bloqué jusqu’à la régularisation du paiement.',
      );
    }

    return true;
  }

  private isReadOnlyMethod(method: string): boolean {
    return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  }

  private isRecoveryPath(path: string): boolean {
    return path.includes('/billing') || path.includes('/auth');
  }

  private isAlwaysAllowedPath(path: string): boolean {
    return (
      path.includes('/health')
      || path.includes('/billing/webhook')
      || path.includes('/webhooks/sendgrid/events')
    );
  }
}
