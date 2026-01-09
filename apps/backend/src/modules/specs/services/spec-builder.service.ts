import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ZoneInput {
  zoneId: string;
  text?: string;
  font?: string;
  color?: string;
  size?: number;
  effect?: string;
  orientation?: string;
  [key: string]: any;
}

@Injectable()
export class SpecBuilderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Construire un DesignSpec depuis zone inputs
   */
  async build(productId: string, zoneInputs: Record<string, ZoneInput>): Promise<any> {
    // 1. Récupérer le produit et ses zones
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        zones: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Valider que toutes les zones existent
    const zoneIds = Object.keys(zoneInputs);
    const productZoneIds = product.zones.map(z => z.id);
    const invalidZones = zoneIds.filter(id => !productZoneIds.includes(id));

    if (invalidZones.length > 0) {
      throw new Error(`Invalid zones: ${invalidZones.join(', ')}`);
    }

    // 3. Construire le spec JSON
    const spec = {
      version: '1.0.0',
      productId,
      productName: product.name,
      zones: product.zones.map(zone => ({
        zoneId: zone.id,
        zoneName: zone.name,
        zoneType: zone.type,
        input: zoneInputs[zone.id] || null,
        constraints: {
          maxChars: zone.maxChars,
          allowedFonts: zone.allowedFonts,
          allowedColors: zone.allowedColors,
          allowedPatterns: zone.allowedPatterns,
        },
      })),
      timestamp: new Date().toISOString(),
    };

    return spec;
  }
}











