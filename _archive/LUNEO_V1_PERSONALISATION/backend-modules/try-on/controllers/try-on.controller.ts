import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TryOnConfigurationService } from '../services/try-on-configuration.service';
import { TryOnSessionService } from '../services/try-on-session.service';
import { TryOnScreenshotService } from '../services/try-on-screenshot.service';
import { ModelManagementService } from '../services/model-management.service';
import { CalibrationService } from '../services/calibration.service';
import { PerformanceService } from '../services/performance.service';
import { TryOnEventsService } from '../services/try-on-events.service';
import { ConversionService } from '../services/conversion.service';
import { WhiteLabelService } from '../services/white-label.service';
import { TryOnAnalyticsDashboardService } from '../services/try-on-analytics-dashboard.service';
import { SocialSharingService } from '../services/social-sharing.service';
import { CreateTryOnConfigurationDto } from '../dto/create-try-on-configuration.dto';
import { UpdateTryOnConfigurationDto } from '../dto/update-try-on-configuration.dto';
import { AddProductMappingDto } from '../dto/add-product-mapping.dto';
import { UploadModelDto } from '../dto/upload-model.dto';
import { BatchScreenshotsDto } from '../dto/batch-screenshots.dto';
import { CalibrationDataDto } from '../dto/calibration-data.dto';
import { BatchPerformanceMetricsDto } from '../dto/performance-metric.dto';
import { UpdateWidgetConfigDto } from '../dto/widget-config.dto';
import { AttributeRevenueDto } from '../dto/track-conversion.dto';
import { StartSessionDto, EndSessionDto, UpdateSessionDto } from '../dto/session.dto';

