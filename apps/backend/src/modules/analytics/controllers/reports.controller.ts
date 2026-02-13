/**
 * @fileoverview Controller pour les rapports Analytics
 * @module ReportsController
 *
 * ENDPOINTS:
 * - GET /analytics/reports - Liste des rapports
 * - POST /analytics/reports/generate - Générer un rapport
 * - GET /analytics/reports/:id - Télécharger un rapport
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod
 * - ✅ Guards d'authentification
 * - ✅ Gestion d'erreurs
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { ReportsService } from '../services/reports.service';
import { GenerateReportDto } from '../dto/generate-report.dto';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Analytics - Reports')
@ApiBearerAuth()
@Controller('analytics/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Liste des rapports disponibles
   */
  @Get()
  @ApiOperation({ summary: 'Liste des rapports' })
  async getReports(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const reports = [
      { id: 'sales', type: 'sales', name: 'Rapport de ventes', description: 'Ventes et designs par période' },
      { id: 'products', type: 'products', name: 'Rapport produits', description: 'Catalogue et produits' },
      { id: 'customers', type: 'customers', name: 'Rapport clients', description: 'Données clients (à venir)' },
      { id: 'custom', type: 'custom', name: 'Rapport personnalisé', description: 'Analytics et KPIs' },
    ];
    return {
      success: true,
      data: { reports },
    };
  }

  /**
   * Génère un nouveau rapport
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Générer un rapport' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (!dto.dateRange?.start || !dto.dateRange?.end) {
      throw new BadRequestException('Date range start and end are required');
    }

    const report = await this.reportsService.generatePDFReport(
      brand.id,
      {
        start: new Date(dto.dateRange.start),
        end: new Date(dto.dateRange.end),
      },
    );

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Télécharge un rapport (retourne les données en JSON ; CSV/PDF à venir)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Télécharger un rapport' })
  async downloadReport(
    @Param('id') id: string,
    @Query('start') startQuery?: string,
    @Query('end') endQuery?: string,
    @CurrentBrand() brand?: { id: string } | null,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const validTypes = ['sales', 'products', 'customers', 'custom', 'analytics'];
    const reportType = validTypes.includes(id) ? id : 'analytics';
    const end = endQuery ? new Date(endQuery) : new Date();
    const start = startQuery ? new Date(startQuery) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const reportData = await this.reportsService.getReportDataForDownload(
      brand.id,
      { start, end },
      reportType === 'customers' || reportType === 'custom' ? 'analytics' : (reportType as 'sales' | 'products' | 'analytics'),
    );

    return {
      success: true,
      data: { id, type: reportType, period: { start: start.toISOString(), end: end.toISOString() }, report: reportData },
    };
  }
}
