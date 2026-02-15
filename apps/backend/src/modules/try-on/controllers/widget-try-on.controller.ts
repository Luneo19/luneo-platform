import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TryOnSessionService } from '../services/try-on-session.service';
import { TryOnScreenshotService } from '../services/try-on-screenshot.service';
import { CalibrationService } from '../services/calibration.service';
import { PerformanceService } from '../services/performance.service';
import { ModelManagementService } from '../services/model-management.service';
import { TryOnEventsService } from '../services/try-on-events.service';
import { ConversionService } from '../services/conversion.service';
import { SocialSharingService } from '../services/social-sharing.service';
import { TryOnRecommendationService } from '../services/try-on-recommendation.service';
import { BatchScreenshotsDto } from '../dto/batch-screenshots.dto';
import { CalibrationDataDto } from '../dto/calibration-data.dto';
import { BatchPerformanceMetricsDto } from '../dto/performance-metric.dto';
import { TrackConversionDto, AttributeRevenueDto } from '../dto/track-conversion.dto';
import { CreateShareDto } from '../dto/create-share.dto';

/**
 * Public Widget Try-On Controller.
 * These endpoints are accessible without JWT authentication.
 * They are used by the embeddable try-on widget on brand storefronts.
 * Authentication is done via brand slug + product ID (public data only).
 */
