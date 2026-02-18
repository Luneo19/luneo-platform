/**
 * @fileoverview Controller principal pour les agents IA
 * @module AgentsController
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod
 * - ✅ Guards d'authentification
 * - ✅ Usage Guardian intégré
 * - ✅ AI Monitor intégré
 * - ✅ Gestion d'erreurs standardisée
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { AgentOrchestratorService } from './services/agent-orchestrator.service';
import { AgentUsageGuardService } from './services/agent-usage-guard.service';
import { LLMRouterService } from './services/llm-router.service';
import { ConversationService } from './services/conversation.service';
import { LunaService } from './luna/luna.service';
import { AriaService } from './aria/aria.service';
import { NovaService } from './nova/nova.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Agents IA')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly orchestrator: AgentOrchestratorService,
    private readonly usageGuard: AgentUsageGuardService,
    private readonly conversationService: ConversationService,
    private readonly lunaService: LunaService,
    private readonly ariaService: AriaService,
    private readonly novaService: NovaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chat avec un agent (point d'entrée principal)
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Chat avec un agent IA' })
  @ApiResponse({ status: 200, description: 'Réponse de l\'agent' })
  async chat(
    @CurrentBrand() brand: { id: string; plan?: string } | null,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChatRequestDto,
  ) {
    const agentType = dto.agentType ?? 'auto';
    const brandId = brand?.id;
    const planId = brand?.plan;

    const usageCheck = await this.usageGuard.checkUsageBeforeCall(
      brandId,
      user.id,
      planId,
      dto.options?.maxTokens ?? 4096,
    );

    if (!usageCheck.allowed) {
      throw new BadRequestException(usageCheck.reason || 'Usage limit exceeded');
    }

    const routedAgentType = this.orchestrator.routeToAgent(
      agentType,
      {
        message: dto.message,
        brandId,
        userId: user.id,
        currentPage: dto.context?.currentPage,
        productId: dto.context?.productId,
      },
    );

    try {
      let response;

      switch (routedAgentType) {
        case 'luna':
          response = await this.lunaService.chat({
            brandId: brandId!,
            userId: user.id,
            message: dto.message,
            conversationId: dto.conversationId,
            context: dto.context,
          });
          break;

        case 'aria':
          if (!dto.context?.productId) {
            throw new BadRequestException('Product ID required for Aria');
          }
          response = await this.ariaService.chat({
            sessionId: `session_${Date.now()}`,
            productId: dto.context.productId,
            brandId,
            message: dto.message,
            context: dto.context ? {
              occasion: dto.context.currentPage,
              language: dto.context.userLocale ?? 'fr',
            } : undefined,
          });
          break;

        case 'nova':
        default:
          response = await this.novaService.chatWithContext({
            message: dto.message,
            brandId,
            userId: user.id,
            conversationId: dto.conversationId,
            context: dto.context,
          });
          break;
      }

      return response;
    } catch (error) {
      this.logger.error('Agent chat failed', error);
      throw error;
    }
  }

  /**
   * Récupère le statut d'usage
   */
  @Get('usage')
  @ApiOperation({ summary: 'Récupère le statut d\'usage IA' })
  @ApiResponse({ status: 200, description: 'Statut d\'usage' })
  async getUsage(
    @CurrentBrand() brand: { id: string; plan?: string } | null,
    @CurrentUser() user: CurrentUserType,
  ) {
    const brandId = brand?.id;
    const planId = brand?.plan;

    const status = await this.usageGuard.getUsageStatus(
      brandId,
      user.id,
      planId,
    );

    return status;
  }

  /**
   * Liste les conversations d'un utilisateur
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Liste des conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  async getConversations(
    @CurrentBrand() brand: { id: string } | null,
    @CurrentUser() user: CurrentUserType,
    @Query('agentType') agentType?: string,
    @Query('limit') limit?: string,
  ) {
    const conversations = await this.conversationService.listConversations({
      userId: user.id,
      brandId: brand?.id,
      agentType,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return { success: true, data: conversations };
  }

  /**
   * Récupère une conversation spécifique avec ses messages
   */
  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Détails d\'une conversation' })
  @ApiResponse({ status: 200, description: 'Conversation avec messages' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const conversation = await this.conversationService.getConversation(conversationId, user.id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true, data: conversation };
  }

  /**
   * Supprime une conversation
   */
  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une conversation' })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.conversationService.deleteConversation(conversationId, user.id);
  }

  /**
   * Soumet un feedback sur une réponse agent
   */
  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soumettre un feedback' })
  @ApiResponse({ status: 200, description: 'Feedback enregistré' })
  async submitFeedback(
    @Body() body: {
      messageId: string;
      conversationId: string;
      rating: 'positive' | 'negative';
      comment?: string;
      agentType?: string;
    },
    @CurrentUser() user: CurrentUserType,
    @CurrentBrand() brand: { id: string } | null,
  ) {
    this.logger.log(`Agent feedback received: messageId=${body.messageId}, rating=${body.rating}, userId=${user.id}, agentType=${body.agentType || 'unknown'}`);

    try {
      await this.prisma.aIUsageLog.create({
        data: {
          userId: user.id,
          brandId: brand?.id,
          operation: 'agent_feedback',
          provider: body.agentType || 'unknown',
          model: 'feedback',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costCents: 0,
          latencyMs: 0,
          success: true,
          metadata: {
            messageId: body.messageId,
            conversationId: body.conversationId,
            rating: body.rating,
            comment: body.comment,
            agentType: body.agentType,
          },
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to persist feedback: ${error}`);
    }

    return { success: true, message: 'Feedback enregistré' };
  }
}
