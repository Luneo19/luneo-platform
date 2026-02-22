// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FallbackLLMService } from '../../services/fallback-llm.service';
import { PromptSecurityService } from '../../services/prompt-security.service';
import { TicketContextService } from '../../services/ticket-context.service';
import { KnowledgeBaseAIService } from '../../services/knowledge-base-ai.service';
import { TicketRoutingService } from '../../services/ticket-routing.service';
import { SLAEngineService } from '../../services/sla-engine.service';
import { AuditTrailService } from '../../services/audit-trail.service';
import { AIResponseStatus, Prisma, TicketSentiment, TicketCategory } from '@prisma/client';
import { PROMETHEUS_THRESHOLDS } from '../../orion.constants';

export interface AnalysisResult {
  category: string;
  priority: string;
  sentiment: string;
  language: string;
  summary: string;
  suggestedActions: string[];
  confidenceScore: number;
}

export interface GenerationResult {
  content: string;
  confidenceScore: number;
  confidenceFactors: Record<string, number>;
  modelUsed: string;
  tokensUsed: number;
  latencyMs: number;
}

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly llm: FallbackLLMService,
    private readonly security: PromptSecurityService,
    private readonly ticketContext: TicketContextService,
    private readonly knowledgeBase: KnowledgeBaseAIService,
    private readonly routing: TicketRoutingService,
    private readonly slaEngine: SLAEngineService,
    private readonly auditTrail: AuditTrailService,
  ) {
    this.registerEventListeners();
  }

  private registerEventListeners() {
    this.eventEmitter.on('ticket.created', async (payload: { ticketId: string }) => {
      try {
        await this.processNewTicket(payload.ticketId);
      } catch (error) {
        this.logger.error(
          `Failed to process new ticket ${payload.ticketId}: ${error}`,
        );
      }
    });
  }

  async processNewTicket(ticketId: string) {
    this.logger.log(`Processing new ticket: ${ticketId}`);

    const analysis = await this.analyzeTicket(ticketId);

    await this.routing.routeTicket(ticketId, analysis);
    await this.slaEngine.calculateSLADeadline(ticketId);

    if (analysis.confidenceScore >= PROMETHEUS_THRESHOLDS.MIN_CONFIDENCE_FOR_AUTO_GENERATE) {
      await this.generateResponse(ticketId);
    }

    this.eventEmitter.emit('orion.ticket.processed', {
      ticketId,
      analysis,
    });
  }

  async analyzeTicket(ticketId: string): Promise<AnalysisResult> {
    const context = await this.ticketContext.gatherContext(ticketId);
    const contextStr = this.ticketContext.formatContextForLLM(context);

    const sanitized = this.security.sanitizeInput(contextStr);
    if (sanitized.blocked) {
      this.logger.warn(`Blocked input for ticket ${ticketId}: ${sanitized.threats.join(', ')}`);
      return this.defaultAnalysis();
    }

    try {
      const result = await this.llm.complete({
        messages: [
          {
            role: 'system',
            content: `Tu es un analyste de support technique expert pour Luneo, une plateforme SaaS de design e-commerce.
Analyse le ticket et retourne un JSON avec exactement ces champs:
{
  "category": "TECHNICAL|BILLING|ACCOUNT|FEATURE_REQUEST|BUG|INTEGRATION|OTHER",
  "priority": "LOW|MEDIUM|HIGH|URGENT|CRITICAL",
  "sentiment": "VERY_NEGATIVE|NEGATIVE|NEUTRAL|POSITIVE|VERY_POSITIVE",
  "language": "code ISO 639-1",
  "summary": "résumé en 1-2 phrases",
  "suggestedActions": ["action1", "action2"],
  "confidenceScore": 0-100
}`,
          },
          {
            role: 'user',
            content: sanitized.clean,
          },
        ],
        temperature: 0.1,
        maxTokens: 500,
        responseFormat: 'json',
      });

      const analysis: AnalysisResult = JSON.parse(result.content);

      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          sentiment: analysis.sentiment as unknown as TicketSentiment,
          language: analysis.language,
          aiAnalysis: analysis as unknown as Prisma.InputJsonValue,
          confidenceScore: analysis.confidenceScore,
          category: analysis.category as unknown as TicketCategory,
        },
      });

      await this.auditTrail.logAIDecision({
        agentType: 'prometheus',
        action: 'ticket_analyzed',
        ticketId,
        modelUsed: result.model,
        confidence: analysis.confidenceScore,
        decision: `category=${analysis.category}, priority=${analysis.priority}`,
      });

      return analysis;
    } catch (error) {
      this.logger.error(`Analysis failed for ticket ${ticketId}: ${error}`);
      return this.defaultAnalysis();
    }
  }

  async generateResponse(ticketId: string): Promise<GenerationResult> {
    const context = await this.ticketContext.gatherContext(ticketId);
    const contextStr = this.ticketContext.formatContextForLLM(context);

    const kbArticles = await this.knowledgeBase.searchRelevantArticles(
      `${context.ticket.subject} ${context.ticket.description}`,
      context.ticket.category,
    );
    const kbContext = this.knowledgeBase.formatForLLM(kbArticles);

    for (const article of kbArticles) {
      await this.knowledgeBase.recordArticleUsage(article.id);
    }

    const result = await this.llm.complete({
      messages: [
        {
          role: 'system',
          content: `Tu es un agent de support Luneo, professionnel et empathique.
Rédige une réponse au ticket en utilisant le contexte et la base de connaissances fournis.
La réponse doit être:
- Personnalisée avec le nom du client si disponible
- Précise et basée sur les informations disponibles
- Proposer des étapes concrètes de résolution
- En ${context.ticket.language || 'français'}
- Ne jamais mentionner que tu es une IA
- Ne jamais inventer d'informations techniques`,
        },
        {
          role: 'user',
          content: `${contextStr}\n\n${kbContext}\n\nRédige une réponse appropriée pour ce ticket.`,
        },
      ],
      temperature: 0.4,
      maxTokens: 1500,
    });

    const outputValidation = this.security.validateOutput(result.content);
    let finalContent = result.content;
    if (!outputValidation.valid) {
      finalContent = this.security.redactPII(result.content);
      this.logger.warn(
        `Output validation issues for ticket ${ticketId}: ${outputValidation.issues.join(', ')}`,
      );
    }

    const confidenceFactors = this.calculateConfidenceFactors(
      context,
      kbArticles.length,
      result.tokensUsed,
    );
    const confidenceScore = Math.round(
      Object.values(confidenceFactors).reduce((a, b) => a + b, 0) /
        Object.keys(confidenceFactors).length,
    );

    await this.prisma.aITicketResponse.create({
      data: {
        ticketId,
        modelUsed: result.model,
        generatedContent: finalContent,
        confidenceScore,
        confidenceFactors: confidenceFactors as unknown as Prisma.InputJsonValue,
        status: confidenceScore >= PROMETHEUS_THRESHOLDS.AUTO_APPROVE_CONFIDENCE ? AIResponseStatus.APPROVED : AIResponseStatus.PENDING,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
      },
    });

    await this.auditTrail.logAIDecision({
      agentType: 'prometheus',
      action: 'response_generated',
      ticketId,
      modelUsed: result.model,
      confidence: confidenceScore,
      decision: confidenceScore >= PROMETHEUS_THRESHOLDS.AUTO_APPROVE_CONFIDENCE ? 'auto_approved' : 'pending_review',
    });

    return {
      content: finalContent,
      confidenceScore,
      confidenceFactors,
      modelUsed: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    };
  }

  async reanalyzeTicket(ticketId: string) {
    return this.analyzeTicket(ticketId);
  }

  async getStats() {
    const [
      totalResponses,
      pendingReview,
      autoApproved,
      avgConfidence,
      avgLatency,
    ] = await Promise.all([
      this.prisma.aITicketResponse.count(),
      this.prisma.aITicketResponse.count({
        where: { status: AIResponseStatus.PENDING },
      }),
      this.prisma.aITicketResponse.count({
        where: { status: AIResponseStatus.APPROVED },
      }),
      this.prisma.aITicketResponse.aggregate({
        _avg: { confidenceScore: true },
      }),
      this.prisma.aITicketResponse.aggregate({
        _avg: { latencyMs: true },
      }),
    ]);

    return {
      totalResponses,
      pendingReview,
      autoApproved,
      avgConfidence: Math.round(avgConfidence._avg.confidenceScore || 0),
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
      providers: this.llm.getProvidersStatus(),
    };
  }

  private calculateConfidenceFactors(
    context: { messages?: unknown[]; customer?: { totalTickets?: number }; brand?: unknown },
    kbArticleCount: number,
    tokensUsed: number,
  ): Record<string, number> {
    const T = PROMETHEUS_THRESHOLDS;
    return {
      contextRichness: Math.min(
        100,
        (context.messages?.length || 0) * T.CONTEXT_MESSAGE_WEIGHT +
          ((context.customer?.totalTickets ?? 0) > 0 ? T.CONTEXT_CUSTOMER_BONUS : 0) +
          (context.brand ? T.CONTEXT_BRAND_BONUS : 0),
      ),
      kbCoverage: Math.min(100, kbArticleCount * T.KB_ARTICLE_WEIGHT),
      responseCompleteness: Math.min(100, tokensUsed > T.RESPONSE_TOKEN_THRESHOLD ? T.RESPONSE_COMPLETE_SCORE : T.RESPONSE_INCOMPLETE_SCORE),
      customerHistory:
        (context.customer?.totalTickets ?? 0) > T.CUSTOMER_HISTORY_THRESHOLD
          ? T.CUSTOMER_HISTORY_HIGH
          : (context.customer?.totalTickets ?? 0) > 0
            ? T.CUSTOMER_HISTORY_MED
            : T.CUSTOMER_HISTORY_LOW,
    };
  }

  private defaultAnalysis(): AnalysisResult {
    return {
      category: 'OTHER',
      priority: 'MEDIUM',
      sentiment: 'NEUTRAL',
      language: 'fr',
      summary: 'Analyse automatique non disponible',
      suggestedActions: ['Revue manuelle requise'],
      confidenceScore: 0,
    };
  }
}
