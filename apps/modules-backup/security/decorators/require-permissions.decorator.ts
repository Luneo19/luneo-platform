import { SetMetadata } from '@nestjs/common';
import { Permission } from '../interfaces/rbac.interface';

/**
 * Decorator pour spécifier les permissions requises
 * Usage: @RequirePermissions(Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE)
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

