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
import { z } from 'zod';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { ReportsService } from '../services/reports.service';

// ============================================================================
// SCHEMAS
// ============================================================================

const GenerateReportSchema = z.object({
  type: z.enum(['sales', 'products', 'customers', 'custom']),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  format: z.enum(['pdf', 'csv', 'json']).default('pdf'),
  includeCharts: z.boolean().default(true),
});

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

    // TODO: Implémenter la récupération des rapports
    return {
      success: true,
      data: {
        reports: [],
      },
    };
  }

  /**
   * Génère un nouveau rapport
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Générer un rapport' })
  async generateReport(
    @Body() body: unknown,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const validated = GenerateReportSchema.parse(body);

    if (!validated.dateRange.start || !validated.dateRange.end) {
      throw new BadRequestException('Date range start and end are required');
    }

    const report = await this.reportsService.generatePDFReport(
      brand.id,
      {
        start: new Date(validated.dateRange.start),
        end: new Date(validated.dateRange.end),
      },
    );

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Télécharge un rapport
   */
  @Get(':id')
  @ApiOperation({ summary: 'Télécharger un rapport' })
  async downloadReport(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    z.string().uuid().parse(id);

    // TODO: Implémenter le téléchargement
    return {
      success: true,
      data: {
        id,
        url: `https://example.com/reports/${id}`,
      },
    };
  }
}
