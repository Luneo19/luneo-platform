import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { ContentModerationService } from './services/content-moderation.service';
import { IPClaimsService } from './services/ip-claims.service';
import { AntiFraudeService } from './services/anti-fraude.service';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { CreateIPClaimDto } from './dto/create-ip-claim.dto';
import { ReviewIPClaimDto } from './dto/review-ip-claim.dto';
import { CheckFraudDto } from './dto/check-fraud.dto';

@ApiTags('Trust & Safety')
@Controller('trust-safety')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrustSafetyController {
  constructor(
    private readonly moderation: ContentModerationService,
    private readonly ipClaims: IPClaimsService,
    private readonly antiFraude: AntiFraudeService,
  ) {}

  // ========================================
  // CONTENT MODERATION
  // ========================================

  @Post('moderate')
  @ApiOperation({ summary: 'Modère du contenu' })
  @ApiResponse({ status: 200, description: 'Contenu modéré' })
  async moderate(@Body() dto: ModerateContentDto) {
    const content =
      dto.type === 'text'
        ? dto.text ?? ''
        : dto.imageUrl ?? '';
    const request = {
      type: dto.type,
      content,
      context: {
        userId: dto.userId,
        brandId: dto.brandId,
        designId: dto.designId,
        ...dto.context,
        imageMetadata: dto.imageMetadata
          ? {
              width: dto.imageMetadata.width ?? 0,
              height: dto.imageMetadata.height ?? 0,
              size: dto.imageMetadata.size ?? 0,
              mimeType: dto.imageMetadata.mimeType ?? '',
            }
          : undefined,
      },
    };
    return this.moderation.moderate(request);
  }

  @Get('moderation/history')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Récupère l\'historique de modération' })
  @ApiResponse({ status: 200, description: 'Historique récupéré' })
  async getModerationHistory(
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('limit') limit?: number,
    @Query('type') type?: 'text' | 'image' | 'ai_generation',
    @Query('approved') approved?: boolean,
    @Query('action') action?: 'allow' | 'review' | 'block',
  ) {
    return this.moderation.getModerationHistory(
      userId,
      brandId,
      limit ?? 100,
      type,
      approved,
      action,
    );
  }

  // ========================================
  // IP CLAIMS
  // ========================================

  @Post('ip-claims')
  @ApiOperation({ summary: 'Crée une réclamation IP' })
  @ApiResponse({ status: 201, description: 'Réclamation créée' })
  async createClaim(@Body() dto: CreateIPClaimDto) {
    return this.ipClaims.createClaim(dto as any);
  }

  @Post('ip-claims/:claimId/review')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Révision d\'une réclamation IP' })
  @ApiResponse({ status: 200, description: 'Réclamation révisée' })
  async reviewClaim(@Param('claimId') claimId: string, @Body() dto: ReviewIPClaimDto) {
    return this.ipClaims.reviewClaim(claimId, dto.status, 'admin', dto.resolution);
  }

  @Get('ip-claims')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Liste les réclamations IP' })
  @ApiResponse({ status: 200, description: 'Réclamations récupérées' })
  async listClaims(
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
  ) {
    return this.ipClaims.listClaims(status as any, limit);
  }

  // ========================================
  // ANTI-FRAUDE
  // ========================================

  @Post('fraud/check')
  @ApiOperation({ summary: 'Vérifie le risque de fraude' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée' })
  async checkFraud(@Body() dto: CheckFraudDto) {
    return this.antiFraude.checkFraud(dto as any);
  }
}

































