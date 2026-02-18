import { Test, TestingModule } from '@nestjs/testing';
import { NovaTicketsService } from '../../nova/services/nova-tickets.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('NovaTicketsService', () => {
  let service: NovaTicketsService;

  const mockTicket = {
    id: 'ticket-1',
    subject: 'Test ticket',
    description: 'Test description',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: 'GENERAL',
    createdAt: new Date('2026-01-01'),
    resolvedAt: null,
    brandId: 'brand-1',
    userId: 'user-1',
    conversationId: 'conv-1',
    metadata: {},
  };

  const mockPrisma = {
    novaTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    novaTicketMessage: {
      create: jest.fn(),
    },
    novaTicketActivity: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovaTicketsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NovaTicketsService>(NovaTicketsService);
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a ticket with all required fields', async () => {
      mockPrisma.novaTicket.create.mockResolvedValue(mockTicket);
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      const result = await service.createTicket({
        subject: 'Test ticket',
        description: 'Test description',
        brandId: 'brand-1',
        userId: 'user-1',
        conversationId: 'conv-1',
      });

      expect(result.id).toBe('ticket-1');
      expect(result.subject).toBe('Test ticket');
      expect(result.status).toBe('OPEN');
      expect(result.messageCount).toBe(1);
    });

    it('should default priority to MEDIUM and category to GENERAL', async () => {
      mockPrisma.novaTicket.create.mockResolvedValue(mockTicket);
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      await service.createTicket({ subject: 'Test', description: 'Test' });

      expect(mockPrisma.novaTicket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'MEDIUM',
          category: 'GENERAL',
        }),
      });
    });

    it('should create initial message with customer role', async () => {
      mockPrisma.novaTicket.create.mockResolvedValue(mockTicket);
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      await service.createTicket({ subject: 'Test', description: 'My problem' });

      expect(mockPrisma.novaTicketMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          role: 'customer',
          content: 'My problem',
        }),
      });
    });

    it('should log creation activity', async () => {
      mockPrisma.novaTicket.create.mockResolvedValue(mockTicket);
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      await service.createTicket({ subject: 'Test', description: 'Test', conversationId: 'conv-1' });

      expect(mockPrisma.novaTicketActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          type: 'created',
        }),
      });
    });
  });

  describe('addMessage', () => {
    it('should add a message to a ticket', async () => {
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      await service.addMessage('ticket-1', 'agent', 'Hello', false);

      expect(mockPrisma.novaTicketMessage.create).toHaveBeenCalledWith({
        data: { ticketId: 'ticket-1', role: 'agent', content: 'Hello', isInternal: false },
      });
    });

    it('should support internal messages', async () => {
      mockPrisma.novaTicketMessage.create.mockResolvedValue({});
      await service.addMessage('ticket-1', 'agent', 'Internal note', true);

      expect(mockPrisma.novaTicketMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isInternal: true }),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update ticket status and log activity', async () => {
      mockPrisma.novaTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.novaTicket.update.mockResolvedValue({ ...mockTicket, status: 'IN_PROGRESS' });
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      await service.updateStatus('ticket-1', 'IN_PROGRESS', 'agent-1');

      expect(mockPrisma.novaTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { status: 'IN_PROGRESS' },
      });
      expect(mockPrisma.novaTicketActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketId: 'ticket-1',
          type: 'status_change',
          actorId: 'agent-1',
        }),
      });
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      mockPrisma.novaTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrisma.novaTicket.update.mockResolvedValue({ ...mockTicket, status: 'RESOLVED' });
      mockPrisma.novaTicketActivity.create.mockResolvedValue({});

      await service.updateStatus('ticket-1', 'RESOLVED');

      expect(mockPrisma.novaTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: expect.objectContaining({
          status: 'RESOLVED',
          resolvedAt: expect.any(Date),
        }),
      });
    });

    it('should silently return if ticket not found', async () => {
      mockPrisma.novaTicket.findUnique.mockResolvedValue(null);
      await service.updateStatus('nonexistent', 'OPEN');
      expect(mockPrisma.novaTicket.update).not.toHaveBeenCalled();
    });
  });

  describe('getTicketsByUser', () => {
    it('should return formatted ticket summaries', async () => {
      mockPrisma.novaTicket.findMany.mockResolvedValue([
        { ...mockTicket, _count: { messages: 3 } },
      ]);

      const result = await service.getTicketsByUser('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].messageCount).toBe(3);
    });

    it('should respect the limit parameter', async () => {
      mockPrisma.novaTicket.findMany.mockResolvedValue([]);
      await service.getTicketsByUser('user-1', 5);
      expect(mockPrisma.novaTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    });

    it('should default limit to 10', async () => {
      mockPrisma.novaTicket.findMany.mockResolvedValue([]);
      await service.getTicketsByUser('user-1');
      expect(mockPrisma.novaTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    });
  });

  describe('getTicketDetails', () => {
    it('should return ticket with messages and activities', async () => {
      const fullTicket = {
        ...mockTicket,
        messages: [{ id: 'msg-1', content: 'Hello' }],
        activities: [{ id: 'act-1', type: 'created' }],
      };
      mockPrisma.novaTicket.findUnique.mockResolvedValue(fullTicket);

      const result = await service.getTicketDetails('ticket-1');
      expect(result).toEqual(fullTicket);
    });
  });
});
