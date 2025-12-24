import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../services/rbac.service';
import { Permission } from '../interfaces/rbac.interface';

/**
 * Guard pour vérifier les permissions
 * Utilisation: @UseGuards(PermissionsGuard) + @RequirePermissions(Permission.PRODUCT_CREATE)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // Pas de permissions requises
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Vérifier si l'utilisateur a toutes les permissions requises
    for (const permission of requiredPermissions) {
      const hasPermission = await this.rbacService.userHasPermission(
        user.id,
        permission,
      );
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}

