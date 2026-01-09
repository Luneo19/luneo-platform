import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AIImageService } from './services/ai-image.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiImageService: AIImageService,
  ) {}

  @Get('quota')
  @ApiOperation({ summary: 'Obtenir le quota IA de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Quota IA',
  })
  async getQuota(@Request() req: { user: CurrentUser }) {
    return { message: 'AI quota endpoint' };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Générer une image avec DALL-E 3' })
  @ApiResponse({ status: 200, description: 'Image générée avec succès' })
  async generate(
    @Body() body: {
      prompt: string;
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      style?: 'vivid' | 'natural';
    },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.generate(
      body.prompt,
      body.size,
      body.quality,
      body.style,
      req.user,
    );
  }

  @Post('upscale')
  @ApiOperation({ summary: 'Agrandir une image avec Real-ESRGAN' })
  @ApiResponse({ status: 200, description: 'Image agrandie avec succès' })
  async upscale(
    @Body() body: {
      imageUrl: string;
      scale?: '2' | '4';
      enhanceDetails?: boolean;
    },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.upscale(
      body.imageUrl,
      body.scale,
      body.enhanceDetails,
      req.user,
    );
  }

  @Post('background-removal')
  @ApiOperation({ summary: 'Supprimer l\'arrière-plan d\'une image' })
  @ApiResponse({ status: 200, description: 'Arrière-plan supprimé avec succès' })
  async removeBackground(
    @Body() body: {
      imageUrl: string;
      mode?: 'auto' | 'person' | 'product' | 'animal';
    },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.removeBackground(
      body.imageUrl,
      body.mode,
      req.user,
    );
  }

  @Post('extract-colors')
  @ApiOperation({ summary: 'Extraire les couleurs dominantes d\'une image' })
  @ApiResponse({ status: 200, description: 'Couleurs extraites avec succès' })
  async extractColors(
    @Body() body: {
      imageUrl: string;
      maxColors?: number;
      includeNeutral?: boolean;
    },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.extractColors(
      body.imageUrl,
      body.maxColors,
      body.includeNeutral,
      req.user,
    );
  }

  @Post('smart-crop')
  @ApiOperation({ summary: 'Recadrage intelligent d\'une image' })
  @ApiResponse({ status: 200, description: 'Image recadrée avec succès' })
  async smartCrop(
    @Body() body: {
      imageUrl: string;
      targetAspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
      focusPoint?: 'auto' | 'face' | 'center' | 'product';
    },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.smartCrop(
      body.imageUrl,
      body.targetAspectRatio,
      body.focusPoint,
      req.user,
    );
  }
}
