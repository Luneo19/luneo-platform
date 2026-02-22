import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import type { CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { ConfiguratorAccessGuard } from '../guards/configurator-access.guard';
import { SessionOwnerGuard } from '../guards/session-owner.guard';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { Configurator3DSessionService } from '../services/configurator-3d-session.service';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import {
  UpdateSessionDto,
  SessionInteractionDto,
  SaveConfigurationDto,
} from '../dto/sessions';

@ApiTags('configurator-3d-sessions')
@Controller('configurator-3d/sessions')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DSessionsController {
  constructor(
    private readonly sessionService: Configurator3DSessionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard, ConfiguratorAccessGuard)
  @ConfiguratorRateLimit('PUBLIC_SESSION_CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new session (public)' })
  @ApiResponse({ status: 201, description: 'Session started' })
  @ApiResponse({ status: 403, description: 'Access denied to configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async start(
    @Req() req: Request & { user?: CurrentUser; body?: { configurationId: string; visitorId?: string; anonymousId?: string; deviceInfo?: Record<string, unknown> } },
    @Body()
    body: {
      configurationId: string;
      visitorId?: string;
      anonymousId?: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    const visitorId =
      body.visitorId ??
      body.anonymousId ??
      (req.headers['x-anonymous-id'] as string) ??
      (req.headers['x-visitor-id'] as string) ??
      'anonymous';
    return this.sessionService.start({
      configurationId: body.configurationId,
      visitorId,
      userId: req.user?.id,
      anonymousId: body.anonymousId ?? (req.headers['x-anonymous-id'] as string),
      deviceInfo: body.deviceInfo,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all sessions (admin, requires SESSION_READ_ALL)' })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listAll(
    @Req() req: Request & { user?: CurrentUser },
    @Query('configurationId') configurationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.sessionService.findAll(brandId, {
      configurationId,
      status: status as 'ACTIVE' | 'SAVED' | 'COMPLETED' | 'ABANDONED' | 'CONVERTED' | 'EXPIRED',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Session details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: CurrentUser },
  ) {
    const session = await this.sessionService.findOne(id, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    return session;
  }

  @Put(':id')
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionService.update(id, {
      selections: dto.selections as Record<string, string>,
      state: dto.selections as Record<string, unknown>,
      previewImageUrl: dto.previewImageUrl,
    });
  }

  @Post(':id/interactions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record interaction' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Interaction recorded' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async recordInteraction(
    @Param('id') id: string,
    @Body() dto: SessionInteractionDto | SessionInteractionDto[],
  ) {
    const interactions = Array.isArray(dto) ? dto : [dto];
    const mapped = interactions.map((i) => ({
      type: i.type,
      componentId: i.componentId,
      optionId: i.optionId,
      previousOptionId: i.previousOptionId,
      cameraPosition: i.cameraPosition,
      durationMs: i.durationMs,
      metadata: i.metadata,
    }));
    return this.sessionService.recordInteraction(id, mapped);
  }

  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save configuration' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Configuration saved' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async save(
    @Param('id') id: string,
    @Req() req: Request & { user?: CurrentUser },
    @Body() dto: SaveConfigurationDto,
  ) {
    const session = await this.sessionService.findOne(id, {
      userId: req.user?.id,
      brandId: req.user?.brandId ?? undefined,
    });
    return this.sessionService.saveConfiguration(id, {
      name: dto.name,
      description: dto.description,
      userId: req.user?.id,
      selections: (session.selections as Record<string, unknown>) ?? {},
      savedPrice: session.calculatedPrice ?? undefined,
    });
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete session' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Session completed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async complete(@Param('id') id: string) {
    return this.sessionService.complete(id);
  }

  @Post(':id/add-to-cart')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard, SessionOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add to cart' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Added to cart' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async addToCart(
    @Param('id') id: string,
    @Body() body: { orderId?: string; conversionValue?: number },
  ) {
    return this.sessionService.addToCart(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.SESSION_DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete session (admin)' })
  @ApiParam({ name: 'id', description: 'Session ID or sessionId' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async delete(
    @Param('id') id: string,
    @Req() req: Request & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId ?? '';
    return this.sessionService.delete(id, brandId);
  }
}
