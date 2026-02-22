// @ts-nocheck
/**
 * BrandScopedGuard - Global Brand Isolation Guard
 * 
 * Ensures multi-tenant data isolation by enforcing brandId scoping on all
 * authenticated routes. Registered as a global guard in CommonModule.
 * 
 * Behavior:
 * - SKIP for @Public() routes (no auth required)
 * - SKIP for PLATFORM_ADMIN users (super admins access everything)
 * - ENFORCE brandId for BRAND_ADMIN and BRAND_USER roles
 * - INJECT request.brandId for downstream services
 * - VALIDATE path params :brandId matches user's brand (prevent IDOR)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/common/compat/v1-enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUser } from '../types/user.types';
import { PrismaService } from '@/libs/prisma/prisma.service';

/** Decorator key for routes that explicitly skip brand scoping */
export const SKIP_BRAND_SCOPING_KEY = 'skipBrandScoping';

/** Path prefixes that are always allowed in read-only mode (billing, credits, auth, health) */
const READ_ONLY_ALLOWED_PATHS = ['/billing', '/credits', '/auth', '/health'];

@Injectable()
export class BrandScopedGuard implements CanActivate {
  private readonly logger = new Logger(BrandScopedGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Skip for public routes (no auth needed)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. Skip if explicitly marked to skip brand scoping
    const skipBrandScoping = this.reflector.getAllAndOverride<boolean>(SKIP_BRAND_SCOPING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipBrandScoping) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUser | undefined = request.user;

    // 3. No user = auth guard hasn't run or route is misconfigured
    if (!user) {
      return true; // Let JwtAuthGuard handle auth errors
    }

    // 4. Platform admins bypass brand scoping (they access all brands)
    if (user.role === UserRole.PLATFORM_ADMIN) {
      // If admin accesses a specific brand via path param, inject it
      const pathBrandId = request.params?.brandId;
      if (pathBrandId) {
        request.brandId = pathBrandId;
      }
      return true;
    }

    // 5. CONSUMER role - no brand context needed for consumers
    if (user.role === UserRole.CONSUMER) {
      // Consumers may interact with multiple brands, so we inject
      // brandId from path params if present, but don't enforce it
      const pathBrandId = request.params?.brandId;
      if (pathBrandId) {
        request.brandId = pathBrandId;
      }
      return true;
    }

    // 6. FABRICATOR role - similar to consumer, multi-brand access
    if (user.role === UserRole.FABRICATOR) {
      const pathBrandId = request.params?.brandId;
      if (pathBrandId) {
        request.brandId = pathBrandId;
      }
      return true;
    }

    // 7. BRAND_ADMIN and BRAND_USER - enforce brand scoping
    if (user.role === UserRole.BRAND_ADMIN || user.role === UserRole.BRAND_USER) {
      if (!user.brandId) {
        this.logger.debug(
          `User ${user.id} (${user.role}) has no brandId yet (onboarding) – allowing through`,
        );
        return true;
      }

      // Inject brandId into request for services
      request.brandId = user.brandId;

      // IDOR prevention: if path contains :brandId, it must match user's brand
      const pathBrandId = request.params?.brandId;
      if (pathBrandId && pathBrandId !== user.brandId) {
        this.logger.warn(
          `IDOR attempt: User ${user.id} (brand: ${user.brandId}) tried to access brand ${pathBrandId}`,
        );
        throw new ForbiddenException(
          'You do not have access to this brand\'s resources.',
        );
      }

      // Read-only mode: block mutating methods except billing/credits/auth/health
      const brand = await this.prisma.brand.findUnique({
        where: { id: user.brandId },
        select: { readOnlyMode: true },
      });
      if (brand?.readOnlyMode === true) {
        const path = request.route?.path ?? request.url ?? request.path ?? '';
        const method = (request.method ?? 'GET').toUpperCase();
        const isGet = method === 'GET';
        const isAllowedPath = READ_ONLY_ALLOWED_PATHS.some((p) => path.includes(p));
        if (!isGet && !isAllowedPath) {
          this.logger.warn(`Read-only mode: blocked ${method} ${path} for brand ${user.brandId}`);
          throw new ForbiddenException(
            'Account in read-only mode due to unpaid subscription. Please update your payment method.',
          );
        }
      }

      return true;
    }

    // 8. Unknown role - default deny
    this.logger.warn(`Unknown role "${user.role}" for user ${user.id}`);
    throw new ForbiddenException('Access denied.');
  }
}
