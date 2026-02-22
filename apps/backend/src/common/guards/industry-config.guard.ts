// @ts-nocheck
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface IndustryConfigRequest {
  user?: { brandId?: string | null; role?: string };
  industryConfigured?: boolean;
}

@Injectable()
export class IndustryConfigGuard implements CanActivate {
  private readonly logger = new Logger(IndustryConfigGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IndustryConfigRequest>();
    const user = request.user;

    if (user?.role === 'PLATFORM_ADMIN') {
      request.industryConfigured = true;
      return true;
    }

    if (!user?.brandId) {
      this.logger.debug(`User has no brandId – marking industryConfigured=false`);
      request.industryConfigured = false;
      return true;
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: user.brandId },
      include: { organization: true },
    });

    if (!brand?.organization || brand.organization.industryId == null) {
      this.logger.debug(`Brand ${user.brandId} has no industry – marking industryConfigured=false`);
      request.industryConfigured = false;
      return true;
    }

    request.industryConfigured = true;
    return true;
  }
}
