/**
 * AR Studio - Image Targets Controller
 * CRUD + quality analysis for AR image targets
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { ImageTargetService } from '../tracking/image-target.service';
import { UpdateImageTargetDto } from '../dto/ar-targets.dto';

@ApiTags('AR Studio - Targets')
@Controller('ar-studio/targets')
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ArTargetsController {
  private readonly logger = new Logger(ArTargetsController.name);

  constructor(private readonly imageTargetService: ImageTargetService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image target (multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string' },
        name: { type: 'string' },
        physicalWidthCm: { type: 'number' },
        physicalHeightCm: { type: 'number' },
        linkedModelId: { type: 'string' },
        triggerAction: { type: 'string', enum: ['SHOW_3D_MODEL', 'PLAY_VIDEO', 'OPEN_URL', 'SHOW_INFO_CARD', 'START_ANIMATION', 'LAUNCH_CONFIGURATOR'] },
        triggerConfig: { type: 'object' },
      },
    },
  })
  async create(
    @User() user: CurrentUser,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined,
    @Body() body: { projectId: string } & Record<string, unknown>,
  ) {
    const brandId = user.brandId ?? '';
    const projectId = body.projectId as string;
    const options = {
      name: (body.name as string) ?? file?.originalname ?? 'Image Target',
      physicalWidthCm: Number(body.physicalWidthCm) || 10,
      physicalHeightCm: Number(body.physicalHeightCm) || 10,
      linkedModelId: body.linkedModelId as string | undefined,
      triggerAction: body.triggerAction as import('@prisma/client').TriggerAction | undefined,
      triggerConfig: body.triggerConfig as Record<string, unknown> | undefined,
    };
    if (!file?.buffer) throw new BadRequestException('Image file is required');
    return this.imageTargetService.createTarget(projectId, brandId, file, options);
  }

  @Get()
  @ApiOperation({ summary: 'List targets for project' })
  async list(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const brandId = user.brandId ?? '';
    return this.imageTargetService.listTargets(
      projectId,
      brandId,
      includeInactive === 'true',
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get target detail + quality score' })
  async getOne(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    return this.imageTargetService.getTarget(id, brandId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update target (linked model, trigger)' })
  async update(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateImageTargetDto,
  ) {
    const brandId = user.brandId ?? '';
    return this.imageTargetService.updateTarget(id, brandId, {
      name: dto.name,
      physicalWidthCm: dto.physicalWidthCm,
      physicalHeightCm: dto.physicalHeightCm,
      linkedModelId: dto.linkedModelId,
      triggerAction: dto.triggerAction,
      triggerConfig: dto.triggerConfig,
      isActive: dto.isActive,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete target (soft delete)' })
  async delete(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    return this.imageTargetService.deleteTarget(id, brandId);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Re-analyze quality' })
  async reanalyze(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    return this.imageTargetService.reanalyzeQuality(id, brandId);
  }
}
