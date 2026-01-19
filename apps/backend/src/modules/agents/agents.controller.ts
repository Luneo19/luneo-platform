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
import { z } from 'zod';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
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
// DTOs avec Validation Zod
// ============================================================================

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  agentType: z.enum(['luna', 'aria', 'nova', 'auto']).default('auto'),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    productId: z.string().uuid().optional(),
    currentPage: z.string().optional(),
    userLocale: z.string().default('fr'),
  }).optional(),
  options: z.object({
    stream: z.boolean().default(false),
    maxTokens: z.number().min(100).max(32000).default(4096),
    temperature: z.number().min(0).max(2).default(0.7),
  }).optional(),
});

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
  @ApiOperation({ summary: 'Chat avec un agent IA' })
  @ApiResponse({ status: 200, description: 'Réponse de l\'agent' })
  async chat(
    @CurrentBrand() brand: { id: string; plan?: string } | null,
    @CurrentUser() user: CurrentUserType,
    @Body() body: unknown,
  ) {
    // 1. Validation
    const validated = ChatRequestSchema.parse(body);
    const brandId = brand?.id;
    const planId = brand?.plan;

    // 2. Vérifier usage (Usage Guardian)
    const usageCheck = await this.usageGuard.checkUsageBeforeCall(
      brandId,
      user.id,
      planId,
      validated.options?.maxTokens,
    );

    if (!usageCheck.allowed) {
      throw new BadRequestException(usageCheck.reason || 'Usage limit exceeded');
    }

    // 3. Router vers l'agent approprié
    const agentType = this.orchestrator.routeToAgent(
      validated.agentType,
      {
        message: validated.message,
        brandId,
        userId: user.id,
        currentPage: validated.context?.currentPage,
        productId: validated.context?.productId,
      },
    );

    try {
      // 4. Appeler l'agent approprié
      let response;

      switch (agentType) {
        case 'luna':
          response = await this.lunaService.chat({
            brandId: brandId!,
            userId: user.id,
            message: validated.message,
            conversationId: validated.conversationId,
            context: validated.context,
          });
          break;

        case 'aria':
          if (!validated.context?.productId) {
            throw new BadRequestException('Product ID required for Aria');
          }
          response = await this.ariaService.chat({
            sessionId: `session_${Date.now()}`,
            productId: validated.context.productId,
            brandId,
            message: validated.message,
            context: validated.context ? {
              occasion: validated.context.currentPage,
              language: validated.context.userLocale || 'fr',
            } : undefined,
          });
          break;

        case 'nova':
        default:
          response = await this.novaService.chatWithContext({
            message: validated.message,
            brandId,
            userId: user.id,
            conversationId: validated.conversationId,
            context: validated.context,
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
