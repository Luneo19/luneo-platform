// @ts-nocheck
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string; brandId?: string | null; role?: string } }>();
    const user = request.user;

    // PLATFORM_ADMIN bypasses onboarding check — they manage the platform, not a brand
    if (user?.role === 'PLATFORM_ADMIN') {
      return true;
    }

    if (!user?.brandId) {
      this.throwRedirect();
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: user.brandId },
      include: { organization: true },
    });
    const completed = brand?.organization?.onboardingCompletedAt != null;
    if (!completed) {
      this.throwRedirect();
    }
    return true;
  }

  private throwRedirect(): never {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || process.env.FRONTEND_URL || '';
    const redirectTo = frontendUrl ? `${frontendUrl.replace(/\/$/, '')}/onboarding` : '/onboarding';
    throw new HttpException(
      { message: 'Onboarding required', redirectTo },
      HttpStatus.FOUND, // 302
    );
  }
}
