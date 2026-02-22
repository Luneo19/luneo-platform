import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Configurator3DConfiguration, ConfiguratorStatus } from '@prisma/client';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { CONFIGURATOR_CONFIGURATION_KEY } from './configurator-owner.guard';

export type RequestWithConfiguratorConfiguration = Request & {
  user?: CurrentUser;
  [CONFIGURATOR_CONFIGURATION_KEY]?: Configurator3DConfiguration;
};

@Injectable()
export class ConfiguratorAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithConfiguratorConfiguration>();
    const user = request.user as CurrentUser | undefined;
    const configurationId =
      request.params?.configurationId ||
      request.params?.id ||
      request.body?.configurationId;

    if (!configurationId) {
      throw new ForbiddenException('ID de configuration manquant');
    }

    const configuration = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
      select: {
        id: true,
        brandId: true,
        status: true,
        isPublic: true,
        isActive: true,
        allowedDomains: true,
        isPasswordProtected: true,
        password: true,
        expiresAt: true,
        deletedAt: true,
      },
    });

    if (!configuration || configuration.deletedAt) {
      throw new NotFoundException('Configuration non trouvée');
    }

    // Authenticated user with matching brandId -> allow
    if (user?.brandId && user.brandId === configuration.brandId) {
      const fullConfig = await this.prisma.configurator3DConfiguration.findUnique({
        where: { id: configurationId },
      });
      if (fullConfig) {
        request[CONFIGURATOR_CONFIGURATION_KEY] = fullConfig;
        return true;
      }
    }

    // Check expiration
    if (configuration.expiresAt && new Date() > configuration.expiresAt) {
      throw new ForbiddenException('Cette configuration a expiré');
    }

    if (!configuration.isActive) {
      throw new ForbiddenException('Cette configuration n\'est pas active');
    }

    // Public access: must be published and isPublic
    if (!configuration.isPublic || configuration.status !== ConfiguratorStatus.PUBLISHED) {
      throw new ForbiddenException('Cette configuration n\'est pas accessible publiquement');
    }

    // Check allowed domains (origin or referer)
    const origin = request.headers.origin || request.headers.referer;
    if (configuration.allowedDomains?.length > 0) {
      if (!origin) {
        throw new ForbiddenException('Origine requise pour accéder à cette configuration');
      }
      try {
        const originHost = new URL(origin).hostname;
        const allowed = configuration.allowedDomains.some((domain) => {
          const d = domain.replace(/^\*\./, '');
          return originHost === d || originHost.endsWith('.' + d);
        });
        if (!allowed) {
          throw new ForbiddenException('Domaine non autorisé pour cette configuration');
        }
      } catch {
        throw new ForbiddenException('Domaine non autorisé pour cette configuration');
      }
    }

    // Check password if protected
    if (configuration.isPasswordProtected && configuration.password) {
      const providedPassword = request.headers['x-configurator-password'] as string | undefined;
      if (!providedPassword) {
        throw new ForbiddenException('Mot de passe requis pour accéder à cette configuration');
      }
      const valid = await bcrypt.compare(providedPassword, configuration.password);
      if (!valid) {
        throw new ForbiddenException('Mot de passe incorrect');
      }
    }

    const fullConfig = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });
    if (fullConfig) {
      request[CONFIGURATOR_CONFIGURATION_KEY] = fullConfig;
    }
    return true;
  }
}
