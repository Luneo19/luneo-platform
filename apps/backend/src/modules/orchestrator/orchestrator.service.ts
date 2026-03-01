import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RagService, RagSource } from '@/modules/rag/rag.service';
import { LlmService } from '@/libs/llm/llm.service';
import { LlmProvider } from '@/libs/llm/llm.interface';
import { PlatformRole } from '@prisma/client';
import { QuotasService } from '@/modules/quotas/quotas.service';
import { UsageMeteringService } from '@/modules/usage-billing/usage-metering.service';
import { WorkflowEngineService } from './workflow/workflow-engine.service';
import { MemoryService } from '@/modules/memory/memory.service';
import { JOB_TYPES, QueuesService } from '@/libs/queues';
import { createHash } from 'crypto';
import { IntentClassifierService } from './intent-classifier.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptEngineService } from './prompt-engine.service';
import { AgentRouterService } from './agent-router.service';
import { OrchestratorLanguageService } from './language.service';

export interface AgentExecutionResult {
  content: string;
  sources: RagSource[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  model: string;
}

interface EscalationDecision {
  shouldEscalate: boolean;
  confidence: number;
  reason?: string;
  priority?: 'low' | 'normal' | 'high';
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private static readonly BLACKLIST_CONFIG_KEY = 'ai:blacklisted_prompts';

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly ragService: RagService,
    private readonly llmService: LlmService,
    private readonly quotasService: QuotasService,
    private readonly usageMeteringService: UsageMeteringService,
    private readonly workflowEngineService: WorkflowEngineService,
    private readonly memoryService: MemoryService,
    private readonly queuesService: QueuesService,
    private readonly intentClassifierService: IntentClassifierService,
    private readonly contextBuilderService: ContextBuilderService,
    private readonly promptEngineService: PromptEngineService,
    private readonly agentRouterService: AgentRouterService,
    private readonly languageService: OrchestratorLanguageService,
  ) {}

