import { Injectable } from '@nestjs/common';
import { ExportPackService } from './services/export-pack.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { GenerateExportPackDto } from './dto/generate-export-pack.dto';

@Injectable()
export class ManufacturingService {
  constructor(
    private exportPack: ExportPackService,
    private prisma: PrismaService,
  ) {}

  /**
   * Générer un pack d'export
   */
  async generateExportPack(dto: GenerateExportPackDto) {
    return this.exportPack.generateExportPack(dto.snapshotId, {
      formats: dto.formats,
      includeMetadata: dto.includeMetadata,
      compression: dto.compression,
    });
  }

  /**
   * Récupérer le bundle de production pour un order
   */
  async getProductionBundle(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            snapshot: {
              select: {
                id: true,
                productionBundleUrl: true,
                specHash: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Récupérer les bundles de tous les items
    const bundles = order.items
      .filter(item => item.snapshot?.productionBundleUrl)
      .map(item => ({
        orderItemId: item.id,
        snapshotId: item.snapshot?.id,
        specHash: item.snapshot?.specHash,
        bundleUrl: item.snapshot?.productionBundleUrl,
      }));

    return {
      orderId,
      bundles,
      totalBundles: bundles.length,
    };
  }
}







