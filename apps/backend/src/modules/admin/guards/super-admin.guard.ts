/**
 * ★★★ SUPER ADMIN GUARD ★★★
 * Guard NestJS pour protéger les routes admin
 * Vérifie que l'utilisateur a le rôle PLATFORM_ADMIN
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Vérifier que l'utilisateur a le rôle PLATFORM_ADMIN
    if (user.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'Access denied. Super Admin privileges required.',
      );
    }

    return true;
  }
}
