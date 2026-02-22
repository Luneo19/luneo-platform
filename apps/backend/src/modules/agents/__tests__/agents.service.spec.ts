/**
 * AgentsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AgentStatus } from '@prisma/client';
import { AgentsService } from '../agents.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CreateAgentDto } from '../dto/create-agent.dto';

const mockPrisma = {
  agent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  agentTemplate: {
    findUnique: jest.fn(),
  },
  agentKnowledgeBase: {
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  knowledgeBase: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AgentsService', () => {
  let service: AgentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create agent successfully', async () => {
      const orgId = 'org-1';
      const dto: CreateAgentDto = {
        name: 'Test Agent',
        description: 'A test agent',
      };
      const mockOrg = { id: orgId, agentsUsed: 0, agentsLimit: 0 };
      const mockAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        organizationId: orgId,
        template: null,
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.agent.create.mockResolvedValue(mockAgent);
      mockPrisma.organization.update.mockResolvedValue({});

      const result = await service.create(orgId, dto);

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: orgId },
      });
      expect(mockPrisma.agent.create).toHaveBeenCalled();
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { agentsUsed: { increment: 1 } },
      });
    });

    it('should throw ForbiddenException when quota exceeded (agentsUsed >= agentsLimit)', async () => {
      const orgId = 'org-1';
      const dto: CreateAgentDto = { name: 'Test Agent' };
      const mockOrg = { id: orgId, agentsUsed: 5, agentsLimit: 5 };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.create(orgId, dto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(orgId, dto)).rejects.toThrow(/Agent limit reached/);
      expect(mockPrisma.agent.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create('invalid-org', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.agent.create).not.toHaveBeenCalled();
    });

    it('should pre-fill systemPrompt from template when templateId provided', async () => {
      const orgId = 'org-1';
      const dto: CreateAgentDto = {
        name: 'Test Agent',
        templateId: 'tpl-1',
      };
      const mockOrg = { id: orgId, agentsUsed: 0, agentsLimit: 10 };
      const mockTemplate = {
        id: 'tpl-1',
        systemPrompt: 'Template system prompt',
        defaultModules: {},
        defaultModel: 'gpt-4o',
        defaultTemperature: 0.5,
        maxTokensPerReply: 2000,
      };
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.agentTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.agent.create.mockResolvedValue(mockAgent);
      mockPrisma.organization.update.mockResolvedValue({});

      await service.create(orgId, dto);

      expect(mockPrisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            systemPrompt: 'Template system prompt',
            model: 'gpt-4o',
            temperature: 0.5,
            maxTokensPerReply: 2000,
          }),
        }),
      );
    });

    it('should throw NotFoundException when template not found', async () => {
      const orgId = 'org-1';
      const dto: CreateAgentDto = {
        name: 'Test Agent',
        templateId: 'invalid-tpl',
      };
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: orgId,
        agentsUsed: 0,
        agentsLimit: 10,
      });
      mockPrisma.agentTemplate.findUnique.mockResolvedValue(null);

      await expect(service.create(orgId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(orgId, dto)).rejects.toThrow(/Template.*not found/);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const orgId = 'org-1';
      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1', template: null },
      ];
      mockPrisma.agent.findMany.mockResolvedValue(mockAgents);
      mockPrisma.agent.count.mockResolvedValue(1);

      const result = await service.findAll(orgId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockAgents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, deletedAt: null },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.findAll('org-1', { status: AgentStatus.ACTIVE });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: AgentStatus.ACTIVE }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return agent when found', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        organizationId: 'org-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);

      const result = await service.findOne('agent-1', 'org-1');

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.agent.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agent-1', organizationId: 'org-1', deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('missing', 'org-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('missing', 'org-1'),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('update', () => {
    it('should update agent fields', async () => {
      const existingAgent = {
        id: 'agent-1',
        name: 'Old Name',
        organizationId: 'org-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      const updatedAgent = {
        ...existingAgent,
        name: 'New Name',
      };
      mockPrisma.agent.findFirst.mockResolvedValue(existingAgent);
      mockPrisma.agent.update.mockResolvedValue(updatedAgent);

      const result = await service.update('agent-1', 'org-1', { name: 'New Name' });

      expect(result).toEqual(updatedAgent);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { name: 'New Name' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.update('missing', 'org-1', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.agent.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete agent (sets deletedAt + ARCHIVED status) and decrement agentsUsed', async () => {
      const existingAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        organizationId: 'org-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      const mockOrg = { id: 'org-1', agentsUsed: 2 };
      const updatedAgent = {
        ...existingAgent,
        deletedAt: expect.any(Date),
        status: AgentStatus.ARCHIVED,
      };

      mockPrisma.agent.findFirst.mockResolvedValue(existingAgent);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.agent.update.mockResolvedValue(updatedAgent);
      mockPrisma.organization.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (promises: unknown[]) => {
        const results = await Promise.all(
          (promises as Promise<unknown>[]).map((p) => p),
        );
        return results;
      });

      const result = await service.remove('agent-1', 'org-1');

      expect(result).toBeDefined();
      expect(mockPrisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agent-1' },
          data: {
            deletedAt: expect.any(Date),
            status: AgentStatus.ARCHIVED,
          },
        }),
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should activate agent when KBs exist', async () => {
      const agent = {
        id: 'agent-1',
        status: AgentStatus.DRAFT,
        agentKnowledgeBases: [{ id: 'akb-1' }],
        channels: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);
      mockPrisma.agent.update.mockResolvedValue({
        ...agent,
        status: AgentStatus.ACTIVE,
      });

      const result = await service.publish('agent-1', 'org-1');

      expect(result.status).toBe(AgentStatus.ACTIVE);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: expect.objectContaining({
          status: AgentStatus.ACTIVE,
          publishedAt: expect.any(Date),
        }),
      });
    });

    it('should throw BadRequestException when no KBs attached', async () => {
      const agent = {
        id: 'agent-1',
        status: AgentStatus.DRAFT,
        agentKnowledgeBases: [],
        channels: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);

      await expect(service.publish('agent-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('agent-1', 'org-1')).rejects.toThrow(
        /at least one knowledge base/,
      );
      expect(mockPrisma.agent.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when already active', async () => {
      const agent = {
        id: 'agent-1',
        status: AgentStatus.ACTIVE,
        agentKnowledgeBases: [{ id: 'akb-1' }],
        channels: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);

      await expect(service.publish('agent-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('agent-1', 'org-1')).rejects.toThrow(
        /Already active/,
      );
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.publish('missing', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('pause', () => {
    it('should pause active agent', async () => {
      const agent = {
        id: 'agent-1',
        status: AgentStatus.ACTIVE,
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);
      mockPrisma.agent.update.mockResolvedValue({
        ...agent,
        status: AgentStatus.PAUSED,
      });

      const result = await service.pause('agent-1', 'org-1');

      expect(result.status).toBe(AgentStatus.PAUSED);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { status: AgentStatus.PAUSED },
      });
    });

    it('should throw BadRequestException when agent not active', async () => {
      const agent = {
        id: 'agent-1',
        status: AgentStatus.DRAFT,
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);

      await expect(service.pause('agent-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.pause('agent-1', 'org-1')).rejects.toThrow(
        /Only active agents can be paused/,
      );
    });
  });

  describe('testAgent', () => {
    it('should return sandbox response', async () => {
      const agent = {
        id: 'agent-1',
        name: 'Test Agent',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);

      const result = await service.testAgent(
        'agent-1',
        'org-1',
        'Hello world',
      );

      expect(result.response).toContain('[Sandbox]');
      expect(result.response).toContain('Test Agent');
      expect(result.response).toContain('Hello world');
      expect(result.sources).toEqual([]);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('duplicate', () => {
    it('should duplicate agent with "Copy of" prefix and checks quota', async () => {
      const sourceAgent = {
        id: 'agent-1',
        name: 'Original Agent',
        description: 'Desc',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        tone: null,
        languages: ['fr'],
        greeting: null,
        systemPrompt: 'System',
        customInstructions: null,
        contextWindow: 10,
        maxTokensPerReply: 1000,
        autoEscalate: true,
        confidenceThreshold: 0.7,
        escalationEmail: null,
        fallbackMessage: null,
        businessHours: null,
        enableMemory: true,
        enableSentiment: true,
        modules: {},
        templateId: null,
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      const mockOrg = { id: 'org-1', agentsUsed: 2, agentsLimit: 10 };
      const duplicatedAgent = {
        id: 'agent-2',
        name: 'Copy of Original Agent',
      };

      mockPrisma.agent.findFirst.mockResolvedValue(sourceAgent);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.agent.create.mockResolvedValue(duplicatedAgent);
      mockPrisma.organization.update.mockResolvedValue({});

      const result = await service.duplicate('agent-1', 'org-1');

      expect(result.name).toBe('Copy of Original Agent');
      expect(mockPrisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Copy of Original Agent',
            status: AgentStatus.DRAFT,
          }),
        }),
      );
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { agentsUsed: { increment: 1 } },
      });
    });

    it('should throw ForbiddenException when quota exceeded on duplicate', async () => {
      const sourceAgent = {
        id: 'agent-1',
        name: 'Original',
        templateId: null,
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      } as never;
      const mockOrg = { id: 'org-1', agentsUsed: 5, agentsLimit: 5 };

      mockPrisma.agent.findFirst.mockResolvedValue(sourceAgent);
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.duplicate('agent-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.agent.create).not.toHaveBeenCalled();
    });
  });

  describe('attachKnowledgeBase', () => {
    it('should create link between agent and KB', async () => {
      const agent = {
        id: 'agent-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      };
      const kb = { id: 'kb-1', name: 'KB 1' };
      mockPrisma.agent.findFirst.mockResolvedValue(agent);
      mockPrisma.knowledgeBase.findFirst.mockResolvedValue(kb);
      mockPrisma.agentKnowledgeBase.upsert.mockResolvedValue({
        agentId: 'agent-1',
        knowledgeBaseId: 'kb-1',
      });

      const result = await service.attachKnowledgeBase(
        'agent-1',
        'org-1',
        'kb-1',
      );

      expect(result).toBeDefined();
      expect(mockPrisma.agentKnowledgeBase.upsert).toHaveBeenCalledWith({
        where: {
          agentId_knowledgeBaseId: { agentId: 'agent-1', knowledgeBaseId: 'kb-1' },
        },
        update: {},
        create: { agentId: 'agent-1', knowledgeBaseId: 'kb-1', priority: 0 },
      });
    });

    it('should throw NotFoundException when KB not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue({
        id: 'agent-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      });
      mockPrisma.knowledgeBase.findFirst.mockResolvedValue(null);

      await expect(
        service.attachKnowledgeBase('agent-1', 'org-1', 'invalid-kb'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.attachKnowledgeBase('agent-1', 'org-1', 'invalid-kb'),
      ).rejects.toThrow(/Knowledge base not found/);
      expect(mockPrisma.agentKnowledgeBase.upsert).not.toHaveBeenCalled();
    });
  });

  describe('detachKnowledgeBase', () => {
    it('should remove link between agent and KB', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue({
        id: 'agent-1',
        template: null,
        channels: [],
        agentKnowledgeBases: [],
      });
      mockPrisma.agentKnowledgeBase.delete.mockResolvedValue({});

      await service.detachKnowledgeBase('agent-1', 'org-1', 'kb-1');

      expect(mockPrisma.agentKnowledgeBase.delete).toHaveBeenCalledWith({
        where: {
          agentId_knowledgeBaseId: { agentId: 'agent-1', knowledgeBaseId: 'kb-1' },
        },
      });
    });
  });
});
