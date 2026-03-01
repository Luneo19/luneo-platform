import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus } from '@prisma/client';
import { HandoffService } from '../handoff.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SentimentAnalysisService } from '@/modules/agent-analytics/sentiment-analysis.service';
import { EmailService } from '@/modules/email/email.service';

describe('HandoffService', () => {
  let service: HandoffService;

  const mockPrisma = {
    conversation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockSentimentService = {
    analyzeConversation: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandoffService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: SentimentAnalysisService, useValue: mockSentimentService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<HandoffService>(HandoffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('evaluateHandoff should detect explicit user request ("parler à un humain")', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({
      id: 'conv-1',
      agent: {
        id: 'agent-1',
        confidenceThreshold: 0.7,
        autoEscalate: true,
        escalationConditions: null,
      },
      messages: [],
    });

    const result = await service.evaluateHandoff(
      'conv-1',
      'Je veux parler à un humain maintenant',
      0.95,
    );

    expect(result.shouldHandoff).toBe(true);
    expect(result.method).toBe('user_request');
    expect(result.priority).toBe('high');
  });

  it('evaluateHandoff should detect sensitive topics', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({
      id: 'conv-2',
      agent: {
        id: 'agent-1',
        confidenceThreshold: 0.7,
        autoEscalate: true,
        escalationConditions: null,
      },
      messages: [],
    });

    const result = await service.evaluateHandoff(
      'conv-2',
      'Je souhaite un remboursement immédiat',
      0.99,
    );

    expect(result.shouldHandoff).toBe(true);
    expect(result.method).toBe('sensitive_topic');
    expect(result.priority).toBe('urgent');
    expect(result.reason).toContain('Sujet sensible détecté');
  });

  it('evaluateHandoff should trigger on low confidence', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({
      id: 'conv-3',
      agent: {
        id: 'agent-1',
        confidenceThreshold: 0.7,
        autoEscalate: true,
        escalationConditions: null,
      },
      messages: [{ role: 'USER', content: 'Question complexe' }],
    });
    mockPrisma.message.findMany.mockResolvedValue([
      { confidence: 0.3 },
      { confidence: 0.4 },
      { confidence: 0.85 },
    ]);

    const result = await service.evaluateHandoff(
      'conv-3',
      'Pouvez-vous m aider ?',
      0.5,
    );

    expect(result.shouldHandoff).toBe(true);
    expect(result.method).toBe('confidence_threshold');
    expect(result.priority).toBe('medium');
    expect(result.reason).toContain('Confiance IA trop basse');
  });

  it('executeHandoff should update conversation status', async () => {
    mockPrisma.conversation.findFirst.mockResolvedValue({
      id: 'conv-4',
      status: ConversationStatus.ACTIVE,
      visitorName: 'Jean',
      visitorEmail: 'jean@example.com',
      agent: {
        id: 'agent-1',
        name: 'Support Bot',
        escalationEmail: null,
        escalationMessage: null,
        organizationId: 'org-1',
      },
    });
    mockPrisma.conversation.update.mockResolvedValue({});
    mockPrisma.message.create.mockResolvedValue({});

    const result = await service.executeHandoff(
      'conv-4',
      'Demande explicite utilisateur',
      'high',
    );

    expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-4' },
      data: expect.objectContaining({
        status: ConversationStatus.ESCALATED,
        escalationReason: 'Demande explicite utilisateur',
        escalationPriority: 'high',
        isUrgent: false,
      }),
    });
    expect(mockPrisma.message.create).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.notifiedChannels).toEqual(
      expect.arrayContaining(['database', 'in_conversation_notice']),
    );
  });
});
