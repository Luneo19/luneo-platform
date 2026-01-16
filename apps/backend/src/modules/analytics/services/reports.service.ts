/**
 * @fileoverview Service de génération de rapports
 * @module ReportsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Gestion d'erreurs
 * - ✅ Gardes pour éviter les crashes
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { StorageService } from '@/libs/storage/storage.service';

// ============================================================================
// TYPES STRICTS POUR RAPPORTS
// ============================================================================

/**
 * Plage de dates pour un rapport
 */
interface ReportDateRange {
  start: Date;
  end: Date;
}

/**
 * Données de rapport de ventes
 */
interface SalesReportData {
  period: {
    start: string;
    end: string;
  };
  totalDesigns: number;
  topProducts: Array<{
    productId: string | null;
    count: number;
  }>;
}

/**
 * Données de rapport produits
 */
interface ProductsReportData {
  period: {
    start: string;
    end: string;
  };
  totalProducts: number;
  products: Array<{
    id: string;
    name: string;
    price: number | null;
    isActive: boolean;
    createdAt: Date;
  }>;
}

/**
 * Données de rapport analytics
 */
interface AnalyticsReportData {
  period: {
    start: string;
    end: string;
  };
  designs: number;
  products: number;
  summary: {
    totalDesigns: number;
    totalProducts: number;
  };
}

/**
 * Union type pour les données de rapport
 */
type ReportData = SalesReportData | ProductsReportData | AnalyticsReportData;

/**
 * Type de rapport
 */
type ReportType = 'sales' | 'analytics' | 'products';

/**
 * Résultat de génération de rapport
 */
export interface ReportResult {
  url: string;
  reportId: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Génère un rapport JSON/CSV et retourne l'URL avec typage strict et validation
   */
  async generatePDFReport(
    brandId: string,
    dateRange: ReportDateRange,
    type: ReportType = 'analytics',
  ): Promise<ReportResult> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to generatePDFReport');
      throw new Error('Brand ID is required');
    }

    if (!dateRange || typeof dateRange !== 'object') {
      this.logger.warn('Invalid dateRange provided to generatePDFReport');
      throw new Error('Date range is required');
    }

    if (!dateRange.start || !(dateRange.start instanceof Date) || Number.isNaN(dateRange.start.getTime())) {
      this.logger.warn('Invalid start date provided to generatePDFReport');
      throw new Error('Valid start date is required');
    }

    if (!dateRange.end || !(dateRange.end instanceof Date) || Number.isNaN(dateRange.end.getTime())) {
      this.logger.warn('Invalid end date provided to generatePDFReport');
      throw new Error('Valid end date is required');
    }

    if (dateRange.start.getTime() >= dateRange.end.getTime()) {
      this.logger.warn('Invalid date range: start >= end');
      throw new Error('Start date must be before end date');
    }

    this.logger.log(`Generating ${type} report for brand ${brandId}`);

    try {
      // ✅ Récupérer les données selon le type avec validation
      const data = await this.getReportData(brandId.trim(), dateRange, type);

      // ✅ Générer le contenu JSON avec validation
      const jsonContent = JSON.stringify(data, null, 2);
      if (!jsonContent || jsonContent.length === 0) {
        throw new Error('Failed to serialize report data');
      }

      const buffer = Buffer.from(jsonContent, 'utf-8');

      // ✅ Upload vers le stockage avec validation
      const reportId = `report-${brandId.trim()}-${Date.now()}`;
      const key = `reports/${brandId.trim()}/${reportId}.json`;

      const url = await this.storageService.uploadFile(
        key,
        buffer,
        'application/json',
        'luneo-reports',
      );

      if (!url || typeof url !== 'string' || url.trim().length === 0) {
        throw new Error('Failed to upload report to storage');
      }

      this.logger.log(`Report generated: ${url}`);

      return { url: url.trim(), reportId };
    } catch (error) {
      this.logger.error(
        `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Récupère les données pour le rapport avec typage strict
   */
  private async getReportData(
    brandId: string,
    dateRange: ReportDateRange,
    type: ReportType,
  ): Promise<ReportData> {
    const { start, end } = dateRange;

    // ✅ Validation des dates
    if (!start || !(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new Error('Invalid start date');
    }

    if (!end || !(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid end date');
    }

    try {
      switch (type) {
        case 'sales':
          return await this.getSalesData(brandId, start, end);

        case 'products':
          return await this.getProductsData(brandId, start, end);

        case 'analytics':
        default:
          return await this.getAnalyticsData(brandId, start, end);
      }
    } catch (error) {
      this.logger.error(
        `Failed to get report data: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Données de ventes avec typage strict et validation
   */
  private async getSalesData(brandId: string, start: Date, end: Date): Promise<SalesReportData> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new Error('Brand ID is required');
    }

    try {
      const [designs, totalDesigns] = await Promise.all([
        this.prisma.design.groupBy({
          by: ['productId'],
          where: {
            brandId: brandId.trim(),
            createdAt: { gte: start, lte: end },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        this.prisma.design.count({
          where: { brandId: brandId.trim(), createdAt: { gte: start, lte: end } },
        }),
      ]);

      return {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        totalDesigns: typeof totalDesigns === 'number' ? totalDesigns : 0,
        topProducts: designs.map((d) => ({
          productId: d.productId,
          count: typeof d._count.id === 'number' ? d._count.id : 0,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get sales data: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Données produits avec typage strict et validation
   */
  private async getProductsData(brandId: string, start: Date, end: Date): Promise<ProductsReportData> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new Error('Brand ID is required');
    }

    try {
      const products = await this.prisma.product.findMany({
        where: {
          brandId: brandId.trim(),
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
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        totalProducts: Array.isArray(products) ? products.length : 0,
        products: Array.isArray(products)
          ? products.map((p) => ({
              id: p.id ?? '',
              name: p.name ?? 'Unnamed Product',
              price: typeof p.price === 'number' ? p.price : null,
              isActive: Boolean(p.isActive),
              createdAt: p.createdAt,
            }))
          : [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get products data: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Données analytics avec typage strict et validation
   */
  private async getAnalyticsData(brandId: string, start: Date, end: Date): Promise<AnalyticsReportData> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new Error('Brand ID is required');
    }

    try {
      const [designs, products] = await Promise.all([
        this.prisma.design.count({
          where: { brandId: brandId.trim(), createdAt: { gte: start, lte: end } },
        }),
        this.prisma.product.count({
          where: { brandId: brandId.trim(), createdAt: { gte: start, lte: end } },
        }),
      ]);

      const designsCount = typeof designs === 'number' ? designs : 0;
      const productsCount = typeof products === 'number' ? products : 0;

      return {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        designs: designsCount,
        products: productsCount,
        summary: {
          totalDesigns: designsCount,
          totalProducts: productsCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get analytics data: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
