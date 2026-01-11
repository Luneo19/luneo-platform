/**
 * @fileoverview Controller pour l'Agent Nova (Support)
 * @module NovaController
 *
 * ENDPOINTS:
 * - POST /agents/nova/chat - Chat avec Nova
 * - GET /agents/nova/faq - Recherche FAQ
 * - POST /agents/nova/ticket - Créer un ticket
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod
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
import { RateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { NovaService } from './nova.service';

// ============================================================================
// SCHEMAS
// ============================================================================

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  context: z.object({
    userId: z.string().uuid().optional(),
    previousMessages: z.array(z.unknown()).optional(),
  }).optional(),
});

const FAQQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(10).default(5),
});

const TicketRequestSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  userId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  category: z.enum(['TECHNICAL', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST', 'BUG', 'INTEGRATION', 'OTHER']).optional(),
});

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Nova (Support)')
@Controller('agents/nova')
@UseGuards(RateLimitGuard) // Rate limiting global
export class NovaController {
  private readonly logger = new Logger(NovaController.name);

  constructor(private readonly novaService: NovaService) {}

  /**
   * Chat avec Nova
   */
  @Post('chat')
  @RateLimit({ limit: 50, window: 60 }) // 50 req/min pour support
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat avec Nova' })
  @ApiResponse({ status: 200, description: 'Réponse de Nova' })
  async chat(
    @Body() body: unknown,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    const validated = ChatRequestSchema.parse(body);

    this.logger.log(`Nova chat request`);

    const brandId = brand?.id || validated.brandId || (validated.context as { brandId?: string })?.brandId;
    
    const response = await this.novaService.chat(
      validated.message,
      brandId,
    );

    return {
      success: true,
      data: response,
    };
  }

  /**
   * Recherche FAQ
   */
  @Get('faq')
  @RateLimit({ limit: 60, window: 60 }) // 60 req/min pour recherche
  @ApiOperation({ summary: 'Recherche FAQ' })
  async searchFAQ(@Query() query: unknown) {
    const validated = FAQQuerySchema.parse(query);

    const results = await this.novaService.searchFAQ(validated.query, validated.limit);

    return {
      success: true,
      data: results,
    };
  }

  /**
   * Créer un ticket de support
   */
  @Post('ticket')
  @RateLimit({ limit: 10, window: 60 }) // 10 req/min pour création ticket
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un ticket' })
  async createTicket(@Body() body: unknown) {
    const validated = TicketRequestSchema.parse(body);

    const ticket = await this.novaService.createTicket(validated);

    return {
      success: true,
      data: ticket,
    };
  }
}
