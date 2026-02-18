import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Configurator3DSession } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export const CONFIGURATOR_SESSION_KEY = 'configuratorSession';

export type RequestWithConfiguratorSession = Request & {
  user?: CurrentUser;
  [CONFIGURATOR_SESSION_KEY]?: Configurator3DSession;
};

@Injectable()
export class SessionOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithConfiguratorSession>();
    const user = request.user as CurrentUser | undefined;
    const sessionId =
      request.params?.sessionId ||
      request.params?.id ||
      request.body?.sessionId;

    if (!sessionId) {
      throw new ForbiddenException('ID de session manquant');
    }

    const session = await this.prisma.configurator3DSession.findFirst({
      where: {
        OR: [
          { id: sessionId },
          { sessionId: sessionId },
        ],
      },
      include: {
        configuration: {
          select: { brandId: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    const brandId = session.configuration?.brandId;

    // Authenticated user
    if (user) {
      // Session belongs to this user
      if (session.userId === user.id) {
        request[CONFIGURATOR_SESSION_KEY] = session;
        return true;
      }
      // User is admin of the brand (PLATFORM_ADMIN or BRAND_ADMIN with matching brandId)
      if (user.role === UserRole.PLATFORM_ADMIN || (user.role as string) === 'SUPER_ADMIN') {
        request[CONFIGURATOR_SESSION_KEY] = session;
        return true;
      }
      if (brandId && user.brandId === brandId && user.role === UserRole.BRAND_ADMIN) {
        request[CONFIGURATOR_SESSION_KEY] = session;
        return true;
      }
      // Check TeamMember for admin role
      if (brandId && user.brandId === brandId) {
        const teamMember = await this.prisma.teamMember.findFirst({
          where: {
            organizationId: brandId,
            userId: user.id,
            status: 'active',
            role: { in: ['admin', 'ADMIN', 'manager', 'MANAGER'] },
          },
        });
        if (teamMember) {
          request[CONFIGURATOR_SESSION_KEY] = session;
          return true;
        }
      }
      throw new ForbiddenException('Accès non autorisé à cette session');
    }

    // Anonymous: check x-anonymous-id header or cookies
    const anonymousId =
      (request.headers['x-anonymous-id'] as string) ||
      request.cookies?.['x-anonymous-id'] ||
      (request.headers['x-visitor-id'] as string) ||
      request.cookies?.['x-visitor-id'];

    if (anonymousId) {
      const matchesAnonymous =
        session.anonymousId === anonymousId || session.visitorId === anonymousId;
      if (matchesAnonymous) {
        request[CONFIGURATOR_SESSION_KEY] = session;
        return true;
      }
    }

    throw new ForbiddenException('Accès non autorisé à cette session');
  }
}
