/**
 * AR Viewer Controller
 * Public endpoints for multi-platform AR viewing: short link redirect, viewer config,
 * embed config, and session/interaction/performance logging.
 * All endpoints are public (@Public()) for unauthenticated viewer access.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PlatformDetectorService } from '../platforms/platform-detector.service';
import { ARQuickLookService } from '../platforms/ios/ar-quick-look.service';
import { SceneViewerService } from '../platforms/android/scene-viewer.service';
import {
  WebxrConfigService,
  WebXRSessionConfig,
} from '../platforms/web/webxr-config.service';
import {
  ModelViewerConfigService,
  ModelViewerConfig,
} from '../platforms/web/model-viewer-config.service';
import { QRCodeRedirectService } from '../platforms/desktop/qr-code-redirect.service';
import {
  StartARSessionDto,
  EndARSessionDto,
  LogARInteractionDto,
  LogARPerformanceDto,
} from '../dto/ar-viewer.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('AR Viewer')
@Controller('ar')
@Public()
// SECURITY FIX P1-8: Rate limit public AR viewer endpoints to prevent abuse
@Throttle({ default: { limit: 120, ttl: 60000 } })
export class ArViewerController {
  private readonly logger = new Logger(ArViewerController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformDetector: PlatformDetectorService,
    private readonly arQuickLook: ARQuickLookService,
    private readonly sceneViewer: SceneViewerService,
    private readonly webxrConfig: WebxrConfigService,
    private readonly modelViewerConfig: ModelViewerConfigService,
    private readonly qrRedirect: QRCodeRedirectService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolve short link and redirect by platform (iOS -> AR Quick Look, Android -> Scene Viewer, Desktop -> QR landing).
   */
  @Get('view/:shortCode')
  @ApiOperation({ summary: 'Resolve AR short link and redirect by platform' })
  @ApiResponse({ status: 302, description: 'Redirect to platform-appropriate viewer' })
  @ApiResponse({ status: 404, description: 'Short code not found' })
  async viewByShortCode(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const qr = await this.prisma.aRQRCode.findUnique({
      where: { shortCode, isActive: true },
      include: { project: true },
    });

    if (!qr) {
      throw new NotFoundException('Short link not found');
    }

    const userAgent = req.headers['user-agent'];
    const detection = this.platformDetector.detect(userAgent);

    await this.prisma.aRQRCode.update({
      where: { id: qr.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });

    const baseUrl = (this.configService.get<string>('app.url') ?? '').replace(/\/$/, '');
    const targetUrl = qr.targetURL.startsWith('http') ? qr.targetURL : `${baseUrl}${qr.targetURL}`;
    const separator = targetUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${targetUrl}${separator}platform=${detection.platform}&method=${detection.method}`;

    this.logger.log(`AR view redirect shortCode=${shortCode} platform=${detection.platform}`);
    res.redirect(302, redirectUrl);
  }

  /**
   * Get viewer config for a 3D model: URLs per platform and features.
   */
  @Get('viewer/:modelId')
  @ApiOperation({ summary: 'Get AR viewer config (URLs per platform, features)' })
  @ApiResponse({ status: 200, description: 'Viewer config' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async getViewerConfig(
    @Param('modelId') modelId: string,
    @Req() req: Request,
  ): Promise<{
    platform: string;
    method: string;
    format: string;
    features: Record<string, boolean>;
    ios: { arQuickLookUrl: string; ready: boolean };
    android: { intentUrl: string; modelUrl: string; webxrFallback: boolean };
    web: { webxr: WebXRSessionConfig; modelViewer: ModelViewerConfig };
    desktop: { qrTargetUrl: string; landingPageUrl: string };
  }> {
    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
      select: {
        id: true,
        name: true,
        gltfURL: true,
        gltfDracoURL: true,
        usdzURL: true,
        thumbnailURL: true,
      },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const userAgent = req.headers['user-agent'];
    const detection = this.platformDetector.detect(userAgent);

    const gltfUrl = model.gltfURL ?? model.gltfDracoURL ?? '';
    const { usdzUrl: arQuickLookUrl, ready } = await this.arQuickLook.getARQuickLookLink({
      modelId,
      title: model.name,
    });

    const sceneViewerResult = this.sceneViewer.getSceneViewerUrl({
      modelUrl: gltfUrl,
      title: model.name,
      imageUrl: model.thumbnailURL ?? undefined,
    });

    const webxrSessionConfig = this.webxrConfig.getSessionConfig({
      features: detection.features,
      preferImmersiveAr: true,
      requestHitTest: true,
    });

    const modelViewerConfig = this.modelViewerConfig.getConfig({
      modelUrl: gltfUrl,
      usdzUrl: model.usdzURL ?? undefined,
      posterUrl: model.thumbnailURL ?? undefined,
      alt: model.name,
      ar: true,
      arMode: 'webxr',
    });

    const baseUrl = (this.configService.get<string>('app.url') ?? '').replace(/\/$/, '');
    const viewerPath = `/ar/viewer/${modelId}`;
    const desktopConfig = this.qrRedirect.getRedirectConfig({
      targetPath: viewerPath,
      title: model.name,
    });

    return {
      platform: detection.platform,
      method: detection.method,
      format: detection.format,
      features: {
        planeDetection: !!detection.features.planeDetection,
        lightEstimation: !!detection.features.lightEstimation,
        hitTest: !!detection.features.hitTest,
      },
      ios: { arQuickLookUrl, ready },
      android: {
        intentUrl: sceneViewerResult.intentUrl,
        modelUrl: sceneViewerResult.modelUrl,
        webxrFallback: sceneViewerResult.webxrFallback,
      },
      web: {
        webxr: webxrSessionConfig,
        modelViewer: modelViewerConfig,
      },
      desktop: {
        qrTargetUrl: desktopConfig.qrTargetUrl,
        landingPageUrl: desktopConfig.landingPageUrl,
      },
    };
  }

  /**
   * Get embed config for a project (e.g. iframe or embed script).
   */
  @Get('embed/:projectId')
  @ApiOperation({ summary: 'Get AR embed config for project' })
  @ApiResponse({ status: 200, description: 'Embed config' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getEmbedConfig(
    @Param('projectId') projectId: string,
  ): Promise<{
    projectId: string;
    embedUrl: string;
    models: Array<{ id: string; name: string; viewerUrl: string }>;
  }> {
    const project = await this.prisma.aRProject.findUnique({
      where: { id: projectId },
      include: { models: { select: { id: true, name: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const baseUrl = (this.configService.get<string>('app.url') ?? '').replace(/\/$/, '');
    const embedUrl = `${baseUrl}/ar/viewer`;

    return {
      projectId,
      embedUrl,
      models: project.models.map((m) => ({
        id: m.id,
        name: m.name,
        viewerUrl: `${baseUrl}/ar/viewer/${m.id}`,
      })),
    };
  }

  /**
   * Start an AR session (creates ARSession record).
   */
  @Post('session/start')
  @ApiOperation({ summary: 'Start AR session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async startSession(@Body() dto: StartARSessionDto): Promise<{ sessionId: string }> {
    const project = await this.prisma.aRProject.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const session = await this.prisma.aRSession.create({
      data: {
        projectId: dto.projectId,
        modelId: dto.modelId,
        userId: dto.userId,
        platform: dto.platform,
        device: dto.device,
        browser: dto.browser,
        arMethod: dto.arMethod,
        featuresUsed: dto.featuresUsed ?? [],
        country: dto.country,
        region: dto.region,
      },
    });

    this.logger.log(`AR session started ${session.id} project=${dto.projectId}`);
    return { sessionId: session.id };
  }

  /**
   * End an AR session (updates duration and counters).
   */
  @Post('session/end')
  @ApiOperation({ summary: 'End AR session' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  async endSession(@Body() dto: EndARSessionDto): Promise<{ ok: boolean }> {
    await this.prisma.aRSession.update({
      where: { id: dto.sessionId },
      data: {
        endedAt: new Date(),
        duration: dto.duration,
        placementCount: dto.placementCount,
        rotationCount: dto.rotationCount,
        scaleChangeCount: dto.scaleChangeCount,
        screenshotsTaken: dto.screenshotsTaken,
        shareCount: dto.shareCount,
        trackingQuality: dto.trackingQuality,
        conversionAction: dto.conversionAction,
        conversionValue: dto.conversionValue,
        errors: dto.errors ?? [],
      },
    });

    this.logger.log(`AR session ended ${dto.sessionId}`);
    return { ok: true };
  }

  /**
   * Log an AR interaction (e.g. model placed, rotated).
   */
  @Post('session/interaction')
  @ApiOperation({ summary: 'Log AR interaction' })
  @ApiResponse({ status: 201, description: 'Interaction logged' })
  async logInteraction(@Body() dto: LogARInteractionDto): Promise<{ id: string }> {
    const interaction = await this.prisma.aRInteraction.create({
      data: {
        sessionId: dto.sessionId,
        type: dto.type,
        position: dto.position ?? undefined,
        rotation: dto.rotation ?? undefined,
        scale: dto.scale,
        modelId: dto.modelId,
        targetId: dto.targetId,
        metadata: (dto.metadata ?? undefined) as object | undefined,
      },
    });

    return { id: interaction.id };
  }

  /**
   * Log AR performance metrics for a session.
   */
  @Post('session/performance')
  @ApiOperation({ summary: 'Log AR performance metrics' })
  @ApiResponse({ status: 201, description: 'Metric logged' })
  async logPerformance(@Body() dto: LogARPerformanceDto): Promise<{ id: string }> {
    const metric = await this.prisma.aRPerformanceMetric.create({
      data: {
        sessionId: dto.sessionId,
        fps: dto.fps,
        memoryUsage: dto.memoryUsage,
        batteryDrain: dto.batteryDrain,
        thermalState: dto.thermalState,
        trackingState: dto.trackingState,
      },
    });

    return { id: metric.id };
  }
}
