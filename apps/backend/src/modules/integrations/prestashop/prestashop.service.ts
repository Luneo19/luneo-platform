/**
 * @fileoverview Service PrestaShop
 * @module PrestaShopService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class PrestaShopService {
  private readonly logger = new Logger(PrestaShopService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncProducts(brandId: string): Promise<void> {
    this.logger.log(`PrestaShop sync for brand ${brandId}`);
    // TODO: Implémenter
  }
}
