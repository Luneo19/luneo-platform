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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { RateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { NovaService } from './nova.service';
import { LLMStreamService } from '../services/llm-stream.service';
import { LLMProvider, LLM_MODELS } from '../services/llm-router.service';
import { NovaChatDto, NovaTicketDto, NovaFaqQueryDto } from './dto';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Nova (Support)')
@Controller('agents/nova')
@UseGuards(JwtAuthGuard, RateLimitGuard, BrandOwnershipGuard)
export class NovaController {
  private readonly logger = new Logger(NovaController.name);

  constructor(
    private readonly novaService: NovaService,
    private readonly streamService: LLMStreamService,
  ) {}

  /**
   * Chat avec Nova
   */
  @Post('chat')
  @RateLimit({ limit: 50, window: 60 })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat avec Nova' })
  @ApiResponse({ status: 200, description: 'Réponse de Nova' })
  async chat(
    @Body() body: NovaChatDto,
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
  ) {
    this.logger.log(`Nova chat request`);

    const brandId = brand?.id || body.brandId || body.context?.brandId;

    const response = await this.novaService.chatWithContext({
      message: body.message,
      brandId,
      userId: user?.id,
      conversationId: body.conversationId,
      context: body.context ? {
        currentPage: undefined,
        locale: undefined,
        metadata: body.context.previousMessages
          ? { previousMessages: body.context.previousMessages }
          : undefined,
      } : undefined,
    });

    return {
      success: true,
      data: response,
    };
  }

  /**
   * Chat avec Nova (streaming SSE)
   */
  @Get('chat/stream')
  @Sse('nova-stream')
  @RateLimit({ limit: 30, window: 60 })
  @ApiOperation({ summary: 'Chat avec Nova (streaming SSE)' })
  @ApiResponse({ status: 200, description: 'Stream de réponse Nova' })
  chatStream(
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
    @Query('message') message: string,
    @Query('conversationId') _conversationId?: string,
  ): Observable<MessageEvent> {
    const brandId = brand?.id;
    const novaConfig = { provider: LLMProvider.OPENAI, model: LLM_MODELS.openai.GPT4O_MINI };

    const systemMessage = `Tu es Nova, l'assistant support de Luneo. Réponds de manière professionnelle et empathique.`;

    return this.streamService
      .stream(novaConfig.provider, novaConfig.model, [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message },
      ], {
        temperature: 0.5,
        maxTokens: 2048,
        brandId,
        agentType: 'nova',
      })
      .pipe(
        map((chunk) => ({
          data: JSON.stringify({
            content: chunk.content,
            done: chunk.done,
            usage: chunk.usage,
          }),
        })),
      );
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
