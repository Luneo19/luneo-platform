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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { RateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { NovaService } from './nova.service';
import { NovaChatDto, NovaTicketDto, NovaFaqQueryDto } from './dto';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Nova (Support)')
@Controller('agents/nova')
@UseGuards(JwtAuthGuard, RateLimitGuard, BrandOwnershipGuard)
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
    @Body() body: NovaChatDto,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    this.logger.log(`Nova chat request`);

    const brandId = brand?.id || body.brandId || body.context?.brandId;
    
    const response = await this.novaService.chat(
      body.message,
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
  async searchFAQ(@Query() query: NovaFaqQueryDto) {
    const results = await this.novaService.searchFAQ(query.query, query.limit ?? 5);

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
  async createTicket(@Body() body: NovaTicketDto) {
    const ticket = await this.novaService.createTicket({
      subject: body.subject,
      description: body.description,
      priority: body.priority ?? 'medium',
      userId: body.userId,
      brandId: body.brandId,
      category: body.category,
    });

    return {
      success: true,
      data: ticket,
    };
  }
}
