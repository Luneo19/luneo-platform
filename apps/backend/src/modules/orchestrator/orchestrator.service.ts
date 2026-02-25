import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RagService, RagSource } from '@/modules/rag/rag.service';
import { LlmService } from '@/libs/llm/llm.service';
import { LlmProvider } from '@/libs/llm/llm.interface';

export interface AgentExecutionResult {
  content: string;
  sources: RagSource[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  model: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly ragService: RagService,
    private readonly llmService: LlmService,
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
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        agentKnowledgeBases: { include: { knowledgeBase: true } },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} introuvable`);
    }

    // 2. Load conversation history (last N messages based on contextWindow)
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: agent.contextWindow ?? 10,
    });
    const orderedHistory = history.reverse();

    // 3. RAG: retrieve context if agent has knowledge bases
    let context = '';
    let sources: RagSource[] = [];

    if (agent.agentKnowledgeBases.length > 0) {
      const retrieved = await this.ragService.retrieveContext(userMessage, agentId, {
        topK: 5,
        minScore: agent.confidenceThreshold ?? 0.7,
      });
      context = retrieved.context;
      sources = retrieved.sources;
    }

    // 4. Build prompt
    const systemPrompt = this.buildFullPrompt(agent, context);

    const historyMessages = orderedHistory
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...historyMessages,
      { role: 'user' as const, content: userMessage },
    ];

    // 5. Call LLM
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

    // 6. Save assistant message to DB
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
        sourcesUsed: sources.length > 0 ? (sources as unknown as object) : undefined,
        chunksUsed: sources.map((s) => s.chunkId),
      },
    });

    // 7. Update conversation stats
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        agentMessageCount: { increment: 1 },
        totalTokensIn: { increment: completion.tokensIn },
        totalTokensOut: { increment: completion.tokensOut },
        totalCostUsd: { increment: completion.costUsd ?? 0 },
      },
    });

    // 8. Update agent stats
    await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        totalMessages: { increment: 1 },
        currentMonthSpend: { increment: completion.costUsd ?? 0 },
        lastActiveAt: new Date(),
      },
    });

    return {
      content: completion.content,
      sources,
      tokensIn: completion.tokensIn,
      tokensOut: completion.tokensOut,
      costUsd: completion.costUsd ?? 0,
      latencyMs: Date.now() - startTime,
      model: completion.model,
    };
  }

  private buildFullPrompt(
    agent: {
      systemPrompt?: string | null;
      customInstructions?: string | null;
      tone?: string | null;
      autoEscalate?: boolean;
    },
    context: string,
  ): string {
    let prompt = agent.systemPrompt ?? 'Tu es un assistant IA professionnel.';

    if (agent.customInstructions) {
      prompt += `\n\n${agent.customInstructions}`;
    }

    if (context) {
      prompt += `\n\nContexte (base de connaissances):\n${context}\n\nUtilise ces informations pour répondre. Cite tes sources.`;
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
}
