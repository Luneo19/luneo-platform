import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class IndustryConfigGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { brandId?: string | null; role?: string } }>();
    const user = request.user;

    // PLATFORM_ADMIN bypasses industry config check
    if (user?.role === 'PLATFORM_ADMIN') {
      return true;
    }

    if (!user?.brandId) {
      throw new BadRequestException('Industry not configured');
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: user.brandId },
      include: { organization: true },
    });
    if (!brand?.organization) {
      throw new BadRequestException('Industry not configured');
    }
    if (brand.organization.industryId == null) {
      throw new BadRequestException('Industry not configured');
    }
    return true;
  }
}
