/**
 * @fileoverview Controller pour l'Agent Aria (B2C)
 * @module AriaController
 *
 * ENDPOINTS:
 * - POST /agents/aria/chat - Chat avec Aria
 * - GET /agents/aria/quick-suggest - Suggestions rapides
 * - POST /agents/aria/improve - Améliorer un texte
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod
 * - ✅ Guards d'authentification (optionnel pour B2C)
 * - ✅ Gestion d'erreurs
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AriaService, AriaMessage } from './aria.service';
import {
  AriaChatDto,
  AriaImproveTextDto,
  AriaQuickSuggestQueryDto,
  RecommendStyleDto,
  AriaTranslateDto,
  AriaSpellCheckDto,
  AriaGiftIdeasDto,
} from './dto';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Aria (B2C)')
@Controller('agents/aria')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class AriaController {
  private readonly logger = new Logger(AriaController.name);

  constructor(
    private readonly ariaService: AriaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chat avec Aria
   */
  @Post('chat')
  @RateLimit({ limit: 20, window: 60 }) // 20 req/min pour B2C
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat avec Aria' })
  @ApiResponse({ status: 200, description: 'Réponse d\'Aria' })
  async chat(@Body() body: AriaChatDto) {
    this.logger.log(`Aria chat request for product ${body.productId}`);

    const response = await this.ariaService.chat(body as AriaMessage);

    return {
      success: true,
      data: response,
    };
  }

  /**
   * Suggestions rapides par occasion
   */
  @Get('quick-suggest')
  @RateLimit({ limit: 30, window: 60 }) // 30 req/min (cache activé)
  @ApiOperation({ summary: 'Suggestions rapides' })
  @ApiResponse({ status: 200, description: 'Liste de suggestions' })
  async quickSuggest(@Query() query: AriaQuickSuggestQueryDto) {
    const suggestions = await this.ariaService.quickSuggest(
      query.productId,
      query.occasion,
      query.language ?? 'fr',
      query.brandId,
    );

    return {
      success: true,
      data: suggestions,
    };
  }

  /**
   * Améliorer un texte
   */
  @Post('improve')
  @RateLimit({ limit: 20, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Améliorer un texte' })
  @ApiResponse({ status: 200, description: 'Texte amélioré' })
  async improveText(@Body() body: AriaImproveTextDto) {
    let brandId = body.brandId;
    if (!brandId && body.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: body.productId },
        select: { brandId: true },
      });
      if (product?.brandId) brandId = product.brandId;
    }

    const result = await this.ariaService.improveText(
      body.text,
      body.style as 'elegant' | 'fun' | 'romantic' | 'formal',
      body.language ?? 'fr',
      brandId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Recommander des styles
   */
  @Post('recommend-style')
  @RateLimit({ limit: 20, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recommander des styles' })
  async recommendStyle(@Body() body: RecommendStyleDto) {
    const styles = await this.ariaService.recommendStyle(
      body.text,
      body.occasion,
      body.productType,
      body.brandId,
    );

    return {
      success: true,
      data: styles,
    };
  }

  /**
   * Traduire un texte
   */
  @Post('translate')
  @RateLimit({ limit: 30, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traduire un texte' })
  async translate(@Body() body: AriaTranslateDto) {
    const result = await this.ariaService.translate(
      body.text,
      body.targetLanguage,
      body.sourceLanguage,
      body.brandId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Vérifier l'orthographe
   */
  @Post('spell-check')
  @RateLimit({ limit: 30, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier l\'orthographe' })
  async spellCheck(@Body() body: AriaSpellCheckDto) {
    const result = await this.ariaService.spellCheck(
      body.text,
      body.language,
      body.brandId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Générer des idées de cadeaux
   */
  @Post('gift-ideas')
  @RateLimit({ limit: 20, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Générer des idées de cadeaux' })
  async giftIdeas(@Body() body: AriaGiftIdeasDto) {
    const ideas = await this.ariaService.giftIdeas(
      body.occasion,
      body.recipient,
      body.budget,
      body.preferences,
      body.brandId,
    );

    return {
      success: true,
      data: ideas,
    };
  }
}
