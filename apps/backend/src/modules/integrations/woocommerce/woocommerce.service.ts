/**
 * @fileoverview Service WooCommerce
 * @module WooCommerceService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncProducts(brandId: string): Promise<void> {
    this.logger.log(`WooCommerce sync for brand ${brandId}`);
    // TODO: Implémenter
  }
}