@ApiTags('try-on-widget')
@Controller('api/v1/public/try-on')
@Public()
export class WidgetTryOnController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: TryOnSessionService,
    private readonly screenshotService: TryOnScreenshotService,
    private readonly calibrationService: CalibrationService,
    private readonly performanceService: PerformanceService,
    private readonly modelManagementService: ModelManagementService,
    private readonly eventsService: TryOnEventsService,
    private readonly conversionService: ConversionService,
    private readonly socialSharingService: SocialSharingService,
    private readonly recommendationService: TryOnRecommendationService,
  ) {}

  // ========================================
  // CONFIGURATION (Public Read)
  // ========================================

  @Get(':brandSlug/config/:productId')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get try-on configuration for a product (public widget)',
  })
  @ApiParam({ name: 'brandSlug', description: 'Brand slug identifier' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getProductConfig(
    @Param('brandSlug') brandSlug: string,
    @Param('productId') productId: string,
  ) {
    // Find brand by slug
    const brand = await this.prisma.brand.findFirst({
      where: { slug: brandSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand "${brandSlug}" not found`);
    }

    // Find product and verify it belongs to this brand
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId: brand.id },
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found for brand "${brandSlug}"`);
    }

    // Find try-on mapping for this product
    const mapping = await this.prisma.tryOnProductMapping.findFirst({
      where: {
        productId: product.id,
        configuration: {
          isActive: true,
          project: { brandId: brand.id },
        },
      },
      select: {
        id: true,
        model3dUrl: true,
        modelUSDZUrl: true,
        thumbnailUrl: true,
        anchorPoints: true,
        scaleFactor: true,
        adjustments: true,
        defaultPosition: true,
        defaultRotation: true,
        lodLevels: true,
        enableOcclusion: true,
        enableShadows: true,
        configuration: {
          select: {
            id: true,
            name: true,
            productType: true,
            targetZone: true,
            renderSettings: true,
            settings: true,
            uiConfig: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `No try-on configuration found for product ${productId}`,
      );
    }

    // Determine model source
    const productImages = product.images as string[] | null;
    const fallbackImage =
      Array.isArray(productImages) && productImages.length > 0
        ? productImages[0]
        : null;

    return {
      product: {
        id: product.id,
        name: product.name,
        fallbackImage,
      },
      brand: {
        name: brand.name,
        slug: brand.slug,
      },
      mapping: {
        id: mapping.id,
        model3dUrl: mapping.model3dUrl,
        modelUSDZUrl: mapping.modelUSDZUrl,
        thumbnailUrl: mapping.thumbnailUrl,
        anchorPoints: mapping.anchorPoints,
        scaleFactor: mapping.scaleFactor,
        adjustments: mapping.adjustments,
        defaultPosition: mapping.defaultPosition,
        defaultRotation: mapping.defaultRotation,
        lodLevels: mapping.lodLevels,
        enableOcclusion: mapping.enableOcclusion,
        enableShadows: mapping.enableShadows,
      },
      configuration: mapping.configuration,
      modelSource: mapping.model3dUrl ? 'dedicated' : fallbackImage ? 'catalog' : 'none',
    };
  }

  // ========================================
  // SESSIONS (Public Create/Update)
  // ========================================

  @Post('sessions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a public try-on session (widget)' })
  @ApiResponse({ status: 201, description: 'Session started' })
  async startSession(
    @Body()
    body: {
      configurationId: string;
      visitorId: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    if (!body.configurationId || !body.visitorId) {
      throw new BadRequestException(
        'configurationId and visitorId are required',
      );
    }

    // Check usage quota before creating session
    const brandId = await this.eventsService.getBrandIdFromConfig(
      body.configurationId,
    );
    if (brandId) {
      const quota = await this.eventsService.checkSessionQuota(brandId);
      if (!quota.allowed) {
        throw new ForbiddenException(
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

  @Post('sessions/:sessionId/end')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a public try-on session' })
  @ApiParam({ name: 'sessionId', description: 'Session external ID' })
  async endSession(
    @Param('sessionId') sessionId: string,
    @Body()
    body?: {
      conversionAction?: string;
      renderQuality?: string;
    },
  ) {
    // Optionally update conversion action before ending
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
              conversionAction: body.conversionAction,
            }),
            ...(body.renderQuality && { renderQuality: body.renderQuality }),
          },
        });
      }
    }

    const result = await this.sessionService.endSession(sessionId);

    // Fire-and-forget: emit webhook for session completion
    const brandId = await this.eventsService.getBrandIdFromSession(sessionId);
    if (brandId) {
      const ended = result as Record<string, unknown>;
      this.eventsService
        .emitSessionCompleted(brandId, {
          sessionId,
          productsTried: (ended?.productsTried as string[]) || [],
          screenshotsTaken: (ended?.screenshotsTaken as number) || 0,
          duration: 0,
          converted: !!(ended?.converted || body?.conversionAction),
          conversionAction: body?.conversionAction,
          renderQuality: body?.renderQuality,
        })
        .catch(() => {});
    }

    return result;
  }

  // ========================================
  // SCREENSHOTS (Public Batch Upload)
  // ========================================

  @Post('sessions/:sessionId/screenshots/batch')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Batch upload screenshots at end of session (widget)',
  })
  @ApiParam({ name: 'sessionId', description: 'Session external ID' })
  async batchUploadScreenshots(
    @Param('sessionId') sessionId: string,
    @Body() dto: BatchScreenshotsDto,
  ) {
    const result = await this.screenshotService.createBatch(
      sessionId,
      dto.screenshots,
    );

    // Fire-and-forget: meter screenshot usage
    const brandId = await this.eventsService.getBrandIdFromSession(sessionId);
    if (brandId && result.created > 0) {
      this.eventsService
        .meterScreenshotsUploaded(brandId, sessionId, result.created)
        .catch(() => {});
    }

    return result;
  }

  // ========================================
  // CALIBRATION (Public)
  // ========================================

  @Post('sessions/:sessionId/calibration')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit calibration data for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session external ID' })
  async submitCalibration(
    @Param('sessionId') sessionId: string,
    @Body() dto: CalibrationDataDto,
  ) {
    return this.calibrationService.saveCalibration(sessionId, dto);
  }

  @Get('calibration/recommend')
  @ApiOperation({ summary: 'Get calibration recommendation for a device' })
  @ApiQuery({ name: 'deviceType', required: true })
  @ApiQuery({ name: 'cameraResolution', required: false })
  async getCalibrationRecommendation(
    @Query('deviceType') deviceType: string,
    @Query('cameraResolution') cameraResolution?: string,
  ) {
    return this.calibrationService.getRecommendation(
      deviceType,
      cameraResolution,
    );
  }

  // ========================================
  // PERFORMANCE (Public)
  // ========================================

  @Post('sessions/:sessionId/performance')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit performance metrics for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session external ID' })
  async submitPerformance(
    @Param('sessionId') sessionId: string,
    @Body() dto: BatchPerformanceMetricsDto,
  ) {
    return this.performanceService.recordSessionSummary(
      sessionId,
      dto.metrics,
    );
  }

  @Get('device-compatibility')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Check device compatibility based on historical data',
  })
  @ApiQuery({ name: 'deviceType', required: true })
  @ApiQuery({ name: 'gpuInfo', required: false })
  async checkDeviceCompatibility(
    @Query('deviceType') deviceType: string,
    @Query('gpuInfo') gpuInfo?: string,
  ) {
    return this.performanceService.checkDeviceCompatibility(
      deviceType,
      gpuInfo,
    );
  }

  // ========================================
  // CONVERSIONS (Public)
  // ========================================

  @Post('conversions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track a conversion from try-on (add to cart, wishlist, etc.)',
  })
  @ApiResponse({ status: 201, description: 'Conversion tracked' })
  async trackConversion(@Body() dto: TrackConversionDto) {
    return this.conversionService.trackConversion({
      sessionId: dto.sessionId,
      productId: dto.productId,
      action: dto.action as unknown as import('@prisma/client').ConversionAction,
      source: dto.source,
      attributionData: dto.attributionData,
    });
  }

  @Post('conversions/:id/revenue')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Attribute revenue to a conversion (called by pixel or e-commerce webhook)',
  })
  @ApiParam({ name: 'id', description: 'Conversion ID' })
  async attributeRevenue(
    @Param('id') id: string,
    @Body() dto: AttributeRevenueDto,
  ) {
    return this.conversionService.attributeRevenue(id, {
      revenue: dto.revenue,
      currency: dto.currency,
      externalOrderId: dto.externalOrderId,
    });
  }

  // ========================================
  // SOCIAL SHARING (Public)
  // ========================================

  @Post('shares')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shareable link for a try-on screenshot' })
  @ApiResponse({ status: 201, description: 'Share link created' })
  async createShareLink(@Body() dto: CreateShareDto) {
    return this.socialSharingService.createShareLink({
      sessionId: dto.sessionId,
      screenshotId: dto.screenshotId,
      productId: dto.productId,
      platform: dto.platform,
    });
  }

  @Get('shares/:shareToken')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get share page data (for rendering OG tags)' })
  @ApiParam({ name: 'shareToken', description: 'Share token' })
  async getSharePage(@Param('shareToken') shareToken: string) {
    return this.socialSharingService.getSharePage(shareToken);
  }

  @Post('shares/:shareToken/click')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track a click on a share link' })
  @ApiParam({ name: 'shareToken', description: 'Share token' })
  async trackShareClick(@Param('shareToken') shareToken: string) {
    await this.socialSharingService.trackShareClick(shareToken);
    return { tracked: true };
  }

  // ========================================
  // RECOMMENDATIONS (Public)
  // ========================================

  @Get('sessions/:sessionId/recommendations')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get real-time product recommendations during try-on session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session external ID' })
  @ApiQuery({ name: 'currentProductId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRecommendations(
    @Param('sessionId') sessionId: string,
    @Query('currentProductId') currentProductId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getRecommendations(
      sessionId,
      currentProductId,
      limit ? Math.min(limit, 10) : 5,
    );
  }
}
