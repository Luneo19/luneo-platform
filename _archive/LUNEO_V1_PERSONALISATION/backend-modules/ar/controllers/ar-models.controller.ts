/**
 * AR Studio - 3D Models Controller
 * CRUD + conversion + optimization + validation for AR 3D models
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { ModelConverterService, ConversionRequest } from '../conversion/model-converter.service';
import { ModelValidatorService } from '../conversion/validation/model-validator.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface AuthUser {
  id: string;
  brandId: string;
}

@Controller('ar-studio/models')
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ArModelsController {
  private readonly logger = new Logger(ArModelsController.name);

  constructor(
    private readonly modelConverter: ModelConverterService,
    private readonly modelValidator: ModelValidatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Upload a new 3D model with optional auto-conversion
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @User() user: AuthUser,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined,
    @Body() body: { name?: string; projectId: string; autoConvert?: string; generateLODs?: string },
  ) {
    if (!file?.buffer) {
      return { error: 'File is required' };
    }
    this.logger.log(`Upload 3D model: ${file.originalname ?? 'file'} for project ${body.projectId}`);

    // Verify project access
    const project = await this.prisma.aRProject.findFirst({
      where: { id: body.projectId, brandId: user.brandId },
    });
    if (!project) {
      return { error: 'Project not found or access denied' };
    }

    const result = await this.modelConverter.uploadAndConvert(body.projectId, {
      buffer: file.buffer,
      mimetype: file.mimetype ?? 'application/octet-stream',
      originalname: file.originalname ?? 'model',
      size: file.buffer.length,
    }, {
      name: body.name,
      autoConvert: body.autoConvert !== 'false',
      generateLODs: body.generateLODs !== 'false',
    });

    return result;
  }

  /**
   * List all 3D models for a project
   */
  @Get()
  async listModels(
    @User() user: AuthUser,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('format') format?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(parseInt(limit || '20', 10), 100);
    const skip = (Math.max(parseInt(page || '1', 10), 1) - 1) * take;

    const where: Record<string, unknown> = {
      project: { brandId: user.brandId },
    };
    if (projectId) where.projectId = projectId;
    if (status) where.validationStatus = status;
    if (format) where.originalFormat = format;

    const [models, total] = await Promise.all([
      this.prisma.aR3DModel.findMany({
        where,
        include: {
          conversions: { select: { targetFormat: true, status: true } },
          _count: { select: { sessions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.aR3DModel.count({ where }),
    ]);

    return {
      models,
      pagination: { total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  /**
   * Get model details with all converted URLs
   */
  @Get(':id')
  async getModel(@User() user: AuthUser, @Param('id') id: string) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
      include: {
        conversions: true,
        project: { select: { id: true, name: true } },
        _count: { select: { sessions: true, imageTargets: true } },
      },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    return model;
  }

  /**
   * Delete a model and its conversions
   */
  @Delete(':id')
  async deleteModel(@User() user: AuthUser, @Param('id') id: string) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    await this.prisma.aR3DModel.delete({ where: { id } });

    return { success: true, message: 'Model deleted' };
  }

  /**
   * Trigger multi-format conversion for a model
   */
  @Post(':id/convert')
  async convertModel(
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { targetFormats?: string[]; optimize?: boolean; generateLODs?: boolean },
  ) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    const request: ConversionRequest = {
      modelId: id,
      targetFormats: (body.targetFormats as ('gltf' | 'glb' | 'usdz' | 'draco')[]) || ['glb', 'usdz', 'draco'],
      optimize: body.optimize ?? true,
      generateLODs: body.generateLODs ?? true,
    };

    const result = await this.modelConverter.convertModel(request);

    return { modelId: id, ...result };
  }

  /**
   * Get conversion status for a model
   */
  @Get(':id/conversion-status')
  async getConversionStatus(@User() user: AuthUser, @Param('id') id: string) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    return this.modelConverter.getConversionStatus(id);
  }

  /**
   * Get validation report for a model
   */
  @Get(':id/validation')
  async getValidation(@User() user: AuthUser, @Param('id') id: string) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    return this.modelValidator.validate(id);
  }

  /**
   * Trigger optimization (Draco + LODs) for a model
   */
  @Post(':id/optimize')
  async optimizeModel(
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { draco?: boolean; lods?: boolean; meshOptimize?: boolean },
  ) {
    const model = await this.prisma.aR3DModel.findFirst({
      where: { id, project: { brandId: user.brandId } },
    });

    if (!model) {
      return { error: 'Model not found' };
    }

    const formats: ('draco')[] = [];
    if (body.draco !== false) formats.push('draco');

    const result = await this.modelConverter.convertModel({
      modelId: id,
      targetFormats: formats,
      optimize: true,
      generateLODs: body.lods !== false,
    });

    return { modelId: id, ...result };
  }
}
