/**
 * @fileoverview Service orchestrateur des intégrations
 * @module IntegrationOrchestratorService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class IntegrationOrchestratorService {
  private readonly logger = new Logger(IntegrationOrchestratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste toutes les intégrations actives d'un brand
   */
  async getActiveIntegrations(brandId: string): Promise<unknown[]> {
    const integrations = await this.prisma.ecommerceIntegration.findMany({
      where: {
        brandId,
        status: 'active',
      },
    });

    return integrations;
  }
}
