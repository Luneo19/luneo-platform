import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { AgentsService } from '@/modules/agents/agents.service';
import { WebhooksService } from '@/modules/webhooks/webhooks.service';

describe('PublicApiService', () => {
  let service: PublicApiService;

  const prisma = {
    conversation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    apiKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const agentsService = {
    testAgent: jest.fn(),
  };

  const webhooksService = {
    dispatchEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicApiService,
        { provide: PrismaOptimizedService, useValue: prisma },
        { provide: AgentsService, useValue: agentsService },
        { provide: WebhooksService, useValue: webhooksService },
      ],
    }).compile();

    service = module.get(PublicApiService);
  });

  it('createOutboundMessage throw si conversation hors org', async () => {
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.createOutboundMessage({
        organizationId: 'org_1',
        conversationId: 'conv_404',
        content: 'hello',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('createOutboundMessage crée message et dispatch webhook', async () => {
    prisma.conversation.findFirst.mockResolvedValue({ id: 'conv_1' });
    prisma.message.create.mockResolvedValue({
      id: 'm_1',
      conversationId: 'conv_1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.createOutboundMessage({
      organizationId: 'org_1',
      conversationId: 'conv_1',
      content: 'Salut',
    });

    expect(prisma.message.create).toHaveBeenCalled();
    expect(webhooksService.dispatchEvent).toHaveBeenCalledWith(
      'org_1',
      'public.message.created',
      expect.objectContaining({
        messageId: 'm_1',
        conversationId: 'conv_1',
      }),
    );
    expect(result.id).toBe('m_1');
  });

  it('createApiKey applique defaults scopes/permissions', async () => {
    prisma.apiKey.create.mockResolvedValue({
      id: 'k1',
      name: 'prod',
      keyPrefix: 'lun_live_xxxxx',
      scopes: ['conversations:read', 'contacts:read'],
      permissions: ['conversations:read', 'contacts:read'],
      rateLimit: 1000,
      allowedIps: [],
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
    });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await service.createApiKey('org_1', { name: 'prod' });

    expect(prisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_1',
          scopes: ['conversations:read', 'contacts:read'],
          permissions: ['conversations:read', 'contacts:read'],
        }),
      }),
    );
    expect(result.rawKey).toMatch(/^lun_live_/);
  });

  it('runSandboxAgent retourne sandbox payload', async () => {
    agentsService.testAgent.mockResolvedValue({ content: 'ok', latencyMs: 10 });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await service.runSandboxAgent('org_1', 'agent_1', {
      message: 'test',
    });

    expect(agentsService.testAgent).toHaveBeenCalledWith(
      'agent_1',
      'org_1',
      'test',
    );
    expect(result.sandbox).toBe(true);
  });
});
