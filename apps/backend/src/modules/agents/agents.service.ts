import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { OrchestratorService, AgentExecutionResult } from '@/modules/orchestrator/orchestrator.service';
import { AgentStatus, Prisma } from '@prisma/client';
import { FlowExecutionEngine, type FlowNode, type FlowEdge } from '@/libs/flow/flow-execution-engine';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  async create(organizationId: string, dto: CreateAgentDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    if (org.agentsUsed >= org.agentsLimit) {
      throw new ForbiddenException(
        `Agent limit reached (${org.agentsLimit}). Upgrade your plan.`,
      );
    }

    const data: Prisma.AgentCreateInput = {
      organization: { connect: { id: organizationId } },
      name: dto.name,
      description: dto.description,
      model: dto.model ?? 'gpt-4o-mini',
      temperature: dto.temperature ?? 0.3,
      tone: dto.tone,
      languages: dto.languages ?? ['fr'],
      greeting: dto.greeting,
      modules: {},
      systemPrompt: dto.systemPrompt,
      customInstructions: dto.customInstructions,
      maxTokensPerReply: dto.maxTokensPerReply ?? 1000,
      autoEscalate: dto.autoEscalate ?? true,
      confidenceThreshold: dto.confidenceThreshold ?? 0.7,
      escalationEmail: dto.escalationEmail,
      fallbackMessage: dto.fallbackMessage,
      contextWindow: dto.contextWindow ?? 10,
      businessHours: dto.businessHours as Prisma.InputJsonValue ?? undefined,
      enableMemory: dto.enableMemory ?? true,
      enableSentiment: dto.enableSentiment ?? true,
    };

    if (dto.templateId) {
      const template = await this.prisma.agentTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (!template) {
        throw new NotFoundException(`Template "${dto.templateId}" not found`);
      }
      data.template = { connect: { id: dto.templateId } };
      data.systemPrompt = dto.systemPrompt ?? template.systemPrompt;
      data.modules = template.defaultModules as Prisma.InputJsonValue;
      data.model = dto.model ?? template.defaultModel;
      data.temperature = dto.temperature ?? template.defaultTemperature;
      data.maxTokensPerReply =
        dto.maxTokensPerReply ?? template.maxTokensPerReply ?? 1000;
    }

    this.logger.log(`Creating agent "${dto.name}" for org ${organizationId}`);

    const agent = await this.prisma.agent.create({
      data,
      include: { template: { select: { id: true, name: true, slug: true } } },
    });

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { agentsUsed: { increment: 1 } },
    });

    return agent;
  }

  async findAll(
    organizationId: string,
    options?: { page?: number; limit?: number; status?: AgentStatus },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (options?.status) {
      where.status = options.status;
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: { select: { id: true, name: true, slug: true, icon: true } },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data: agents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        template: { select: { id: true, name: true, slug: true, icon: true } },
        channels: true,
        agentKnowledgeBases: {
          include: { knowledgeBase: { select: { id: true, name: true, status: true, documentsCount: true } } },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent "${id}" not found`);
    }

    return agent;
  }

  async update(id: string, organizationId: string, dto: UpdateAgentDto) {
    await this.findOne(id, organizationId);

    const data: Prisma.AgentUpdateInput = {};
    const updatableFields = [
      'name',
      'description',
      'model',
      'temperature',
      'tone',
      'languages',
      'greeting',
      'systemPrompt',
      'customInstructions',
      'contextWindow',
      'maxTokensPerReply',
      'autoEscalate',
      'confidenceThreshold',
      'escalationEmail',
      'fallbackMessage',
      'businessHours',
      'enableMemory',
      'enableSentiment',
    ] as const;
    for (const field of updatableFields) {
      const value = dto[field];
      if (value !== undefined) {
        (data as Record<string, unknown>)[field] = value;
      }
    }

    return this.prisma.agent.update({
      where: { id },
      data,
      include: {
        template: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    const agentUpdate = this.prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date(), status: AgentStatus.ARCHIVED },
      include: { template: { select: { id: true, name: true, slug: true } } },
    });

    const updates: Prisma.PrismaPromise<unknown>[] = [agentUpdate];
    if (org && org.agentsUsed > 0) {
      updates.push(
        this.prisma.organization.update({
          where: { id: organizationId },
          data: { agentsUsed: { decrement: 1 } },
        }),
      );
    }

    const [agent] = await this.prisma.$transaction(updates);
    return agent;
  }

  async publish(id: string, organizationId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { agentKnowledgeBases: true, channels: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    if (agent.status === AgentStatus.ACTIVE) {
      throw new BadRequestException('Already active');
    }
    if (agent.agentKnowledgeBases.length === 0) {
      throw new BadRequestException(
        'Agent needs at least one knowledge base before activation',
      );
    }

    return this.prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.ACTIVE,
        publishedAt: new Date(),
      },
    });
  }

  async pause(id: string, organizationId: string) {
    const agent = await this.findOne(id, organizationId);

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new BadRequestException('Only active agents can be paused');
    }

    return this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.PAUSED },
    });
  }

  async testAgent(
    id: string,
    organizationId: string,
    message: string,
  ): Promise<{ response: string; sources: Array<{ chunkId: string; content: string; score: number; documentTitle: string }>; tokensIn: number; tokensOut: number; costUsd: number; latencyMs: number; model: string }> {
    const agent = await this.findOne(id, organizationId);
    const startTime = Date.now();

    // Create a temporary sandbox conversation
    const sandboxConversation = await this.prisma.conversation.create({
      data: {
        organizationId,
        agentId: id,
        channelType: 'API',
        visitorId: `sandbox_${Date.now()}`,
        visitorName: 'Sandbox Test',
        status: 'ACTIVE',
        tags: ['sandbox'],
      },
    });

    try {
      // Save the user message
      await this.prisma.message.create({
        data: {
          conversationId: sandboxConversation.id,
          role: 'USER',
          content: message,
        },
      });

      // Call the real orchestrator pipeline (RAG + LLM)
      const result: AgentExecutionResult = await this.orchestratorService.executeAgent(
        id,
        sandboxConversation.id,
        message,
      );

      return {
        response: result.content,
        sources: result.sources,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costUsd: result.costUsd,
        latencyMs: Date.now() - startTime,
        model: result.model,
      };
    } catch (error: unknown) {
      this.logger.error(`Sandbox test failed for agent ${id}`, error);
      return {
        response: agent.fallbackMessage || 'Desole, une erreur est survenue pendant le test.',
        sources: [],
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - startTime,
        model: agent.model,
      };
    } finally {
      // Clean up sandbox conversation (soft delete)
      await this.prisma.conversation.update({
        where: { id: sandboxConversation.id },
        data: { deletedAt: new Date(), status: 'CLOSED', tags: ['sandbox', 'cleaned'] },
      }).catch(() => {});
    }
  }

  async attachKnowledgeBase(
    agentId: string,
    organizationId: string,
    knowledgeBaseId: string,
  ) {
    await this.findOne(agentId, organizationId);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, organizationId, deletedAt: null },
    });
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }
    return this.prisma.agentKnowledgeBase.upsert({
      where: { agentId_knowledgeBaseId: { agentId, knowledgeBaseId } },
      update: {},
      create: { agentId, knowledgeBaseId, priority: 0 },
    });
  }

  async detachKnowledgeBase(
    agentId: string,
    organizationId: string,
    knowledgeBaseId: string,
  ) {
    await this.findOne(agentId, organizationId);
    return this.prisma.agentKnowledgeBase.delete({
      where: { agentId_knowledgeBaseId: { agentId, knowledgeBaseId } },
    });
  }

  async duplicate(id: string, organizationId: string) {
    const sourceAgent = await this.findOne(id, organizationId);

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    if (org.agentsUsed >= org.agentsLimit) {
      throw new ForbiddenException(
        `Agent limit reached (${org.agentsLimit}). Upgrade your plan.`,
      );
    }

    const createData: Prisma.AgentCreateInput = {
      organization: { connect: { id: organizationId } },
      name: `Copy of ${sourceAgent.name}`,
      description: sourceAgent.description,
      model: sourceAgent.model,
      temperature: sourceAgent.temperature,
      tone: sourceAgent.tone,
      languages: sourceAgent.languages,
      greeting: sourceAgent.greeting,
      systemPrompt: sourceAgent.systemPrompt,
      customInstructions: sourceAgent.customInstructions,
      contextWindow: sourceAgent.contextWindow,
      maxTokensPerReply: sourceAgent.maxTokensPerReply,
      autoEscalate: sourceAgent.autoEscalate,
      confidenceThreshold: sourceAgent.confidenceThreshold,
      escalationEmail: sourceAgent.escalationEmail,
      fallbackMessage: sourceAgent.fallbackMessage,
      businessHours: (sourceAgent.businessHours ?? undefined) as Prisma.InputJsonValue | undefined,
      enableMemory: sourceAgent.enableMemory,
      enableSentiment: sourceAgent.enableSentiment,
      modules: sourceAgent.modules as Prisma.InputJsonValue,
      status: AgentStatus.DRAFT,
    };
    if (sourceAgent.templateId) {
      createData.template = { connect: { id: sourceAgent.templateId } };
    }

    const agent = await this.prisma.agent.create({
      data: createData,
      include: { template: { select: { id: true, name: true, slug: true } } },
    });

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { agentsUsed: { increment: 1 } },
    });

    return agent;
  }

  // ═══════════════ Flow Builder Methods ═══════════════

  async saveFlow(
    agentId: string,
    organizationId: string,
    flowData: { nodes: unknown[]; edges: unknown[] },
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId, deletedAt: null },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        flowData: flowData as Prisma.InputJsonValue,
        flowVersion: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return { data: updated };
  }

  async testFlow(
    agentId: string,
    organizationId: string,
    message: string,
    flow: { nodes: unknown[]; edges: unknown[] },
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId, deletedAt: null },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const engine = new FlowExecutionEngine();
    const result = await engine.execute(
      { nodes: flow.nodes as FlowNode[], edges: flow.edges as FlowEdge[] },
      message,
      { sandbox: true, traceExecution: true, agentId },
    );

    return {
      data: {
        response: result.finalResponse || 'Aucune réponse générée par le flow.',
        sources: result.sources,
        executionTrace: result.trace,
      },
    };
  }

  async publishFlow(
    agentId: string,
    organizationId: string,
    flow: { nodes: unknown[]; edges: unknown[] },
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, organizationId, deletedAt: null },
    });
    if (!agent) throw new NotFoundException('Agent not found');

    const nodes = flow.nodes as FlowNode[];
    const hasTrigger = nodes.some((n) => n.data?.block?.category === 'TRIGGER');
    if (!hasTrigger) {
      throw new BadRequestException('Flow must contain at least one Trigger block');
    }

    const updated = await this.prisma.agent.update({
      where: { id: agentId },
      data: {
        flowData: flow as Prisma.InputJsonValue,
        flowVersion: { increment: 1 },
        status: AgentStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Agent ${agentId} published with flow version ${updated.flowVersion}`);
    return { data: updated };
  }
}
