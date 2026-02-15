import { Controller, Get, Post, Query, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RequestWithUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { AnalyticsAdvancedService } from '../services/analytics-advanced.service';
import { CreateFunnelDto } from '../dto/create-funnel.dto';

@ApiTags('Analytics Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics/advanced')
export class AnalyticsAdvancedController {
  constructor(
    private readonly advancedAnalyticsService: AdvancedAnalyticsService,
    private readonly analyticsAdvancedService: AnalyticsAdvancedService,
  ) {}

  @Get('funnel')
  @ApiOperation({
    summary: 'Analyse de funnel de conversion',
    description: 'Analyse un funnel de conversion avec les étapes spécifiées. Retourne les métriques de conversion et les taux d\'abandon pour chaque étape.',
  })
  @ApiQuery({
    name: 'steps',
    required: true,
    description: 'Étapes du funnel séparées par des virgules (ex: visit,customize,add_to_cart,checkout,purchase)',
    example: 'visit,customize,add_to_cart,checkout,purchase',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Date de début (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Date de fin (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Funnel analysis retrieved successfully',
  })
  async analyzeFunnel(
    @Query('steps') steps: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return { steps: [], conversionRates: {}, dropoffRates: {} };
      }
      throw new BadRequestException('Brand ID required');
    }

    const stepsArray = steps.split(',').map((s) => s.trim());
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.advancedAnalyticsService.analyzeFunnel(brandId, stepsArray, start, end);
  }

  @Get('cohort')
  @ApiOperation({
    summary: 'Analyse de cohorte',
    description: 'Analyse la rétention des utilisateurs par cohorte (mois de première commande). Retourne les métriques de rétention, revenus et commandes par cohorte.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Date de début (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Date de fin (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Cohort analysis retrieved successfully',
  })
  async analyzeCohort(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: RequestWithUser,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return { cohorts: [], retentionRates: {}, revenueByCohort: {} };
      }
      throw new BadRequestException('Brand ID required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.advancedAnalyticsService.analyzeCohort(brandId, start, end);
  }

  @Get('funnels')
  @ApiOperation({ summary: 'List all funnels', description: 'List all funnels for the brand with optional date range.' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Funnels list retrieved successfully' })
  async getFunnels(@Request() req: RequestWithUser, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('Brand ID required');
    }
    const options =
      dateFrom || dateTo
        ? { dateFrom: dateFrom ? new Date(dateFrom) : undefined, dateTo: dateTo ? new Date(dateTo) : undefined }
        : undefined;
    return this.analyticsAdvancedService.getFunnels(brandId, options);
  }

  @Get('funnels/:id/data')
  @ApiOperation({ summary: 'Get funnel analysis data', description: 'Get funnel analysis data for a specific funnel.' })
  @ApiParam({ name: 'id', description: 'Funnel ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Funnel data retrieved successfully' })
  async getFunnelData(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return {};
      }
      throw new BadRequestException('Brand ID required');
    }
    const filters = {
      brandId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.analyticsAdvancedService.getFunnelData(id, brandId, filters);
  }

  @Get('funnels/:id')
  @ApiOperation({ summary: 'Get funnel by ID', description: 'Get a specific funnel by ID.' })
  @ApiParam({ name: 'id', description: 'Funnel ID' })
  @ApiResponse({ status: 200, description: 'Funnel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Funnel not found' })
  async getFunnelById(@Param('id') id: string, @Request() req: RequestWithUser) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return null;
      }
      throw new BadRequestException('Brand ID required');
    }
    return this.analyticsAdvancedService.getFunnelById(id, brandId);
  }

  @Post('funnels')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Create funnel', description: 'Create a new funnel.' })
  @ApiResponse({ status: 201, description: 'Funnel created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createFunnel(@Body() dto: CreateFunnelDto, @Request() req: RequestWithUser) {
    const brandId = dto.brandId ?? req.user.brandId;
    if (!brandId) throw new BadRequestException('Brand ID required');
    return this.analyticsAdvancedService.createFunnel(brandId, {
      name: dto.name,
      steps: dto.steps.map((s, index) => ({
        id: s.id ?? `step-${index}-${Date.now()}`,
        name: s.name,
        eventType: s.eventType,
        order: s.order,
        description: s.description,
      })),
      description: dto.description,
      isActive: dto.isActive ?? true,
    });
  }

  @Get('cohorts')
  @ApiOperation({ summary: 'List cohorts', description: 'Get cohort analysis for the brand.' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Cohorts retrieved successfully' })
  async getCohorts(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('Brand ID required');
    }
    const filters = {
      brandId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.analyticsAdvancedService.getCohorts(brandId, filters);
  }

  @Get('segments')
  @ApiOperation({ summary: 'List segments', description: 'Get all segments for the brand.' })
  @ApiResponse({ status: 200, description: 'Segments retrieved successfully' })
  async getSegments(@Request() req: RequestWithUser) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('Brand ID required');
    }
    return this.analyticsAdvancedService.getSegments(brandId);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get revenue predictions', description: 'Get revenue prediction scenarios.' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  async getPredictions(@Request() req: RequestWithUser) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return {};
      }
      throw new BadRequestException('Brand ID required');
    }
    return this.analyticsAdvancedService.getRevenuePredictions(brandId);
  }

  @Get('correlations')
  @ApiOperation({ summary: 'Get correlations', description: 'Get correlations between metrics.' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Correlations retrieved successfully' })
  async getCorrelations(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return {};
      }
      throw new BadRequestException('Brand ID required');
    }
    const filters = {
      brandId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.analyticsAdvancedService.getCorrelations(brandId, filters);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get anomalies', description: 'Get detected anomalies in the data.' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Anomalies retrieved successfully' })
  async getAnomalies(
    @Request() req: RequestWithUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('Brand ID required');
    }
    const filters = {
      brandId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    return this.analyticsAdvancedService.getAnomalies(brandId, filters);
  }
}
