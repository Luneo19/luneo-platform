import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { CurrentUser, JwtPayload } from '@/common/types/user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tokenBlacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token || null,
        (req: Request) => req?.cookies?.accessToken || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    if (payload.iat) {
      const isBlacklisted = await this.tokenBlacklist.isBlacklisted(payload.sub, payload.iat);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            organization: {
              select: { id: true, name: true, slug: true, plan: true, logo: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const primaryMembership = user.memberships[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: primaryMembership?.organizationId ?? null,
      organization: primaryMembership?.organization ?? null,
      brandPlan: primaryMembership?.organization?.plan ?? null,
      brandId: primaryMembership?.organizationId ?? null,
    };
  }
}
