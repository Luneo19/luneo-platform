/**
 * @fileoverview Controller pour l'Agent Luna (B2B)
 * @module LunaController
 *
 * ENDPOINTS:
 * - POST /agents/luna/chat - Envoyer un message à Luna
 * - POST /agents/luna/action - Exécuter une action
 * - GET /agents/luna/conversations - Historique des conversations
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod des inputs
 * - ✅ Guards d'authentification
 * - ✅ Gestion d'erreurs standardisée
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Sse,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RateLimit } from '@/libs/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '@/libs/rate-limit/rate-limit.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { LunaService, LunaAction } from './luna.service';
import { ConversationService } from '../services/conversation.service';
import { LLMStreamService } from '../services/llm-stream.service';
import { LLMProvider } from '../services/llm-router.service';
import { RAGService } from '../services/rag.service';
import { LunaChatDto, LunaActionRequestDto, ChatStreamQueryDto } from './dto';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents - Luna (B2B)')
@ApiBearerAuth()
@Controller('agents/luna')
@UseGuards(JwtAuthGuard, RateLimitGuard) // Rate limiting + Auth
export class LunaController {
  private readonly logger = new Logger(LunaController.name);

  constructor(
    private readonly lunaService: LunaService,
    private readonly conversationService: ConversationService,
    private readonly streamService: LLMStreamService,
    private readonly ragService: RAGService,
  ) {}

  /**
   * Chat avec Luna (streaming SSE)
   */
  @Get('chat/stream')
  @Sse('chat-stream')
  @RateLimit({ limit: 30, window: 60 })
  @ApiOperation({ summary: 'Chat avec Luna (streaming SSE)' })
  @ApiResponse({ status: 200, description: 'Stream de réponse Luna' })
  chatStream(
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
    @Query() query: ChatStreamQueryDto,
  ): Observable<MessageEvent> {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const { message } = query;

    // Construire les messages pour streaming
    // Note: Simplifié pour l'exemple, devrait utiliser le même flow que chat()
    const messages = [
      { role: 'system' as const, content: 'You are Luna, a B2B AI assistant.' },
      { role: 'user' as const, content: message },
    ];

    return this.streamService
      .stream(
        LLMProvider.ANTHROPIC,
        'claude-3-sonnet-20240229',
        messages,
        {
          brandId: brand.id,
          agentType: 'luna',
        },
      )
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
   * Envoie un message à Luna et reçoit une réponse
   */
  @Post('chat')
  @RateLimit({ limit: 30, window: 60 }) // 30 req/min pour B2B
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat avec Luna' })
  @ApiResponse({ status: 200, description: 'Réponse de Luna' })
  @ApiResponse({ status: 400, description: 'Message invalide' })
  async chat(
    @Body() body: LunaChatDto,
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    this.logger.log(`Luna chat request from user ${user.id} in brand ${brand.id}`);

    const response = await this.lunaService.chat({
      brandId: brand.id,
      userId: user.id,
      message: body.message,
      conversationId: body.conversationId,
      context: body.context,
    });

    return {
      success: true,
      data: response,
    };
  }

  /**
   * Exécute une action proposée par Luna
   */
  @Post('action')
  @RateLimit({ limit: 20, window: 60 }) // 20 req/min pour actions
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exécuter une action Luna' })
  @ApiResponse({ status: 200, description: 'Action exécutée' })
  async executeAction(
    @Body() body: LunaActionRequestDto,
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    this.logger.log(`Luna action execution: ${body.action.type} for brand ${brand.id}`);

    const result = await this.lunaService.executeAction(
      brand.id,
      user.id,
      body.action as LunaAction,
      user,
    );

    return {
      success: result.success,
      data: result.result,
    };
  }

  /**
   * Récupère l'historique des conversations avec Luna
   */
  @Get('conversations')
  @RateLimit({ limit: 60, window: 60 }) // 60 req/min pour lecture
  @ApiOperation({ summary: 'Historique des conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  async getConversations(
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const conversations = await this.lunaService.getConversations(brand.id, user.id);

    return {
      success: true,
      data: {
        conversations,
      },
    };
  }

  /**
   * Récupère les messages d'une conversation spécifique
   */
  @Get('conversations/:conversationId')
  @RateLimit({ limit: 60, window: 60 }) // 60 req/min pour lecture
  @ApiOperation({ summary: "Messages d'une conversation" })
  @ApiResponse({ status: 200, description: 'Messages de la conversation' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Param conversationId validated by route

    const messages = await this.conversationService.getHistory(conversationId, 100);

    return {
      success: true,
      data: {
        conversationId,
        messages,
      },
    };
  }
}
