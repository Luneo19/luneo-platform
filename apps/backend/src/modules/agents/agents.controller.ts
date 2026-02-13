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
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
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
}
