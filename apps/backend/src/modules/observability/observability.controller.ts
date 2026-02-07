import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { SLOService } from './services/slo-sli.service';
import { TracingService } from './services/tracing.service';
import { CostDashboardService } from './services/cost-dashboard.service';
import { DRService } from './services/dr.service';
import { GetCostDashboardDto, GetTenantCostDto } from './dto/get-costs.dto';

@ApiTags('Observability')
@Controller('observability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ObservabilityController {
  constructor(
    private readonly sloService: SLOService,
    private readonly tracingService: TracingService,
    private readonly costDashboard: CostDashboardService,
    private readonly drService: DRService,
  ) {}

  // ========================================
  // SLO/SLI
  // ========================================

  @Get('slo/status')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'SLO compliance status' })
  @ApiResponse({ status: 200, description: 'Formal SLO targets, current metrics, and compliance' })
  async getSLOStatus() {
    return this.sloService.getSLOStatus();
  }

  @Get('slo')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Évalue tous les SLO' })
  @ApiResponse({ status: 200, description: 'SLO évalués' })
  async evaluateSLOs() {
    const results = await this.sloService.evaluateAllSLOs();
    await this.sloService.saveSLOResults(results);
    return results;
  }

  @Get('slo/:service/:metric')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Récupère l\'historique SLO' })
  @ApiResponse({ status: 200, description: 'Historique récupéré' })
  async getSLOHistory(
    @Param('service') service: string,
    @Param('metric') metric: string,
    @Query('days') days: number = 7,
  ) {
    return this.sloService.getSLOHistory(service, metric, days);
  }

  // ========================================
  // TRACING
  // ========================================

  @Get('traces/:traceId')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Récupère une trace complète' })
  @ApiResponse({ status: 200, description: 'Trace récupérée' })
  async getTrace(@Param('traceId') traceId: string) {
    return this.tracingService.getTrace(traceId);
  }

  @Get('traces/service/:service')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Récupère les traces d\'un service' })
  @ApiResponse({ status: 200, description: 'Traces récupérées' })
  async getServiceTraces(
    @Param('service') service: string,
    @Query('limit') limit: number = 100,
  ) {
    return this.tracingService.getServiceTraces(service, limit);
  }

  // ========================================
  // COST DASHBOARD
  // ========================================

  @Get('costs')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Récupère le dashboard de coûts global' })
  @ApiResponse({ status: 200, description: 'Dashboard récupéré' })
  async getCostDashboard(@Query() dto: GetCostDashboardDto) {
    return this.costDashboard.getCostDashboard(
      dto.period || 'month',
      dto.startDate ? new Date(dto.startDate) : undefined,
      dto.endDate ? new Date(dto.endDate) : undefined,
    );
  }

  @Get('costs/tenant/:brandId')
  @ApiOperation({ summary: 'Récupère le coût d\'un tenant' })
  @ApiResponse({ status: 200, description: 'Coût récupéré' })
  async getTenantCost(@Param('brandId') brandId: string, @Query() dto: GetTenantCostDto) {
    return this.costDashboard.getTenantCost(brandId, dto.period || 'month');
  }

  // ========================================
  // DISASTER RECOVERY
  // ========================================

  @Post('backups/database')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Crée un backup de la base de données' })
  @ApiResponse({ status: 201, description: 'Backup créé' })
  async createDatabaseBackup() {
    return this.drService.createDatabaseBackup();
  }

  @Post('backups/:backupId/restore')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Restaure un backup' })
  @ApiResponse({ status: 200, description: 'Backup restauré' })
  async restoreBackup(@Param('backupId') backupId: string) {
    return this.drService.restoreDatabaseBackup(backupId);
  }

  @Get('backups')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Liste les backups disponibles' })
  @ApiResponse({ status: 200, description: 'Backups récupérés' })
  async listBackups(
    @Query('type') type?: 'database' | 'storage' | 'full',
    @Query('limit') limit: number = 50,
  ) {
    return this.drService.listBackups(type, limit);
  }

  @Post('backups/:backupId/verify')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Vérifie l\'intégrité d\'un backup' })
  @ApiResponse({ status: 200, description: 'Backup vérifié' })
  async verifyBackup(@Param('backupId') backupId: string) {
    return this.drService.verifyBackup(backupId);
  }

  @Post('drills/:backupId')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Exécute un drill de restauration' })
  @ApiResponse({ status: 200, description: 'Drill exécuté' })
  async runRestoreDrill(@Param('backupId') backupId: string) {
    return this.drService.runRestoreDrill(backupId);
  }

  @Get('dr/report')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Génère un rapport DR' })
  @ApiResponse({ status: 200, description: 'Rapport généré' })
  async generateDRReport() {
    return this.drService.generateDRReport();
  }
}

































