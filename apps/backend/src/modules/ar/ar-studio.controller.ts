/**
 * ★★★ CONTROLLER - AR STUDIO ★★★
 * Controller NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Controller, Get, Post, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ArStudioService } from './ar-studio.service';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';

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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
    }

    const model = await this.arStudioService.getModelById(id, brandId);
    if (!model) {
      throw new Error('AR model not found');
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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
    }

    const model = await this.arStudioService.getModelById(id, brandId);
    if (!model) {
      throw new Error('AR model not found');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://luneo.app';
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
}


