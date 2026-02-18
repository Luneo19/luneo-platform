import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ConfiguratorOwnerGuard } from '../guards/configurator-owner.guard';
import { ConfiguratorAccessGuard } from '../guards/configurator-access.guard';
import type { Configurator3DPermission } from '../configurator-3d.constants';

export const CONFIGURATOR_PERMISSIONS_KEY = 'configurator_permissions';

/**
 * Composes SetMetadata + UseGuards(JwtAuthGuard, ConfiguratorOwnerGuard) + ApiBearerAuth + Swagger error responses.
 * Use on controller methods that require authenticated configurator ownership.
 */
export function ConfiguratorPermission(...permissions: Configurator3DPermission[]) {
  return applyDecorators(
    SetMetadata(CONFIGURATOR_PERMISSIONS_KEY, permissions),
    UseGuards(JwtAuthGuard, ConfiguratorOwnerGuard),
    ApiBearerAuth(),
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès non autorisé' }),
    ApiResponse({ status: 404, description: 'Configuration non trouvée' }),
  );
}

/**
 * Composes UseGuards(ConfiguratorAccessGuard) + ApiForbiddenResponse.
 * Use on public/widget endpoints that allow unauthenticated access to published configurations.
 */
export function ConfiguratorPublicAccess() {
  return applyDecorators(
    UseGuards(ConfiguratorAccessGuard),
    ApiResponse({ status: 403, description: 'Accès refusé à cette configuration' }),
    ApiResponse({ status: 404, description: 'Configuration non trouvée' }),
  );
}
