/**
 * ★★★ CONTROLLER - AR STUDIO ★★★
 * Controller NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ArStudioService } from './ar-studio.service';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';
import { ConvertToArDto } from './dto/convert-to-ar.dto';
import { ExportModelDto } from './dto/export-model.dto';
import { ConvertUsdzDto } from './dto/convert-usdz.dto';
import { ConversionStatusQueryDto } from './dto/conversion-status-query.dto';
import { StartPreviewDto } from './dto/start-preview.dto';
import { UploadModelDto } from './dto/upload-model.dto';

@ApiTags('AR Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ar-studio')
export class ArStudioController {
  constructor(private readonly arStudioService: ArStudioService) {}

  @Post('preview/start')
  @ApiOperation({ summary: 'Start AR preview for a model' })
  @ApiResponse({ status: 200, description: 'Preview data returned' })
  async startPreview(
    @Body() body: StartPreviewDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    const model = await this.arStudioService.getModelById(body.modelId, brandId);
    const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.luneo.app' : 'http://localhost:3000');
    const previewUrl = model ? `${baseUrl}/ar/preview/${body.modelId}` : undefined;
    return {
      previewUrl: previewUrl ?? undefined,
      model: model ? { ...model, previewUrl: previewUrl ?? (model.usdzUrl ?? model.glbUrl) } : undefined,
    };
  }

  @Post('models')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a 3D model to AR Studio' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'name'],
      properties: {
        file: { type: 'string', format: 'binary', description: '3D model file (.glb, .gltf, .usdz, .obj, .fbx)' },
        name: { type: 'string', description: 'Model display name' },
        format: { type: 'string', enum: ['glb', 'gltf', 'usdz', 'obj', 'fbx'], description: 'Format hint' },
        projectId: { type: 'string', description: 'AR project ID to associate' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Model uploaded and created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or missing required fields' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Body() body: UploadModelDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    const model = await this.arStudioService.uploadModel(
      brandId,
      req.user.id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype || 'application/octet-stream',
        originalname: file.originalname,
        size: file.size,
      },
      {
        name: body.name,
        format: body.format,
        projectId: body.projectId,
      },
    );
    return { success: true, data: { model } };
  }

  @Get('models')
  @ApiOperation({ summary: 'List all AR models for a brand' })
  @ApiResponse({ status: 200, description: 'AR models retrieved successfully' })
  async listModels(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const models = await this.arStudioService.listModels(brandId);
    return { success: true, data: { models } };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get AR analytics for the brand' })
  @ApiQuery({ name: 'period', required: false, description: 'Period: 7d, 30d, 90d' })
  @ApiResponse({ status: 200, description: 'AR analytics retrieved successfully' })
  async getBrandAnalyticsRoute(
    @Query('period') period: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const validPeriod = period === '30d' || period === '90d' ? period : '7d';
    const analytics = await this.arStudioService.getBrandAnalytics(brandId, validPeriod);
    return {
      success: true,
      ...analytics,
      topModels: analytics.mostPopularModels,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List AR sessions for the brand' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'AR sessions retrieved successfully' })
  async listSessions(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const result = await this.arStudioService.listSessions(brandId, pageNum, limitNum);
    return { success: true, sessions: result.sessions, total: result.total };
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Delete an AR model by ID' })
  @ApiParam({ name: 'id', description: 'AR model ID' })
  @ApiResponse({ status: 200, description: 'AR model deleted successfully' })
  @ApiResponse({ status: 404, description: 'AR model not found' })
  async deleteModel(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    await this.arStudioService.deleteModel(id, brandId);
    return { success: true };
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get AR model by ID' })
  @ApiParam({ name: 'id', description: 'AR model ID' })
  @ApiResponse({ status: 200, description: 'AR model retrieved successfully' })
  async getModel(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const model = await this.arStudioService.getModelById(id, brandId);
    if (!model) {
      throw new NotFoundException('AR model not found');
    }

    return { success: true, data: { model } };
  }

  @Post('models/:id/qr-code')
  @ApiOperation({ summary: 'Generate QR code for AR model sharing' })
  @ApiParam({ name: 'id', description: 'AR model ID' })
  @ApiResponse({ status: 200, description: 'QR code generated successfully' })
  async generateQRCode(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const qrCodeData = await this.arStudioService.generateQRCode(id, brandId);
    return { success: true, data: qrCodeData };
  }

  @Get('models/:id/analytics')
  @ApiOperation({ summary: 'Get analytics for an AR model' })
  @ApiParam({ name: 'id', description: 'AR model ID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const analytics = await this.arStudioService.getModelAnalytics(id, brandId);
    return { success: true, data: analytics };
  }

  @Get('models/:id/preview')
  @ApiOperation({ summary: 'Get AR preview URL for a model' })
  @ApiParam({ name: 'id', description: 'AR model ID' })
  @ApiResponse({ status: 200, description: 'Preview URL retrieved successfully' })
  async getPreview(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const model = await this.arStudioService.getModelById(id, brandId);
    if (!model) {
      throw new NotFoundException('AR model not found');
    }

    const baseUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://app.luneo.app' : 'http://localhost:3000');
    const previewUrl = `${baseUrl}/ar/preview/${id}`;

    return {
      success: true,
      data: {
        previewUrl,
        modelUrl: model.usdzUrl || model.glbUrl,
        modelType: model.usdzUrl ? 'usdz' : 'glb',
      },
    };
  }

  @Post('convert-2d-to-3d')
  @ApiOperation({ summary: 'Convertir une image 2D en modèle 3D via Meshy.ai' })
  @ApiResponse({ status: 201, description: 'Conversion initiée' })
  async convert2DTo3D(
    @Body() body: ConvertToArDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const result = await this.arStudioService.convert2DTo3D(
      req.user.id,
      brandId,
      body.design_id,
      body.image_url,
    );
    return { success: true, data: result };
  }

  @Get('convert-2d-to-3d')
  @ApiOperation({ summary: 'Vérifier le statut d\'une conversion 2D→3D' })
  @ApiQuery({ name: 'task_id', description: 'ID de la tâche Meshy.ai' })
  @ApiResponse({ status: 200, description: 'Statut de conversion' })
  async getConversionStatus(
    @Query() query: ConversionStatusQueryDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const taskId = query.task_id;
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const result = await this.arStudioService.getConversionStatus(
      taskId,
      req.user.id,
      brandId,
    );
    return { success: true, data: result };
  }

  @Post('export')
  @ApiOperation({ summary: 'Exporte un modèle AR en différents formats (GLB, USDZ)' })
  @ApiResponse({ status: 200, description: 'Modèle exporté avec succès' })
  async exportModel(
    @Body() body: ExportModelDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const result = await this.arStudioService.exportModel(
      body.ar_model_id,
      brandId,
      body.format,
      {
        optimize: body.optimize,
        includeTextures: body.include_textures,
        compressionLevel: body.compression_level,
      },
    );
    return { success: true, data: result };
  }

  @Post('convert-usdz')
  @ApiOperation({ summary: 'Convertit un modèle GLB en USDZ' })
  @ApiResponse({ status: 200, description: 'Conversion réussie' })
  async convertUSDZ(
    @Body() body: ConvertUsdzDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }

    const result = await this.arStudioService.convertGLBToUSDZ(
      body.glb_url,
      req.user.id,
      brandId,
      {
        productName: body.product_name,
        scale: body.scale,
        optimize: body.optimize,
        arModelId: body.ar_model_id,
      },
    );
    return { success: true, data: result };
  }
}



