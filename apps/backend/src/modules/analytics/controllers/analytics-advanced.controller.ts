import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';

@ApiTags('Analytics Advanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics/advanced')
export class AnalyticsAdvancedController {
  constructor(private readonly advancedAnalyticsService: AdvancedAnalyticsService) {}

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
    @Request() req: any,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('Brand ID required');
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
    @Request() req: any,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new Error('Brand ID required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.advancedAnalyticsService.analyzeCohort(brandId, start, end);
  }
}
