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
import { z } from 'zod';
import { RateLimit, RateLimitPresets } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { AriaService, AriaMessage } from './aria.service';

// ============================================================================
// SCHEMAS
// ============================================================================

const ChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  productId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  message: z.string().min(1).max(1000),
  context: z.object({
    occasion: z.string().optional(),
    recipient: z.string().optional(),
    currentText: z.string().optional(),
    currentStyle: z.object({
      font: z.string().optional(),
      color: z.string().optional(),
    }).optional(),
    language: z.string().default('fr'),
  }).optional(),
});

const QuickSuggestQuerySchema = z.object({
  productId: z.string().uuid(),
  occasion: z.string().min(1),
  language: z.string().default('fr'),
  brandId: z.string().uuid().optional(),
});

const ImproveRequestSchema = z.object({
  text: z.string().min(1).max(500),
  style: z.enum(['elegant', 'fun', 'romantic', 'formal']),
  language: z.string().default('fr'),
  productId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
});

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Aria (B2C)')
@Controller('agents/aria')
@UseGuards(RateLimitGuard) // Rate limiting global
export class AriaController {
  private readonly logger = new Logger(AriaController.name);

  constructor(private readonly ariaService: AriaService) {}

  /**
   * Chat avec Aria
   */
  @Post('chat')
  @RateLimit({ limit: 20, window: 60 }) // 20 req/min pour B2C
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat avec Aria' })
  @ApiResponse({ status: 200, description: 'Réponse d\'Aria' })
  async chat(@Body() body: unknown) {
    const validated = ChatRequestSchema.parse(body);

    this.logger.log(`Aria chat request for product ${validated.productId}`);

    const response = await this.ariaService.chat(validated);

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
  async quickSuggest(@Query() query: unknown) {
    const validated = QuickSuggestQuerySchema.parse(query);

    const suggestions = await this.ariaService.quickSuggest(
      validated.productId,
      validated.occasion,
      validated.language,
      validated.brandId,
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
  async improveText(@Body() body: unknown) {
    const validated = ImproveRequestSchema.parse(body);

    // Récupérer brandId depuis productId si disponible
    let brandId = validated.brandId;
    if (!brandId && validated.productId) {
      // TODO: Récupérer depuis product (pour l'instant optionnel)
    }

    const result = await this.ariaService.improveText(
      validated.text,
      validated.style,
      validated.language,
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
  async recommendStyle(
    @Body() body: { text: string; occasion: string; productType?: string; brandId?: string },
  ) {
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
  async translate(
    @Body() body: { text: string; targetLanguage: string; sourceLanguage?: string; brandId?: string },
  ) {
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
  async spellCheck(
    @Body() body: { text: string; language?: string; brandId?: string },
  ) {
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
  async giftIdeas(
    @Body() body: { occasion: string; recipient: string; budget?: string; preferences?: string; brandId?: string },
  ) {
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
