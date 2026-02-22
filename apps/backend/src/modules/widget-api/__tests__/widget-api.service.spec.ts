import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WidgetApiService } from '../widget-api.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { StartConversationDto } from '../dto/start-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

const mockChannelFindFirst = jest.fn();
const mockConversationCreate = jest.fn();
const mockConversationFindUnique = jest.fn();
const mockConversationUpdate = jest.fn();
const mockMessageCreate = jest.fn();
const mockMessageFindMany = jest.fn();
const mockOrganizationUpdate = jest.fn();
const mockAgentUpdate = jest.fn();
const mockChannelUpdate = jest.fn();

const mockPrisma = {
  channel: {
    findFirst: mockChannelFindFirst,
    update: mockChannelUpdate,
  },
  conversation: {
    create: mockConversationCreate,
    findUnique: mockConversationFindUnique,
    update: mockConversationUpdate,
  },
  message: {
    create: mockMessageCreate,
    findMany: mockMessageFindMany,
  },
  organization: { update: mockOrganizationUpdate },
  agent: { update: mockAgentUpdate },
};

const mockOrchestratorExecuteAgent = jest.fn();

const mockOrchestratorService = {
  executeAgent: mockOrchestratorExecuteAgent,
};

describe('WidgetApiService', () => {
  let service: WidgetApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetApiService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: OrchestratorService, useValue: mockOrchestratorService },
      ],
    }).compile();

    service = module.get<WidgetApiService>(WidgetApiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWidgetConfig', () => {
    it('should return config for valid widgetId', async () => {
      const channel = {
        widgetId: 'widget-123',
        deletedAt: null,
        widgetColor: '#000',
        widgetSecondaryColor: '#fff',
        widgetPosition: 'bottom-right',
        widgetSize: 'medium',
        widgetTheme: 'light',
        widgetPlaceholder: 'Écrivez...',
        widgetBrandName: 'Brand',
        widgetShowOnMobile: true,
        widgetShowOnDesktop: true,
        widgetLanguage: 'fr',
        widgetWelcomeMessage: 'Bienvenue',
        agent: {
          id: 'agent-1',
          name: 'Agent',
          avatar: 'avatar.png',
          greeting: 'Bonjour!',
          status: 'ACTIVE',
          tone: 'friendly',
        },
      };
      mockChannelFindFirst.mockResolvedValue(channel);

      const result = await service.getWidgetConfig('widget-123');

      expect(result).toMatchObject({
        widgetId: 'widget-123',
        agentName: 'Agent',
        agentAvatar: 'avatar.png',
        greeting: 'Bonjour!',
        color: '#000',
      });
      expect(mockChannelFindFirst).toHaveBeenCalledWith({
        where: { widgetId: 'widget-123', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for invalid widgetId', async () => {
      mockChannelFindFirst.mockResolvedValue(null);

      await expect(service.getWidgetConfig('invalid-widget')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getWidgetConfig('invalid-widget')).rejects.toThrow(
        'Widget not found',
      );
    });

    it('should throw BadRequestException if agent not ACTIVE', async () => {
      mockChannelFindFirst.mockResolvedValue({
        widgetId: 'widget-123',
        deletedAt: null,
        agent: { status: 'PAUSED', name: 'A', avatar: null, greeting: null, tone: null },
      });

      await expect(service.getWidgetConfig('widget-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getWidgetConfig('widget-123')).rejects.toThrow(
        'Agent is not active',
      );
    });
  });

  describe('startConversation', () => {
    const validChannel = {
      id: 'channel-1',
      widgetId: 'widget-123',
      deletedAt: null,
      widgetWelcomeMessage: 'Bienvenue',
      agent: {
        id: 'agent-1',
        organizationId: 'org-1',
        greeting: 'Bonjour!',
      },
    };

    it('should create conversation, send greeting, and increment counters', async () => {
      mockChannelFindFirst.mockResolvedValue(validChannel);
      mockConversationCreate.mockResolvedValue({
        id: 'conv-1',
        organizationId: 'org-1',
        agentId: 'agent-1',
        channelId: 'channel-1',
      });
      mockMessageCreate.mockResolvedValue({});
      mockOrganizationUpdate.mockResolvedValue({});
      mockAgentUpdate.mockResolvedValue({});
      mockChannelUpdate.mockResolvedValue({});

      const dto: StartConversationDto = {
        widgetId: 'widget-123',
        visitorId: 'visitor-1',
      };
      const context = { origin: 'https://example.com', ip: '1.2.3.4', userAgent: 'Mozilla' };

      const result = await service.startConversation(dto, context);

      expect(result.conversationId).toBe('conv-1');
      expect(result.greeting).toBe('Bonjour!');
      expect(mockConversationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            agentId: 'agent-1',
            channelId: 'channel-1',
            visitorId: 'visitor-1',
            channelType: 'WIDGET',
          }),
        }),
      );
      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          role: 'ASSISTANT',
          content: 'Bonjour!',
        },
      });
      expect(mockOrganizationUpdate).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { conversationsUsed: { increment: 1 } },
      });
      expect(mockAgentUpdate).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { totalConversations: { increment: 1 } },
      });
      expect(mockChannelUpdate).toHaveBeenCalledWith({
        where: { id: 'channel-1' },
        data: { totalConversations: { increment: 1 } },
      });
    });

    it('should throw BadRequestException for disallowed origin', async () => {
      mockChannelFindFirst.mockResolvedValue({
        ...validChannel,
        widgetAllowedOrigins: ['https://allowed.com'],
      });

      const dto: StartConversationDto = { widgetId: 'widget-123' };
      const context = {
        origin: 'https://evil.com',
        ip: '1.2.3.4',
        userAgent: 'Mozilla',
      };

      await expect(service.startConversation(dto, context)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startConversation(dto, context)).rejects.toThrow(
        'Origin not allowed',
      );
      expect(mockConversationCreate).not.toHaveBeenCalled();
    });

    it('should allow origin when it matches wildcard (*.domain.com)', async () => {
      mockChannelFindFirst.mockResolvedValue({
        ...validChannel,
        widgetAllowedOrigins: ['*.domain.com'],
      });
      mockConversationCreate.mockResolvedValue({
        id: 'conv-1',
        organizationId: 'org-1',
        agentId: 'agent-1',
        channelId: 'channel-1',
      });
      mockMessageCreate.mockResolvedValue({});
      mockOrganizationUpdate.mockResolvedValue({});
      mockAgentUpdate.mockResolvedValue({});
      mockChannelUpdate.mockResolvedValue({});

      const dto: StartConversationDto = { widgetId: 'widget-123' };
      const context = {
        origin: 'https://app.domain.com',
        ip: '1.2.3.4',
        userAgent: 'Mozilla',
      };

      const result = await service.startConversation(dto, context);

      expect(result.conversationId).toBe('conv-1');
      expect(mockConversationCreate).toHaveBeenCalled();
    });

    it('should throw NotFoundException when widget not found', async () => {
      mockChannelFindFirst.mockResolvedValue(null);

      const dto: StartConversationDto = { widgetId: 'invalid' };
      const context = { origin: '', ip: '', userAgent: '' };

      await expect(service.startConversation(dto, context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.startConversation(dto, context)).rejects.toThrow(
        'Widget not found',
      );
    });
  });

  describe('sendMessage', () => {
    const validConversation = {
      id: 'conv-1',
      agentId: 'agent-1',
      status: 'OPEN',
      agent: { fallbackMessage: 'Message de secours' },
    };

    it('should save user message, call orchestrator, and return response', async () => {
      mockConversationFindUnique.mockResolvedValue(validConversation);
      mockMessageCreate.mockResolvedValue({});
      mockConversationUpdate.mockResolvedValue({});
      mockOrchestratorExecuteAgent.mockResolvedValue({
        content: 'Réponse de l\'agent',
        sources: [{ documentTitle: 'Doc', score: 0.9 }],
        tokensIn: 10,
        tokensOut: 20,
      });

      const dto: SendMessageDto = { content: 'Bonjour' };

      const result = await service.sendMessage('conv-1', dto);

      expect(result.message).toMatchObject({
        role: 'assistant',
        content: 'Réponse de l\'agent',
        sources: [{ title: 'Doc', score: 0.9 }],
      });
      expect(result.usage).toEqual({ tokensIn: 10, tokensOut: 20 });
      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          role: 'USER',
          content: 'Bonjour',
        },
      });
      expect(mockOrchestratorExecuteAgent).toHaveBeenCalledWith(
        'agent-1',
        'conv-1',
        'Bonjour',
      );
    });

    it('should throw NotFoundException for invalid conversationId', async () => {
      mockConversationFindUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('invalid-conv', { content: 'Bonjour' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.sendMessage('invalid-conv', { content: 'Bonjour' }),
      ).rejects.toThrow('Conversation not found');
      expect(mockOrchestratorExecuteAgent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for CLOSED conversation', async () => {
      mockConversationFindUnique.mockResolvedValue({
        ...validConversation,
        status: 'CLOSED',
      });

      await expect(
        service.sendMessage('conv-1', { content: 'Bonjour' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.sendMessage('conv-1', { content: 'Bonjour' }),
      ).rejects.toThrow('Conversation is closed');
      expect(mockOrchestratorExecuteAgent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for SPAM conversation', async () => {
      mockConversationFindUnique.mockResolvedValue({
        ...validConversation,
        status: 'SPAM',
      });

      await expect(
        service.sendMessage('conv-1', { content: 'Bonjour' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.sendMessage('conv-1', { content: 'Bonjour' }),
      ).rejects.toThrow('Conversation is closed');
    });

    it('should return fallback message when orchestrator fails', async () => {
      mockConversationFindUnique.mockResolvedValue(validConversation);
      mockMessageCreate.mockResolvedValue({});
      mockConversationUpdate.mockResolvedValue({});
      mockOrchestratorExecuteAgent.mockRejectedValue(new Error('Agent error'));

      const result = await service.sendMessage('conv-1', { content: 'Bonjour' });

      expect(result.message).toMatchObject({
        role: 'assistant',
        content: 'Message de secours',
        sources: [],
      });
      expect(mockMessageCreate).toHaveBeenCalledTimes(2); // user + fallback
      expect(mockMessageCreate).toHaveBeenLastCalledWith({
        data: {
          conversationId: 'conv-1',
          role: 'ASSISTANT',
          content: 'Message de secours',
        },
      });
    });

    it('should use default fallback when agent has no fallbackMessage', async () => {
      mockConversationFindUnique.mockResolvedValue({
        ...validConversation,
        agent: { fallbackMessage: null },
      });
      mockMessageCreate.mockResolvedValue({});
      mockConversationUpdate.mockResolvedValue({});
      mockOrchestratorExecuteAgent.mockRejectedValue(new Error('Agent error'));

      const result = await service.sendMessage('conv-1', { content: 'Bonjour' });

      expect(result.message.content).toContain('Désolé');
      expect(result.message.content).toContain('difficulté technique');
    });
  });

  describe('getMessages', () => {
    it('should return messages array', async () => {
      mockConversationFindUnique.mockResolvedValue({ id: 'conv-1' });
      mockMessageFindMany.mockResolvedValue([
        { id: 'msg-1', role: 'USER', content: 'Bonjour', createdAt: new Date() },
        { id: 'msg-2', role: 'ASSISTANT', content: 'Réponse', createdAt: new Date() },
      ]);

      const result = await service.getMessages('conv-1');

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('Bonjour');
      expect(result.messages[1].content).toBe('Réponse');
      expect(mockMessageFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 'conv-1', deletedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 50,
        }),
      );
    });

    it('should respect after parameter', async () => {
      mockConversationFindUnique.mockResolvedValue({ id: 'conv-1' });
      mockMessageFindMany.mockResolvedValue([]);

      const afterDate = '2024-01-15T10:00:00.000Z';
      await service.getMessages('conv-1', afterDate);

      expect(mockMessageFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversationId: 'conv-1',
            deletedAt: null,
            createdAt: { gt: new Date(afterDate) },
          }),
        }),
      );
    });

    it('should throw NotFoundException for invalid conversationId', async () => {
      mockConversationFindUnique.mockResolvedValue(null);

      await expect(service.getMessages('invalid-conv')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMessages('invalid-conv')).rejects.toThrow(
        'Conversation not found',
      );
    });
  });
});
