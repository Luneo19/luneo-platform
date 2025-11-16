import { Controller, Get, Post, Param, Body, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DesignsService } from './designs.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { ReprojectMaskDto } from './dto/reproject-mask.dto';
import { RequireQuota } from '@/common/decorators/quota.decorator';
import type { Request } from 'express';

@ApiTags('designs')
@Controller('designs')
@ApiBearerAuth()
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau design avec IA' })
  @ApiResponse({
    status: 201,
    description: 'Design créé et génération IA lancée',
  })
  @RequireQuota({ metric: 'ai_generations', amountField: 'body.batchSize' })
  async create(@Body() createDesignDto: CreateDesignDto, @Req() req: Request) {
    return this.designsService.create(createDesignDto, req.user!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Détails du design',
  })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.designsService.findOne(id, req.user!);
  }

  @Post(':id/upgrade-highres')
  @ApiOperation({ summary: 'Générer une version haute résolution' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Génération haute résolution lancée',
  })
  @RequireQuota({ metric: 'renders_2d' })
  async upgradeToHighRes(@Param('id') id: string, @Req() req: Request) {
    return this.designsService.upgradeToHighRes(id, req.user!);
  }

  @Post(':id/masks/reproject')
  @UseInterceptors(FileInterceptor('mask'))
  @ApiOperation({ summary: 'Reproject UV mask onto model UVs' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mask: {
          type: 'string',
          format: 'binary',
        },
        sourceUVBBox: {
          type: 'object',
        },
        targetUVBBox: {
          type: 'object',
        },
        sourceTextureWidth: { type: 'number' },
        sourceTextureHeight: { type: 'number' },
        targetTextureWidth: { type: 'number' },
        targetTextureHeight: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mask reprojected successfully',
  })
  async reprojectMask(
    @Param('id') id: string,
    @UploadedFile() maskFile: Express.Multer.File,
    @Body() reprojectionData: ReprojectMaskDto,
    @Req() req: Request,
  ) {
    return this.designsService.reprojectMask(id, maskFile, reprojectionData, req.user!);
  }

  @Get(':id/ar')
  @ApiOperation({ summary: 'Get AR-ready USDZ URL for design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Signed USDZ URL for AR viewing',
    schema: {
      type: 'object',
      properties: {
        usdzUrl: { type: 'string' },
        expiresAt: { type: 'string' },
        platform: { type: 'string', enum: ['ios', 'android', 'webxr'] },
      },
    },
  })
  async getARUrl(@Param('id') id: string, @Req() req: Request) {
    // Detect platform from user agent
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const platform = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')
      ? 'ios'
      : userAgent.includes('android')
      ? 'android'
      : 'webxr';
    
    return this.designsService.getARUrl(id, req.user!, platform);
  }
}
