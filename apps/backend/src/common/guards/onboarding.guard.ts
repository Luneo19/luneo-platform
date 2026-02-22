import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '../types/user.types';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    const user = request.user;

    if (user?.role === PlatformRole.ADMIN) {
      return true;
    }

    if (!user?.organizationId) {
      this.throwRedirect();
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId! },
      select: { onboardingCompleted: true },
    });
    const completed = org?.onboardingCompleted === true;
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
      HttpStatus.FOUND,
    );
  }
}
