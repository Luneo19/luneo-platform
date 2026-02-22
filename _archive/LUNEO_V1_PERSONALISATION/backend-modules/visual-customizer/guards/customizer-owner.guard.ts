import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VisualCustomizer } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export const CUSTOMIZER_KEY = 'customizer';

export type RequestWithCustomizer = Request & {
  user: CurrentUser;
  [CUSTOMIZER_KEY]?: VisualCustomizer;
};

@Injectable()
export class CustomizerOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCustomizer>();
    const user = request.user as CurrentUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypass
    const isAdmin =
      user.role === UserRole.PLATFORM_ADMIN ||
      (user.role as string) === 'SUPER_ADMIN';

    const customizerId = this.extractCustomizerId(request);
    if (!customizerId) {
      throw new ForbiddenException('Customizer ID is required');
    }

    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: {
        id: true,
        brandId: true,
        status: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!customizer) {
      throw new NotFoundException('Customizer not found');
    }

    if (customizer.deletedAt) {
      throw new NotFoundException('Customizer not found');
    }

    // Platform admin can access any customizer
    if (isAdmin) {
      request[CUSTOMIZER_KEY] = customizer as VisualCustomizer;
      return true;
    }

    // Check if user's brandId matches customizer's brandId
    if (user.brandId && user.brandId === customizer.brandId) {
      request[CUSTOMIZER_KEY] = customizer as VisualCustomizer;
      return true;
    }

    // Check if user is a TeamMember of the brand
    if (customizer.brandId) {
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          organizationId: customizer.brandId,
          userId: user.id,
          status: 'active',
        },
      });

      if (teamMember) {
        request[CUSTOMIZER_KEY] = customizer as VisualCustomizer;
        return true;
      }
    }

    throw new ForbiddenException('Access denied to this customizer');
  }

  private extractCustomizerId(request: Request): string | undefined {
    return (
      request.params?.customizerId ||
      request.params?.id ||
      request.body?.customizerId ||
      request.body?.id
    );
  }
}
