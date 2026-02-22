import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomizerSession } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export const CUSTOMIZER_SESSION_KEY = 'customizerSession';

export type RequestWithCustomizerSession = Request & {
  user?: CurrentUser;
  [CUSTOMIZER_SESSION_KEY]?: CustomizerSession;
};

@Injectable()
export class SessionOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomizerSession>();
    const user = request.user as CurrentUser | undefined;
    const sessionId = this.extractSessionId(request);

    if (!sessionId) {
      throw new ForbiddenException('Session ID is required');
    }

    const session = await this.prisma.customizerSession.findUnique({
      where: { id: sessionId },
      include: {
        customizer: {
          select: {
            brandId: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const brandId = session.customizer?.brandId;

    // Authenticated user check
    if (user) {
      // Session belongs to this user
      if (session.userId === user.id) {
        request[CUSTOMIZER_SESSION_KEY] = session;
        return true;
      }

      // Admin bypass
      const isAdmin =
        user.role === UserRole.PLATFORM_ADMIN ||
        (user.role as string) === 'SUPER_ADMIN';

      if (isAdmin) {
        request[CUSTOMIZER_SESSION_KEY] = session;
        return true;
      }

      // BRAND_ADMIN with matching brandId
      if (brandId && user.brandId === brandId && user.role === UserRole.BRAND_ADMIN) {
        request[CUSTOMIZER_SESSION_KEY] = session;
        return true;
      }

      // Check TeamMember for brand access
      if (brandId && user.brandId === brandId) {
        const teamMember = await this.prisma.teamMember.findFirst({
          where: {
            organizationId: brandId,
            userId: user.id,
            status: 'active',
          },
        });

        if (teamMember) {
          request[CUSTOMIZER_SESSION_KEY] = session;
          return true;
        }
      }
    }

    // Anonymous user check via anonymousId header
    const anonymousId =
      (request.headers['x-anonymous-id'] as string) ||
      request.cookies?.['x-anonymous-id'] ||
      (request.headers['x-visitor-id'] as string) ||
      request.cookies?.['x-visitor-id'];

    if (anonymousId && session.anonymousId === anonymousId) {
      request[CUSTOMIZER_SESSION_KEY] = session;
      return true;
    }

    throw new ForbiddenException('Access denied to this session');
  }

  private extractSessionId(request: Request): string | undefined {
    return (
      request.params?.sessionId ||
      request.params?.id ||
      request.body?.sessionId ||
      request.body?.id
    );
  }
}
