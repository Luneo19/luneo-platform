import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import type { CurrentUser } from '@/common/types/user.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Configurator3DExportService } from '../services/configurator-3d-export.service';
import { Configurator3DSessionService } from '../services/configurator-3d-session.service';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { SessionOwnerGuard } from '../guards/session-owner.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import {
  ExportPDFDto,
  ExportARDto,
  Export3DDto,
  ExportImageDto,
} from '../dto/export';

@ApiTags('configurator-3d-export')
@ApiBearerAuth()
@Controller('configurator-3d/sessions/:sessionId/export')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DExportController {
  constructor(
    private readonly exportService: Configurator3DExportService,
    private readonly sessionService: Configurator3DSessionService,
  ) {}

  @Post('pdf')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ConfiguratorRateLimit('EXPORT')
  @ApiOperation({ summary: 'Export PDF' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 202, description: 'Export job queued' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async exportPDF(
    @Param('sessionId') sessionId: string,
    @Req() req: { user?: CurrentUser } & { params?: { sessionId?: string } },
    @Body() dto: ExportPDFDto,
  ) {
    const session = await this.sessionService.findOne(sessionId, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    const userId = req.user?.id ?? (session as { userId?: string }).userId ?? 'anonymous';
    const options = {
      format: dto?.template ?? 'a4',
      includeSpecs: dto?.includeSpecs,
      includePrice: dto?.includePrice,
      customLogo: dto?.customLogo,
      language: dto?.language,
    };
    const configurationId = (session as { configurationId: string }).configurationId;
    const sessionDbId = (session as { id: string }).id;
    return this.exportService.exportPDF(
      configurationId,
      sessionDbId,
      userId,
      options,
    );
  }

  @Post('ar')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ConfiguratorRateLimit('EXPORT')
  @ApiOperation({ summary: 'Export AR' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 202, description: 'Export job queued' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async exportAR(
    @Param('sessionId') sessionId: string,
    @Req() req: { user?: CurrentUser },
    @Body() dto: ExportARDto,
  ) {
    const session = await this.sessionService.findOne(sessionId, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    const userId = req.user?.id ?? (session as { userId?: string }).userId ?? 'anonymous';
    const qualityMap = { low: 1, medium: 2, high: 3 } as const;
    const options = {
      format: dto?.format ?? 'usdz',
      quality: dto?.quality ? qualityMap[dto.quality] : undefined,
      platform: (dto?.optimizeForMobile ? 'ios' : undefined) as 'ios' | 'android' | undefined,
    };
    return this.exportService.exportAR(
      session.configurationId,
      session.id,
      userId,
      options,
    );
  }

  @Post('3d')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ConfiguratorRateLimit('EXPORT')
  @ApiOperation({ summary: 'Export 3D model' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 202, description: 'Export job queued' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async export3D(
    @Param('sessionId') sessionId: string,
    @Req() req: { user?: CurrentUser },
    @Body() dto: Export3DDto,
  ) {
    const session = await this.sessionService.findOne(sessionId, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    const userId = req.user?.id ?? (session as { userId?: string }).userId ?? 'anonymous';
    const options = {
      format: dto?.format ?? 'glb',
      includeTextures: dto?.includeTextures,
    };
    return this.exportService.export3D(
      session.configurationId,
      session.id,
      userId,
      options,
    );
  }

  @Post('image')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ConfiguratorRateLimit('EXPORT')
  @ApiOperation({ summary: 'Export image' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 202, description: 'Export job queued' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async exportImage(
    @Param('sessionId') sessionId: string,
    @Req() req: { user?: CurrentUser },
    @Body() dto: ExportImageDto,
  ) {
    const session = await this.sessionService.findOne(sessionId, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    const userId = req.user?.id ?? (session as { userId?: string }).userId ?? 'anonymous';
    const options = {
      format: dto?.format ?? 'png',
      width: dto?.width,
      height: dto?.height,
      quality: dto?.quality,
    };
    return this.exportService.exportImage(
      session.configurationId,
      session.id,
      userId,
      options,
    );
  }

  @Get(':jobId')
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiOperation({ summary: 'Get export status' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'jobId', description: 'Export job ID' })
  @ApiResponse({ status: 200, description: 'Export status' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Export job not found' })
  async getStatus(
    @Param('jobId') jobId: string,
    @Req() req: { user?: CurrentUser },
  ) {
    const userId = req.user?.id ?? 'anonymous';
    return this.exportService.getStatus(jobId, userId);
  }

  @Get(':jobId/download')
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiOperation({ summary: 'Download export' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'jobId', description: 'Export job ID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Export job not found' })
  async download(
    @Param('jobId') jobId: string,
    @Req() req: { user?: CurrentUser },
    @Res() res: Response,
  ) {
    const userId = req.user?.id ?? 'anonymous';
    const stream = await this.exportService.download(jobId, userId);
    if (!stream) {
      res.status(400).json({ message: 'Export not ready for download' });
      return;
    }
    stream.pipe(res);
  }
}
