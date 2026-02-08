/**
 * ★★★ CONTROLLER - AR STUDIO ★★★
 * Controller NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Controller, Get, Post, Body, Query, Param, UseGuards, Request, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ArStudioService } from './ar-studio.service';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';
import { ConvertToArDto } from './dto/convert-to-ar.dto';
import { ExportModelDto } from './dto/export-model.dto';
import { ConvertUsdzDto } from './dto/convert-usdz.dto';
import { ConversionStatusQueryDto } from './dto/conversion-status-query.dto';

@ApiTags('AR Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ar-studio')
export class ArStudioController {
  constructor(private readonly arStudioService: ArStudioService) {}

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

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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



