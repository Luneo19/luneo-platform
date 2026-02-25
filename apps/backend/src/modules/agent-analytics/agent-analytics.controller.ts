import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import {
  AgentAnalyticsService,
  DateRangeQuery,
} from './agent-analytics.service';
import { InsightsService } from './services/insights.service';
import { ScorecardService } from './scorecard.service';
import { AttributionV1Service } from './attribution-v1.service';
import { FlywheelAutomationService } from './flywheel-automation.service';

interface TrackConversionBody {
  conversationId: string;
  goalType: string;
  value: number;
  model?: 'first_touch' | 'last_touch' | 'linear';
  confidence?: number;
  metadata?: Record<string, unknown>;
}

@ApiTags('agent-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-analytics')
export class AgentAnalyticsController {
  private readonly logger = new Logger(AgentAnalyticsController.name);

  constructor(
    private readonly analyticsService: AgentAnalyticsService,
    private readonly insightsService: InsightsService,
    private readonly scorecardService: ScorecardService,
    private readonly attributionV1Service: AttributionV1Service,
    private readonly flywheelAutomationService: FlywheelAutomationService,
  ) {}

  // --- Organisation-level analytics (nouveaux endpoints) ---

  @Get('overview')
  @ApiOperation({ summary: 'Vue d\'ensemble des analytics de l\'organisation' })
  @ApiResponse({ status: 200, description: 'Overview avec métriques agrégées' })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, example: '2025-01-31' })
  async getOverview(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    return this.analyticsService.getOverview(orgId, range);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Série temporelle pour une métrique' })
  @ApiResponse({ status: 200, description: 'Points [{ date, value }]' })
  @ApiQuery({ name: 'metric', required: true, enum: ['conversations', 'messages', 'satisfaction', 'cost', 'escalated'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'] })
  async getTimeseries(
    @CurrentUser() user: CurrentUserType,
    @Query('metric') metric: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity: 'day' | 'week' | 'month' = 'day',
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    if (!metric) {
      throw new BadRequestException('Le paramètre metric est requis');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    return this.analyticsService.getTimeseries(
      orgId,
      metric,
      range,
      granularity,
    );
  }

  @Get('agents/comparison')
  @ApiOperation({ summary: 'Comparaison des agents de l\'organisation' })
  @ApiResponse({ status: 200, description: 'Liste des agents avec métriques' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getAgentComparison(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    return this.analyticsService.getAgentComparison(orgId, range);
  }

  @Get('topics')
  @ApiOperation({ summary: 'Top topics des conversations' })
  @ApiResponse({ status: 200, description: 'Liste des topics avec count et sentiment' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopTopics(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopTopics(
      orgId,
      range,
      isNaN(limitNum) ? 10 : limitNum,
    );
  }

  @Get('insights')
  @ApiOperation({ summary: 'Insights IA hebdomadaires pour le dashboard' })
  @ApiResponse({ status: 200, description: 'Liste d\'insights générés' })
  async getInsights(@CurrentUser() user: CurrentUserType) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.insightsService.getWeeklyInsights(orgId);
  }

  @Get('scorecard')
  @ApiOperation({ summary: 'Scorecard unifiée ARR/NRR/Activation/Marge' })
  @ApiResponse({ status: 200, description: 'Scorecard pondérée trimestrielle' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getUnifiedScorecard(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    return this.scorecardService.getUnifiedScorecard(orgId, range);
  }

  @Post('attribution/track')
  @ApiOperation({ summary: 'Enregistrer une conversion (attribution V1)' })
  @ApiResponse({ status: 201, description: 'Conversion attribuée enregistrée' })
  async trackConversion(
    @CurrentUser() user: CurrentUserType,
    @Body() body: TrackConversionBody,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.attributionV1Service.trackConversion({
      organizationId: user.organizationId,
      conversationId: body.conversationId,
      goalType: body.goalType,
      value: body.value,
      model: body.model,
      confidence: body.confidence,
      metadata: body.metadata,
    });
  }

  @Get('attribution/summary')
  @ApiOperation({ summary: 'Synthèse attribution business V1' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getAttributionSummary(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.getDefaultOrParsedRange(from, to);
    return this.attributionV1Service.getAttributionSummary(orgId, range);
  }

  @Post('automation/flywheel/run')
  @ApiOperation({ summary: 'Lancer manuellement la boucle flywheel' })
  @Roles(PlatformRole.ADMIN)
  async runFlywheel(@CurrentUser() user: CurrentUserType) {
    this.logger.warn(`Manual flywheel run triggered by user=${user.id}`);
    await this.flywheelAutomationService.runNightlyFlywheel();
    return { ok: true };
  }

  // --- Agent-level analytics (endpoints existants) ---

  @Get('agents/:agentId/analytics')
  @ApiOperation({ summary: 'Récupérer les analytics journalières d\'un agent' })
  @ApiResponse({ status: 200, description: 'Analytics journalières' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2025-12-31' })
  async getAnalytics(
    @CurrentUser() user: CurrentUserType,
    @Param('agentId') agentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const organizationId =
      user.role === PlatformRole.ADMIN ? undefined : user.organizationId;
    if (user.role !== PlatformRole.ADMIN && !organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.parseAndValidateRange(startDate, endDate);
    return this.analyticsService.getDailyAnalytics(agentId, range, organizationId ?? undefined);
  }

  @Get('agents/:agentId/analytics/summary')
  @ApiOperation({ summary: 'Récupérer le résumé des analytics d\'un agent' })
  @ApiResponse({ status: 200, description: 'Résumé des analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2025-12-31' })
  async getSummary(
    @CurrentUser() user: CurrentUserType,
    @Param('agentId') agentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const organizationId =
      user.role === PlatformRole.ADMIN ? undefined : user.organizationId;
    if (user.role !== PlatformRole.ADMIN && !organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const range = this.parseAndValidateRange(startDate, endDate);
    return this.analyticsService.getSummary(agentId, range, organizationId ?? undefined);
  }

  private getDefaultOrParsedRange(
    from?: string,
    to?: string,
  ): { from: Date; to: Date } {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    const fromDate = from
      ? new Date(from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException(
        'Dates invalides. Format attendu : YYYY-MM-DD',
      );
    }

    if (fromDate > toDate) {
      throw new BadRequestException('from doit être antérieur à to');
    }

    return { from: fromDate, to: toDate };
  }

  private parseAndValidateRange(
    startDate: string,
    endDate: string,
  ): DateRangeQuery {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Dates invalides. Format attendu : YYYY-MM-DD',
      );
    }

    if (start > end) {
      throw new BadRequestException('startDate doit être antérieure à endDate');
    }

    return { startDate: start, endDate: end };
  }
}
