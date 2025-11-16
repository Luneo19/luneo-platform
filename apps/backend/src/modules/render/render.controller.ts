import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RenderQueueService } from './services/render-queue.service';
import { CreateRenderDto, RenderOptionsDto } from './dto/create-render.dto';
import { randomUUID } from 'crypto';
import { RenderOptions, RenderRequest } from './interfaces/render.interface';
import { RequireQuota } from '@/common/decorators/quota.decorator';

@ApiTags('Render Engine')
@Controller('render')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RenderController {
  constructor(private readonly renderQueueService: RenderQueueService) {}

  @Post('2d')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Planifie un rendu 2D via la file d\'attente' })
  @ApiResponse({ status: 202, description: 'Rendu en file d\'attente' })
  @RequireQuota({ metric: 'renders_2d', brandField: 'body.brandId' })
  async enqueueRender2D(@Body() body: CreateRenderDto) {
    const requestId = body.id ?? randomUUID();
    const options = this.mapRenderOptions(body.options);
    const request: RenderRequest = {
      id: requestId,
      type: '2d',
      productId: body.productId,
      designId: body.designId,
      options,
      priority: body.priority,
      callback: body.callback,
    };

    return this.renderQueueService.enqueueRender(request, {
      brandId: body.brandId,
      userId: body.userId,
    });
  }

  @Post('3d')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Planifie un rendu 3D via la file d\'attente' })
  @ApiResponse({ status: 202, description: 'Rendu en file d\'attente' })
  @RequireQuota({ metric: 'renders_3d', brandField: 'body.brandId' })
  async enqueueRender3D(@Body() body: CreateRenderDto) {
    const requestId = body.id ?? randomUUID();
    const options = this.mapRenderOptions(body.options);
    const request: RenderRequest = {
      id: requestId,
      type: '3d',
      productId: body.productId,
      designId: body.designId,
      options,
      priority: body.priority,
      callback: body.callback,
    };

    return this.renderQueueService.enqueueRender(request, {
      brandId: body.brandId,
      userId: body.userId,
    });
  }

  @Get(':renderId')
  @ApiOperation({ summary: 'Récupère le statut d\'un rendu' })
  @ApiResponse({ status: 200, description: 'Statut récupéré' })
  async getRenderStatus(@Param('renderId') renderId: string) {
    return this.renderQueueService.getRenderStatus(renderId);
  }

  @Get(':renderId/progress')
  @ApiOperation({ summary: 'Récupère la progression détaillée d\'un rendu' })
  @ApiResponse({ status: 200, description: 'Progression récupérée' })
  async getRenderProgress(@Param('renderId') renderId: string) {
    return this.renderQueueService.getRenderProgress(renderId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtient les métriques globales du moteur de rendu (legacy)' })
  @ApiResponse({ status: 200, description: 'Métriques récupérées' })
  async getMetricsLegacy() {
    return this.renderQueueService.getMetrics();
  }

  private mapRenderOptions(dto: RenderOptionsDto): RenderOptions {
    const options: RenderOptions = {
      width: dto.width,
      height: dto.height,
      dpi: dto.dpi,
      backgroundColor: dto.backgroundColor,
      quality: dto.quality,
      antialiasing: dto.antialiasing,
      shadows: dto.shadows,
      reflections: dto.reflections,
      format: dto.format,
      compression: dto.compression,
      exportFormat: dto.exportFormat,
      includeAnimations: dto.includeAnimations,
      optimizeForWeb: dto.optimizeForWeb,
    };

    if (dto.camera) {
      options.camera = {
        position: {
          x: dto.camera.position.x,
          y: dto.camera.position.y,
          z: dto.camera.position.z,
        },
        target: {
          x: dto.camera.target.x,
          y: dto.camera.target.y,
          z: dto.camera.target.z,
        },
        fov: dto.camera.fov,
        near: dto.camera.near,
        far: dto.camera.far,
        type: dto.camera.type,
      };
    }

    if (dto.lighting) {
      const directional = (dto.lighting.directional ?? []).map((light) => ({
        color: dto.lighting?.color ?? '#ffffff',
        intensity: dto.lighting?.intensity ?? 1,
        position: { x: light.x, y: light.y, z: light.z },
        castShadow: true,
      }));

      options.lighting = {
        ambient: {
          color: dto.lighting.color ?? '#ffffff',
          intensity: dto.lighting.intensity ?? 1,
        },
        directional,
        point: [],
      };
    }

    return options;
  }
}


