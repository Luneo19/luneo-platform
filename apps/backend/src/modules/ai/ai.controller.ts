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
import { AIStudioService } from './services/ai-studio.service';
import { AIGenerationType, AIGenerationParams } from './interfaces/ai-studio.interface';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { GenerateImageDto } from './dto/generate-image.dto';
import { UpscaleImageDto } from './dto/upscale-image.dto';
import { RemoveBackgroundDto } from './dto/remove-background.dto';
import { ExtractColorsDto } from './dto/extract-colors.dto';
import { SmartCropDto } from './dto/smart-crop.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiImageService: AIImageService,
    private readonly aiStudioService: AIStudioService,
  ) {}

  @Get('quota')
  @ApiOperation({ summary: 'Obtenir le quota IA de l\'utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Quota IA avec statistiques d\'utilisation',
    schema: {
      type: 'object',
      properties: {
        quota: {
          type: 'object',
          properties: {
            monthlyLimit: { type: 'number', example: 100 },
            monthlyUsed: { type: 'number', example: 25 },
            costLimitCents: { type: 'number', example: 5000 },
            costUsedCents: { type: 'number', example: 1250 },
            percentageUsed: { type: 'number', example: 25 },
            resetAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalGenerations: { type: 'number', example: 150 },
            generationsThisMonth: { type: 'number', example: 25 },
            totalCostCents: { type: 'number', example: 7500 },
            costThisMonth: { type: 'number', example: 1250 },
          },
        },
      },
    },
  })
  async getQuota(@Request() req: { user: CurrentUser }) {
    return this.aiService.getUserQuota(req.user.id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Générer une image avec DALL-E 3' })
  @ApiResponse({ status: 200, description: 'Image générée avec succès' })
  async generate(
    @Body() body: GenerateImageDto,
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
    @Body() body: UpscaleImageDto,
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
    @Body() body: RemoveBackgroundDto,
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
    @Body() body: ExtractColorsDto,
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
    @Body() body: SmartCropDto,
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiImageService.smartCrop(
      body.imageUrl,
      body.targetAspectRatio,
      body.focusPoint,
      req.user,
    );
  }

  // AI FIX P3-9: Added text-to-design endpoint that was referenced in frontend but missing from API
  @Post('text-to-design')
  @ApiOperation({ summary: 'Générer un design à partir d\'une description textuelle' })
  @ApiResponse({ status: 200, description: 'Design généré avec succès' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async textToDesign(
    @Body() body: { prompt: string; style?: string; parameters?: Record<string, unknown> },
    @Request() req: { user: CurrentUser },
  ) {
    return this.aiStudioService.generate(
      req.user.id,
      req.user.brandId || '',
      AIGenerationType.IMAGE_2D,
      body.prompt,
      body.style || 'default',
      (body.parameters || {}) as AIGenerationParams,
    );
  }
}
