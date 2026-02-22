import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Configurator3DConfiguration } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export const CONFIGURATOR_CONFIGURATION_KEY = 'configuratorConfiguration';

export type RequestWithConfiguratorConfiguration = Request & {
  user: CurrentUser;
  [CONFIGURATOR_CONFIGURATION_KEY]?: Configurator3DConfiguration;
};

@Injectable()
export class ConfiguratorOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithConfiguratorConfiguration>();
    const user = request.user as CurrentUser;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Admin / SUPER_ADMIN bypass (platform-level only)
    const isPlatformAdmin =
      user.role === UserRole.PLATFORM_ADMIN ||
      (user.role as string) === 'SUPER_ADMIN';

    if (isPlatformAdmin) {
      // Platform-level admins can access any configuration
      const configurationId = this.extractConfigurationId(request);
      if (!configurationId) {
        throw new ForbiddenException('ID de configuration manquant');
      }
      const configuration = await this.prisma.configurator3DConfiguration.findUnique({
        where: { id: configurationId },
      });
      if (!configuration) {
        throw new NotFoundException('Configuration non trouvée');
      }
      request[CONFIGURATOR_CONFIGURATION_KEY] = configuration;
      return true;
    }

    const configurationId = this.extractConfigurationId(request);
    if (!configurationId) {
      throw new ForbiddenException('ID de configuration manquant');
    }

    const configuration = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });

    if (!configuration) {
      throw new NotFoundException('Configuration non trouvée');
    }

    if (!user.brandId || user.brandId !== configuration.brandId) {
      throw new ForbiddenException('Accès non autorisé à cette configuration');
    }

    request[CONFIGURATOR_CONFIGURATION_KEY] = configuration;
    return true;
  }

  private extractConfigurationId(request: Request): string | undefined {
    return (
      request.params?.configurationId ||
      request.params?.id ||
      request.body?.configurationId
    );
  }
}