@ApiTags('try-on')
@ApiBearerAuth()
@Controller('try-on')
@UseGuards(JwtAuthGuard)
export class TryOnController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configurationService: TryOnConfigurationService,
    private readonly sessionService: TryOnSessionService,
    private readonly screenshotService: TryOnScreenshotService,
    private readonly modelManagementService: ModelManagementService,
    private readonly calibrationService: CalibrationService,
    private readonly performanceService: PerformanceService,
    private readonly eventsService: TryOnEventsService,
    private readonly conversionService: ConversionService,
    private readonly whiteLabelService: WhiteLabelService,
    private readonly analyticsDashboardService: TryOnAnalyticsDashboardService,
    private readonly socialSharingService: SocialSharingService,
  ) {}

  // ========================================
  // CONFIGURATIONS ENDPOINTS
  // ========================================

  @Get('configurations')
  @ApiOperation({
    summary: 'Liste les configurations try-on d\'un projet',
  })
  @ApiParam({ name: 'projectId', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Liste des configurations récupérée avec succès',
  })
  async findAllConfigurations(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!projectId) {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
    return this.configurationService.findAll(
      projectId,
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined },
      req.user?.brandId,
    );
  }

  @Get('configurations/:id')
  @ApiOperation({
    summary: 'Récupère une configuration par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async findOneConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.findOne(id, projectId, req.user?.brandId);
  }

  @Post('configurations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée une nouvelle configuration try-on',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuration créée avec succès',
  })
  async createConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Body() dto: CreateTryOnConfigurationDto,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.create(projectId, dto, req.user?.brandId);
  }

  @Patch('configurations/:id')
  @ApiOperation({
    summary: 'Met à jour une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async updateConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateTryOnConfigurationDto,
  ) {
    return this.configurationService.update(id, projectId, dto, req.user?.brandId);
  }

  @Delete('configurations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async removeConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.remove(id, projectId, req.user?.brandId);
  }

  @Post('configurations/:id/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajoute un produit à une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async addProduct(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Body() dto: AddProductMappingDto,
  ) {
    return this.configurationService.addProduct(configId, projectId, dto, req.user?.brandId);
  }

  @Delete('configurations/:id/products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retire un produit d\'une configuration',
  })
  async removeProduct(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Param('productId') productId: string,
  ) {
    return this.configurationService.removeProduct(
      configId,
      projectId,
      productId,
      req.user?.brandId,
    );
  }

  // ========================================
  // SESSIONS ENDPOINTS
  // ========================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get try-on analytics' })
  async getAnalytics(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    const user = req.user;
    const brandId = user?.brandId;
    return this.sessionService.getAnalytics(brandId, days ?? 30);
  }

  @Post('sessions')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Démarre une nouvelle session try-on',
  })
  @ApiResponse({
    status: 201,
    description: 'Session démarrée avec succès',
  })
  async startSession(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Body() body: StartSessionDto,
  ) {
    // SECURITY FIX: Verify configuration belongs to user's brand before starting session
    if (req.user?.brandId) {
      await this.configurationService.verifyConfigurationOwnership(body.configurationId, req.user.brandId);
    }

    // Check usage quota
    const brandId = req.user?.brandId || null;
    if (brandId) {
      const quota = await this.eventsService.checkSessionQuota(brandId);
      if (!quota.allowed) {
        throw new BadRequestException(
          `Try-on session quota exceeded (${quota.limit} sessions/month). Please upgrade your plan.`,
        );
      }
    }

    const session = await this.sessionService.startSession(
      body.configurationId,
      body.visitorId,
      body.deviceInfo,
    );

    // Fire-and-forget: meter usage + check milestones
    if (brandId) {
      const sid =
        (session as Record<string, unknown>)?.sessionId as string | undefined;
      this.eventsService.meterSessionCreated(brandId, sid || '').catch(() => {});
      this.eventsService.checkAndNotifyMilestone(brandId).catch(() => {});
    }

    return session;
  }

  @Post('sessions/:sessionId/product-tried')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track a product tried during a try-on session',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async trackProductTried(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body('productId') productId: string,
  ) {
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.sessionService.addProductTried(sessionId, productId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Récupère une session par son ID',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async findOneSession(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
  ) {
    // SECURITY FIX: Verify session belongs to user's brand
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.sessionService.findOne(sessionId);
  }

  @Patch('sessions/:sessionId')
  @ApiOperation({
    summary: 'Met à jour une session',
  })
  async updateSession(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body() updates: UpdateSessionDto,
  ) {
    // SECURITY FIX: Verify session belongs to user's brand
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.sessionService.updateSession(sessionId, updates);
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Termine une session',
  })
  async endSession(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body() body?: EndSessionDto,
  ) {
    // SECURITY FIX: Verify session belongs to user's brand
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);

    // Optionally update conversion/quality before ending
    if (body?.conversionAction || body?.renderQuality) {
      const session = await this.prisma.tryOnSession.findUnique({
        where: { sessionId },
        select: { id: true },
      });
      if (session) {
        await this.prisma.tryOnSession.update({
          where: { id: session.id },
          data: {
            ...(body.conversionAction && {
              conversionAction: body.conversionAction as import('@prisma/client').ConversionAction,
            }),
            ...(body.renderQuality && { renderQuality: body.renderQuality }),
          },
        });
      }
    }

    const result = await this.sessionService.endSession(sessionId);

    // Fire-and-forget: emit webhook for session completion with real duration
    const brandId = req.user?.brandId || null;
    if (brandId) {
      const ended = result as Record<string, unknown>;
      const startedAt = ended?.startedAt as Date | string | undefined;
      const endedAt = ended?.endedAt as Date | string | undefined;
      const durationMs = startedAt && endedAt
        ? new Date(endedAt).getTime() - new Date(startedAt).getTime()
        : 0;

      this.eventsService
        .emitSessionCompleted(brandId, {
          sessionId,
          productsTried: (ended?.productsTried as string[]) || [],
          screenshotsTaken: (ended?.screenshotsTaken as number) || 0,
          duration: Math.round(durationMs / 1000),
          converted: !!(ended?.converted || body?.conversionAction),
          conversionAction: body?.conversionAction || (ended?.conversionAction as string | undefined),
          renderQuality: body?.renderQuality || (ended?.renderQuality as string | undefined),
        })
        .catch(() => {});
    }

    return result;
  }

  // ========================================
  // SCREENSHOTS ENDPOINTS
  // ========================================

  @Post('sessions/:sessionId/screenshots')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un screenshot pour une session',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createScreenshot(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body('productId') productId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // SECURITY FIX: Verify session belongs to user's brand
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.screenshotService.create(
      sessionId,
      productId,
      file.buffer,
      {
        generateThumbnail: true,
      },
    );
  }

  @Get('screenshots/:id')
  @ApiOperation({
    summary: 'Récupère un screenshot par son ID',
  })
  async findOneScreenshot(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
  ) {
    // SECURITY FIX: Verify screenshot's session belongs to user's brand
    await this.screenshotService.verifyScreenshotOwnership(id, req.user?.brandId);
    return this.screenshotService.findOne(id);
  }

  @Get('sessions/:sessionId/screenshots')
  @ApiOperation({
    summary: 'Liste les screenshots d\'une session',
  })
  async findAllScreenshots(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
  ) {
    // SECURITY FIX: Verify session belongs to user's brand
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.screenshotService.findAll(sessionId);
  }

  @Post('screenshots/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Génère une URL partageable pour un screenshot',
  })
  async generateSharedUrl(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
  ) {
    // SECURITY FIX: Verify screenshot's session belongs to user's brand
    await this.screenshotService.verifyScreenshotOwnership(id, req.user?.brandId);
    return this.screenshotService.generateSharedUrl(id);
  }

  // ========================================
  // 3D MODEL MANAGEMENT ENDPOINTS
  // ========================================

  @Post('configurations/:id/model')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload un modèle 3D dédié pour une configuration/produit',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('model'))
  async uploadModel(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Body() dto: UploadModelDto,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('3D model file is required');
    }
    // Verify ownership
    if (req.user?.brandId) {
      await this.configurationService.verifyConfigurationOwnership(configId, req.user.brandId);
    }
    return this.modelManagementService.uploadModel(file, {
      configurationId: configId,
      productId: dto.productId,
      format: dto.format,
      defaultPosition: dto.defaultPosition,
      defaultRotation: dto.defaultRotation,
      enableOcclusion: dto.enableOcclusion,
      enableShadows: dto.enableShadows,
    });
  }

  @Delete('configurations/:id/model')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime le modèle 3D dédié d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async deleteModel(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('productId') productId: string,
    @Query('format') format?: 'glb' | 'usdz' | 'all',
  ) {
    if (req.user?.brandId) {
      await this.configurationService.verifyConfigurationOwnership(configId, req.user.brandId);
    }
    return this.modelManagementService.deleteModel(configId, productId, format);
  }

  @Get('configurations/:id/model/preview')
  @ApiOperation({
    summary: 'Récupère les infos du modèle 3D d\'un produit',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async getModelPreview(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('productId') productId: string,
  ) {
    if (req.user?.brandId) {
      await this.configurationService.verifyConfigurationOwnership(configId, req.user.brandId);
    }
    return this.modelManagementService.getModelInfo(configId, productId);
  }

  // ========================================
  // BATCH SCREENSHOTS ENDPOINT
  // ========================================

  @Post('sessions/:sessionId/screenshots/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload batch de screenshots en fin de session',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async batchUploadScreenshots(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body() dto: BatchScreenshotsDto,
  ) {
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    const result = await this.screenshotService.createBatch(
      sessionId,
      dto.screenshots,
    );

    // Fire-and-forget: meter screenshot usage
    const brandId = req.user?.brandId || null;
    if (brandId && result.created > 0) {
      this.eventsService
        .meterScreenshotsUploaded(brandId, sessionId, result.created)
        .catch(() => {});
    }

    return result;
  }

  // ========================================
  // PERFORMANCE METRICS ENDPOINTS
  // ========================================

  @Post('sessions/:sessionId/performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoie les métriques de performance d\'une session',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async submitPerformanceMetrics(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body() dto: BatchPerformanceMetricsDto,
  ) {
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.performanceService.recordSessionSummary(sessionId, dto.metrics);
  }

  @Get('performance/device-stats')
  @ApiOperation({
    summary: 'Statistiques de performance par type de device',
  })
  async getDeviceStats(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.performanceService.getDeviceStats(req.user?.brandId ?? undefined, days);
  }

  // ========================================
  // CALIBRATION ENDPOINTS
  // ========================================

  @Post('sessions/:sessionId/calibration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoie les données de calibration d\'une session',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async submitCalibration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('sessionId') sessionId: string,
    @Body() dto: CalibrationDataDto,
  ) {
    await this.sessionService.verifySessionOwnership(sessionId, req.user?.brandId);
    return this.calibrationService.saveCalibration(sessionId, dto);
  }

  // ========================================
  // DEVICE COMPATIBILITY ENDPOINT
  // ========================================

  @Get('device-compatibility')
  @ApiOperation({
    summary: 'Vérifie la compatibilité d\'un device pour le try-on',
  })
  async checkDeviceCompatibility(
    @Query('deviceType') deviceType: string,
    @Query('gpuInfo') gpuInfo?: string,
  ) {
    return this.performanceService.checkDeviceCompatibility(deviceType, gpuInfo);
  }

  // ========================================
  // CONVERSION & ROI ENDPOINTS
  // ========================================

  @Get('conversions')
  @ApiOperation({
    summary: 'Liste des conversions try-on pour la marque',
  })
  async getConversions(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.conversionService.getConversions(req.user?.brandId || '', {
      days,
      action: action as import('@prisma/client').ConversionAction | undefined,
      limit,
      offset,
    });
  }

  @Post('conversions/:id/revenue')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Attribuer un revenu a une conversion (server-to-server, apres achat)',
  })
  @ApiParam({ name: 'id', description: 'Conversion ID' })
  async attributeRevenue(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Body() dto: AttributeRevenueDto,
  ) {
    return this.conversionService.attributeRevenue(
      id,
      {
        revenue: dto.revenue,
        currency: dto.currency,
        externalOrderId: dto.externalOrderId,
      },
      undefined,
      req.user?.brandId ?? undefined,
    );
  }

  @Get('conversions/report')
  @ApiOperation({
    summary: 'Rapport ROI des conversions try-on',
  })
  async getConversionReport(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.conversionService.getConversionReport(
      req.user?.brandId || '',
      days,
    );
  }

  // ========================================
  // WIDGET CONFIGURATION (WHITE-LABEL)
  // ========================================

  @Get('widget-config')
  @ApiOperation({ summary: 'Get widget configuration for brand' })
  async getWidgetConfig(
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    // Get brand slug from user
    const brand = await this.prisma.brand.findUnique({
      where: { id: req.user?.brandId || '' },
      select: { slug: true },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.whiteLabelService.getWidgetConfig(brand.slug);
  }

  @Patch('widget-config')
  @ApiOperation({ summary: 'Update widget configuration' })
  async updateWidgetConfig(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Body() dto: UpdateWidgetConfigDto,
  ) {
    return this.whiteLabelService.updateWidgetConfig(
      req.user?.brandId || '',
      dto,
    );
  }

  @Get('widget-config/embed-code')
  @ApiOperation({ summary: 'Generate embed code for a product' })
  async getEmbedCode(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('productId') productId: string,
  ) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: req.user?.brandId || '' },
      select: { slug: true },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.whiteLabelService.generateEmbedCode(brand.slug, productId);
  }

  // ========================================
  // ANALYTICS ROI DASHBOARD
  // ========================================

  @Get('analytics/roi')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Rapport ROI complet du Virtual Try-On' })
  async getROIReport(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.analyticsDashboardService.getROIReport(
      req.user?.brandId || '',
      days,
    );
  }

  @Get('analytics/funnel')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Funnel de conversion try-on' })
  async getConversionFunnel(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.analyticsDashboardService.getConversionFunnel(
      req.user?.brandId || '',
      days,
    );
  }

  @Get('analytics/products')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Performance produits try-on' })
  async getProductPerformance(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsDashboardService.getProductPerformance(
      req.user?.brandId || '',
      days,
      limit,
    );
  }

  @Get('analytics/devices')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Repartition par device' })
  async getDeviceBreakdown(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.analyticsDashboardService.getDeviceBreakdown(
      req.user?.brandId || '',
      days,
    );
  }

  @Get('analytics/trend')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Tendance quotidienne sessions/conversions' })
  async getDailyTrend(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.analyticsDashboardService.getDailyTrend(
      req.user?.brandId || '',
      days,
    );
  }

  @Get('analytics/shares')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Analytique des partages sociaux' })
  async getShareAnalytics(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    return this.socialSharingService.getShareAnalytics(
      req.user?.brandId || '',
      days,
    );
  }
}