  async executeAgent(
    agentId: string,
    conversationId: string,
    userMessage: string,
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    this.logger.log(
      `Exécution agent ${agentId} pour conversation ${conversationId}`,
    );

    // 1. Load agent config
    let agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        agentKnowledgeBases: { include: { knowledgeBase: true } },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} introuvable`);
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, organizationId: true, contactId: true, channelType: true },
    });
    if (!conversation || conversation.organizationId !== agent.organizationId) {
      throw new NotFoundException(`Conversation ${conversationId} introuvable`);
    }

    const latestUserMessage = await this.prisma.message.findFirst({
      where: {
        conversationId,
        role: 'USER',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    const requestFingerprint = this.computeRequestFingerprint(
      agentId,
      conversationId,
      userMessage,
      latestUserMessage?.id,
    );

    const detectedLanguage = this.languageService.detectLanguage(userMessage);
    const intentClassification = this.intentClassifierService.classify(
      userMessage,
      this.extractScopedIntents(agent.scope),
    );

    const routedAgentId = await this.agentRouterService.route({
      organizationId: agent.organizationId,
      currentAgentId: agent.id,
      channelType: conversation.channelType,
      intent: intentClassification.intent,
    });

    if (routedAgentId !== agent.id) {
      const routedAgent = await this.prisma.agent.findUnique({
        where: { id: routedAgentId },
        include: {
          agentKnowledgeBases: { include: { knowledgeBase: true } },
        },
      });
      if (routedAgent) {
        agent = routedAgent;
      }
    }

    await this.quotasService.enforceQuota(agent.organizationId, 'messages_ai', 1);

    const moderation = await this.applyPromptGuardrails(userMessage);
    if (moderation.blocked) {
      const fallback = agent.fallbackMessage || "Je ne peux pas traiter cette demande. Reformulez votre question.";
      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fallback,
          model: 'guardrail-blacklist',
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          latencyMs: Date.now() - startTime,
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 1 },
          agentMessageCount: { increment: 1 },
        },
      });
      this.logger.warn(`Prompt blocked by guardrail for agent ${agentId}: ${moderation.term}`);
      return {
        content: fallback,
        sources: [],
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        model: 'guardrail-blacklist',
      };
    }

    const flowData = agent.flowData as { nodes?: unknown[] } | null;
    const hasWorkflow = Array.isArray(flowData?.nodes) && flowData.nodes.length > 0;

    if (hasWorkflow) {
      const workflowResult = await this.workflowEngineService.executeWorkflow(
        agentId,
        conversationId,
        userMessage,
      );

      const workflowContent = workflowResult.response?.trim()
        ? workflowResult.response
        : "Je n'ai pas pu determiner une reponse dans ce workflow.";

      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: workflowContent,
          model: 'workflow-engine',
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          latencyMs: Date.now() - startTime,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: { increment: 1 },
          agentMessageCount: { increment: 1 },
        },
      });

      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          totalMessages: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });

      await this.usageMeteringService.recordUsage({
        organizationId: agent.organizationId,
        type: 'MESSAGE',
        quantity: 1,
        agentId,
        conversationId,
        source: 'workflow-engine',
        idempotencyKey: this.buildDeterministicUsageKey(
          conversationId,
          'workflow',
          requestFingerprint,
        ),
        metadata: {
          actionsExecuted: workflowResult.actionsExecuted.length,
        },
      });

      const workflowEscalation = this.evaluateEscalation({
        confidenceThreshold: agent.confidenceThreshold ?? 0.7,
        userMessage,
        responseContent: workflowContent,
        sources: [],
        hasKnowledgeBase: agent.agentKnowledgeBases.length > 0,
      });
      await this.maybeEscalateConversation(
        conversationId,
        workflowEscalation,
        userMessage,
        agent.escalationMessage ?? undefined,
      );

      return {
        content: workflowContent,
        sources: [],
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        model: 'workflow-engine',
      };
    }

    const context = await this.contextBuilderService.buildContext(
      agent,
      conversation,
      userMessage,
    );
    const systemPrompt = this.promptEngineService.buildPrompt({
      basePrompt: agent.systemPrompt ?? 'Tu es un assistant IA professionnel.',
      customInstructions: agent.customInstructions,
      tone: agent.tone,
      languageInstruction: this.languageService.buildLanguageInstruction(detectedLanguage),
      context,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.history,
      { role: 'user' as const, content: userMessage },
    ];

    // 6. Call LLM
    const completion = await this.llmService.complete({
      model: agent.model,
      messages,
      temperature: agent.temperature,
      maxTokens: agent.maxTokensPerReply,
      timeoutMs: 20000,
      retryCount: 1,
      fallbackProviders: [
        LlmProvider.OPENAI,
        LlmProvider.ANTHROPIC,
        LlmProvider.GOOGLE,
      ],
    });

    // 7. Save assistant message to DB
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: completion.content,
        model: completion.model,
        tokensIn: completion.tokensIn,
        tokensOut: completion.tokensOut,
        costUsd: completion.costUsd,
        latencyMs: Date.now() - startTime,
        confidence: this.computeResponseConfidence(
          context.sources,
          completion.content,
          agent.confidenceThreshold ?? 0.7,
          agent.agentKnowledgeBases.length > 0,
        ),
        intent: intentClassification.intent,
        sentiment: this.computeSentiment(userMessage),
        sourcesUsed:
          context.sources.length > 0
            ? (context.sources as unknown as object)
            : undefined,
        chunksUsed: context.sources.map((s) => s.chunkId),
      },
    });

    // 8. Update conversation stats
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        agentMessageCount: { increment: 1 },
        totalTokensIn: { increment: completion.tokensIn },
        totalTokensOut: { increment: completion.tokensOut },
        totalCostUsd: { increment: completion.costUsd ?? 0 },
        language: detectedLanguage,
        primaryIntent: intentClassification.intent,
        aiConfidence: intentClassification.confidence,
      },
    });

    // 9. Update agent stats
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        totalMessages: { increment: 1 },
        currentMonthSpend: { increment: completion.costUsd ?? 0 },
        lastActiveAt: new Date(),
      },
    });

    await this.usageMeteringService.recordUsage({
      organizationId: agent.organizationId,
      type: 'MESSAGE',
      quantity: 1,
      agentId,
      conversationId,
      source: 'orchestrator',
      idempotencyKey: this.buildDeterministicUsageKey(
        conversationId,
        completion.model,
        requestFingerprint,
      ),
      metadata: {
        tokensIn: completion.tokensIn,
        tokensOut: completion.tokensOut,
        costUsd: completion.costUsd ?? 0,
      },
    });

    const escalation = this.evaluateEscalation({
      confidenceThreshold: agent.confidenceThreshold ?? 0.7,
      userMessage,
      responseContent: completion.content,
      sources: context.sources,
      hasKnowledgeBase: agent.agentKnowledgeBases.length > 0,
    });
    await this.maybeEscalateConversation(
      conversationId,
      escalation,
      userMessage,
      agent.escalationMessage ?? undefined,
    );

    return {
      content: completion.content,
      sources: context.sources,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      costUsd: completion.costUsd ?? 0,
      latencyMs: Date.now() - startTime,
      model: completion.model,
    };
  }

  private async applyPromptGuardrails(
    userMessage: string,
  ): Promise<{ blocked: boolean; term?: string }> {
    const normalized = userMessage.toLowerCase();
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: OrchestratorService.BLACKLIST_CONFIG_KEY },
      select: { enabled: true, rules: true },
    });
    if (!flag?.enabled || !flag.rules) return { blocked: false };
    const terms = ((flag.rules as Record<string, unknown>).terms as string[] | undefined) ?? [];
    const matched = terms.find((term) => term && normalized.includes(term.toLowerCase()));
    if (!matched) return { blocked: false };
    return { blocked: true, term: matched };
  }

  private buildFullPrompt(
    agent: {
      systemPrompt?: string | null;
      customInstructions?: string | null;
      tone?: string | null;
      autoEscalate?: boolean;
    },
    context: string,
    memoryContext: string,
  ): string {
    let prompt = agent.systemPrompt ?? 'Tu es un assistant IA professionnel.';

    if (agent.customInstructions) {
      prompt += `\n\n${agent.customInstructions}`;
    }

    if (context) {
      prompt += `\n\nContexte (base de connaissances):\n${context}\n\nUtilise ces informations pour répondre. Cite tes sources.`;
    }

    if (memoryContext) {
      prompt += `\n\nMémoire client (faits conversationnels):\n${memoryContext}\n\nUtilise ces faits pour personnaliser la réponse sans inventer.`;
    }

    prompt += `\n\nTon: ${agent.tone ?? 'PROFESSIONAL'}`;
    prompt +=
      "\nLangue: réponds dans la langue du message de l'utilisateur";

    if (agent.autoEscalate) {
      prompt +=
        "\nSi tu n'es pas sûr de ta réponse, propose de transférer vers un humain.";
    }

    return prompt;
  }

  private extractScopedIntents(scope: unknown): string[] {
    if (!scope || typeof scope !== 'object') return [];
    const intents = (scope as Record<string, unknown>).intents;
    if (!Array.isArray(intents)) return [];
    return intents.filter((value): value is string => typeof value === 'string');
  }

  private computeSentiment(input: string): string {
    const normalized = input.toLowerCase();
    if (/(urgent|furious|colere|frustre|inadmissible)/.test(normalized)) return 'urgent';
    if (/(merci|parfait|super|excellent)/.test(normalized)) return 'positive';
    if (/(probleme|bug|retard|decu|insatisfait)/.test(normalized)) return 'negative';
    return 'neutral';
  }

  private computeRequestFingerprint(
    agentId: string,
    conversationId: string,
    userMessage: string,
    latestUserMessageId?: string,
  ): string {
    return createHash('sha256')
      .update(
        [
          agentId,
          conversationId,
          latestUserMessageId ?? '',
          userMessage.trim().toLowerCase(),
        ].join(':'),
      )
      .digest('hex');
  }

  private buildDeterministicUsageKey(
    conversationId: string,
    executionMode: string,
    requestFingerprint: string,
  ): string {
    return `${conversationId}:${executionMode}:${requestFingerprint}`;
  }

  private computeResponseConfidence(
    sources: RagSource[],
    responseContent: string,
    confidenceThreshold: number,
    hasKnowledgeBase: boolean,
  ): number {
    const sourceConfidence =
      sources.length > 0
        ? Math.min(
            1,
            Math.max(
              0,
              sources.reduce((acc, s) => acc + Number(s.score ?? 0), 0) / sources.length,
            ),
          )
        : hasKnowledgeBase
          ? confidenceThreshold * 0.6
          : 0.72;

    const uncertaintyMarkers = [
      "je ne sais pas",
      "je ne suis pas sur",
      "je ne suis pas certain",
      "information indisponible",
      "je n'ai pas trouve",
      'incertain',
    ];
    const normalized = responseContent.toLowerCase();
    const hasUncertainty = uncertaintyMarkers.some((marker) =>
      normalized.includes(marker),
    );

    const adjusted = hasUncertainty ? sourceConfidence - 0.25 : sourceConfidence;
    return Math.max(0, Math.min(1, Number(adjusted.toFixed(3))));
  }

  private evaluateEscalation(input: {
    confidenceThreshold: number;
    userMessage: string;
    responseContent: string;
    sources: RagSource[];
    hasKnowledgeBase: boolean;
  }): EscalationDecision {
    const confidence = this.computeResponseConfidence(
      input.sources,
      input.responseContent,
      input.confidenceThreshold,
      input.hasKnowledgeBase,
    );

    const message = input.userMessage.toLowerCase();
    const urgencyMarkers = ['urgent', 'plainte', 'remboursement', 'litige', 'avocat'];
    const isUrgent = urgencyMarkers.some((term) => message.includes(term));

    if (isUrgent && confidence < Math.max(0.75, input.confidenceThreshold)) {
      return {
        shouldEscalate: true,
        confidence,
        reason: 'urgent_low_confidence',
        priority: 'high',
      };
    }

    if (confidence < input.confidenceThreshold) {
      return {
        shouldEscalate: true,
        confidence,
        reason: 'low_confidence',
        priority: confidence < input.confidenceThreshold * 0.7 ? 'high' : 'normal',
      };
    }

    return { shouldEscalate: false, confidence };
  }

  private async maybeEscalateConversation(
    conversationId: string,
    decision: EscalationDecision,
    userMessage: string,
    escalationMessage?: string,
  ): Promise<void> {
    if (!decision.shouldEscalate) {
      return;
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
        escalationReason: decision.reason ?? 'low_confidence',
        escalationPriority: decision.priority ?? 'normal',
      },
    });

    await this.queuesService.addEscalationJob(
      JOB_TYPES.ESCALATION.ESCALATE_TO_HUMAN,
      {
        conversationId,
        reason: decision.reason ?? 'low_confidence',
        priority: decision.priority ?? 'normal',
        confidence: decision.confidence,
        userMessage,
        escalationMessage:
          escalationMessage ??
          "L'IA a detecte un besoin d'assistance humaine sur cette conversation.",
      },
      { jobId: `escalation:${conversationId}` },
    );
  }
}
