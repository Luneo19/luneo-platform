import { Injectable } from '@nestjs/common';
import { Agent, Conversation, PlatformRole } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { RagService, RagSource } from '@/modules/rag/rag.service';
import { MemoryService } from '@/modules/memory/memory.service';

export interface ConversationContext {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryContext: string;
  ragContext: string;
  sources: RagSource[];
  verticalContext: string;
}

@Injectable()
export class ContextBuilderService {
  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly ragService: RagService,
    private readonly memoryService: MemoryService,
  ) {}

  async buildContext(
    agent: Agent & { agentKnowledgeBases: Array<{ knowledgeBase: { id: string } }> },
    conversation: Pick<Conversation, 'id' | 'organizationId' | 'contactId'>,
    userMessage: string,
  ): Promise<ConversationContext> {
    const historyRows = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: agent.contextWindow ?? 10,
      select: {
        role: true,
        content: true,
      },
    });

    const history = historyRows
      .reverse()
      .filter((message) => message.role === 'USER' || message.role === 'ASSISTANT')
      .map((message) => ({
        role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
        content: message.content,
      }));

    let memoryContext = '';
    if (conversation.contactId) {
      try {
        const memory = await this.memoryService.getContactMemory(
          {
            id: 'orchestrator',
            email: 'orchestrator@luneo.local',
            role: PlatformRole.ADMIN,
            organizationId: agent.organizationId,
          },
          conversation.contactId,
        );
        memoryContext = memory.episodicFacts
          .slice(0, 3)
          .map((fact, index) => `Fact ${index + 1}: ${fact.summary ?? 'N/A'}`)
          .join('\n');
      } catch {
        memoryContext = '';
      }
    }

    let ragContext = '';
    let sources: RagSource[] = [];
    if (agent.agentKnowledgeBases.length > 0) {
      const retrieved = await this.ragService.retrieveContext(userMessage, agent.id, {
        topK: 5,
        minScore: agent.confidenceThreshold ?? 0.7,
      });
      ragContext = retrieved.context;
      sources = retrieved.sources;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: conversation.organizationId },
      select: {
        verticalTemplate: {
          select: {
            slug: true,
            intentCategories: true,
            industryVocabulary: true,
            kpiDefinitions: true,
          },
        },
      },
    });

    const vertical = organization?.verticalTemplate;
    const verticalContext = vertical
      ? `Verticale=${vertical.slug}\nIntents=${JSON.stringify(vertical.intentCategories ?? [])}\nVocabulaire=${JSON.stringify(vertical.industryVocabulary ?? [])}\nKPI=${JSON.stringify(vertical.kpiDefinitions ?? [])}`
      : '';

    return {
      history,
      memoryContext,
      ragContext,
      sources,
      verticalContext,
    };
  }
}
