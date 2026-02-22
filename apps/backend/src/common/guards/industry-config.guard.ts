import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface IndustryConfigRequest {
  user?: { organizationId?: string | null; role?: PlatformRole };
  industryConfigured?: boolean;
}

@Injectable()
export class IndustryConfigGuard implements CanActivate {
  private readonly logger = new Logger(IndustryConfigGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IndustryConfigRequest>();
    const user = request.user;

    if (user?.role === PlatformRole.ADMIN) {
      request.industryConfigured = true;
      return true;
    }

    if (!user?.organizationId) {
      this.logger.debug(`User has no organizationId – marking industryConfigured=false`);
      request.industryConfigured = false;
      return true;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { industry: true },
    });

    if (!org || org.industry == null) {
      this.logger.debug(`Organization ${user.organizationId} has no industry – marking industryConfigured=false`);
      request.industryConfigured = false;
      return true;
    }

    request.industryConfigured = true;
    return true;
  }
}
