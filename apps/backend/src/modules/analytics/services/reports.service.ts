/**
 * @fileoverview Service de génération de rapports
 * @module ReportsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { StorageService } from '@/libs/storage/storage.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Génère un rapport JSON/CSV et retourne l'URL
   */
  async generatePDFReport(
    brandId: string,
    dateRange: { start: Date; end: Date },
    type: 'sales' | 'analytics' | 'products' = 'analytics',
  ): Promise<{ url: string; reportId: string }> {
    this.logger.log(`Generating ${type} report for brand ${brandId}`);

    try {
      // Récupérer les données selon le type
      const data = await this.getReportData(brandId, dateRange, type);

      // Générer le contenu JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonContent, 'utf-8');

      // Upload vers le stockage
      const reportId = `report-${brandId}-${Date.now()}`;
      const key = `reports/${brandId}/${reportId}.json`;
      
      const url = await this.storageService.uploadFile(
        key,
        buffer,
        'application/json',
        'luneo-reports',
      );

      this.logger.log(`Report generated: ${url}`);

      return { url, reportId };
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Récupère les données pour le rapport
   */
  private async getReportData(
    brandId: string,
    dateRange: { start: Date; end: Date },
    type: 'sales' | 'analytics' | 'products',
  ): Promise<Record<string, unknown>> {
    const { start, end } = dateRange;

    switch (type) {
      case 'sales':
        return this.getSalesData(brandId, start, end);
      
      case 'products':
        return this.getProductsData(brandId, start, end);
      
      case 'analytics':
      default:
        return this.getAnalyticsData(brandId, start, end);
    }
  }

  /**
   * Données de ventes
   */
  private async getSalesData(brandId: string, start: Date, end: Date): Promise<Record<string, unknown>> {
    const designs = await this.prisma.design.groupBy({
      by: ['productId'],
      where: {
        brandId,
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const totalDesigns = await this.prisma.design.count({
      where: { brandId, createdAt: { gte: start, lte: end } },
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalDesigns,
      topProducts: designs.map(d => ({
        productId: d.productId,
        count: d._count.id,
      })),
    };
  }

  /**
   * Données produits
   */
  private async getProductsData(brandId: string, start: Date, end: Date): Promise<Record<string, unknown>> {
    const products = await this.prisma.product.findMany({
      where: {
        brandId,
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalProducts: products.length,
      products,
    };
  }

  /**
   * Données analytics
   */
  private async getAnalyticsData(brandId: string, start: Date, end: Date): Promise<Record<string, unknown>> {
    const designs = await this.prisma.design.count({
      where: { brandId, createdAt: { gte: start, lte: end } },
    });

    const products = await this.prisma.product.count({
      where: { brandId, createdAt: { gte: start, lte: end } },
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      designs,
      products,
      summary: {
        totalDesigns: designs,
        totalProducts: products,
      },
    };
  }
}
