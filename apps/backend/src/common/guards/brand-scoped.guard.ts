import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BRAND_SCOPED_KEY } from '../decorators/brand-scoped.decorator';
import { CurrentUser } from '../types/user.types';

@Injectable()
export class BrandScopedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isBrandScoped = this.reflector.getAllAndOverride<boolean>(BRAND_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isBrandScoped) {
      return true; // Pas de scoping requis
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUser = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.brandId) {
      throw new ForbiddenException('Brand context required');
    }

    // Injecter brandId dans request pour utilisation dans services
    request.brandId = user.brandId;

    return true;
  }
}







