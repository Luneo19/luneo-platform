/**
 * SupportService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketCategory, TicketPriority } from '@prisma/client';

describe('SupportService', () => {
  let service: SupportService;
  const mockPrisma = {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    ticketMessage: { create: jest.fn() },
    ticketActivity: { create: jest.fn() },
    ticketAttachment: {},
    knowledgeBaseArticle: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getTickets', () => {
    it('should return paginated tickets for user', async () => {
      const tickets = [
        {
          id: 't1',
          userId,
          ticketNumber: 'TKT-00001',
          subject: 'Help',
          description: 'Need help',
          status: 'OPEN',
          messages: [],
          assignedUser: null,
        },
      ];
      mockPrisma.ticket.findMany.mockResolvedValue(tickets);
      mockPrisma.ticket.count.mockResolvedValue(1);

      const result = await service.getTickets(userId, { page: 1, limit: 50 });

      expect(result.tickets).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          skip: 0,
          take: 50,
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrisma.ticket.findMany.mockResolvedValue([]);
      mockPrisma.ticket.count.mockResolvedValue(0);

      await service.getTickets(userId, { status: 'RESOLVED' });

      expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId, status: 'RESOLVED' }),
        }),
      );
    });
  });

  describe('getTicket', () => {
    it('should return ticket when user is owner', async () => {
      const ticket = {
        id: 't1',
        userId,
        ticketNumber: 'TKT-00001',
        subject: 'Help',
        description: 'Need help',
        status: 'OPEN',
        messages: [],
        attachments: [],
        assignedUser: null,
        activities: [],
        _count: { messages: 0, activities: 0 },
      };
      mockPrisma.ticket.findUnique.mockResolvedValue(ticket);

      const result = await service.getTicket('t1', userId);

      expect(result.id).toBe('t1');
      expect(result.userId).toBe(userId);
      expect(result.pagination).toBeDefined();
    });

    it('should throw NotFoundException when ticket not found', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.getTicket('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTicket('nonexistent', userId)).rejects.toThrow(
        'Ticket not found',
      );
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'other-user',
        messages: [],
        attachments: [],
        assignedUser: null,
        activities: [],
        _count: { messages: 0, activities: 0 },
      });

      await expect(service.getTicket('t1', userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getTicket('t1', userId)).rejects.toThrow(
        'Access denied to this ticket',
      );
    });
  });

  describe('createTicket', () => {
    it('should create ticket with initial message and activity', async () => {
      mockPrisma.ticket.count.mockResolvedValue(0);
      const createdTicket = {
        id: 't1',
        ticketNumber: 'TKT-00001',
        subject: 'Issue',
        description: 'Description',
        category: TicketCategory.TECHNICAL,
        priority: TicketPriority.MEDIUM,
        userId,
        status: 'OPEN',
        user: { id: userId, firstName: 'John', lastName: 'Doe', email: 'j@test.com' },
      };
      mockPrisma.ticket.create.mockResolvedValue(createdTicket);
      mockPrisma.ticketMessage.create.mockResolvedValue({});
      mockPrisma.ticketActivity.create.mockResolvedValue({});

      const result = await service.createTicket({
        userId,
        subject: 'Issue',
        description: 'Description',
      });

      expect(result.ticketNumber).toBe('TKT-00001');
      expect(result.subject).toBe('Issue');
      expect(mockPrisma.ticket.create).toHaveBeenCalled();
      expect(mockPrisma.ticketMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 't1',
            content: 'Description',
            userId,
            type: 'USER',
          }),
        }),
      );
      expect(mockPrisma.ticketActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 't1',
            action: 'created',
            userId,
          }),
        }),
      );
    });
  });

  describe('addMessageToTicket', () => {
    it('should throw ForbiddenException when ticket is closed', async () => {
      mockPrisma.ticket.findUnique.mockResolvedValue({
        id: 't1',
        userId,
        status: 'CLOSED',
        messages: [],
        attachments: [],
        assignedUser: null,
        activities: [],
        _count: { messages: 0, activities: 0 },
      });

      await expect(
        service.addMessageToTicket('t1', userId, 'New message'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.addMessageToTicket('t1', userId, 'New message'),
      ).rejects.toThrow('Cannot add messages to a closed or resolved ticket');
      expect(mockPrisma.ticketMessage.create).not.toHaveBeenCalled();
    });
  });

  describe('getKnowledgeBaseArticle', () => {
    it('should return article and increment views', async () => {
      const article = {
        slug: 'config-guide',
        title: 'Config Guide',
        content: 'Content',
        isPublished: true,
      };
      mockPrisma.knowledgeBaseArticle.findUnique.mockResolvedValue(article);
      mockPrisma.knowledgeBaseArticle.update.mockResolvedValue(article);

      const result = await service.getKnowledgeBaseArticle('config-guide');

      expect(result.slug).toBe('config-guide');
      expect(result.title).toBe('Config Guide');
      expect(mockPrisma.knowledgeBaseArticle.update).toHaveBeenCalledWith({
        where: { slug: 'config-guide' },
        data: { views: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when article not found', async () => {
      mockPrisma.knowledgeBaseArticle.findUnique.mockResolvedValue(null);

      await expect(
        service.getKnowledgeBaseArticle('nonexistent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getKnowledgeBaseArticle('nonexistent'),
      ).rejects.toThrow('Article not found');
    });

    it('should throw ForbiddenException when article not published', async () => {
      mockPrisma.knowledgeBaseArticle.findUnique.mockResolvedValue({
        slug: 'draft',
        isPublished: false,
      });

      await expect(
        service.getKnowledgeBaseArticle('draft'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getKnowledgeBaseArticle('draft'),
      ).rejects.toThrow('Access denied to unpublished article');
    });
  });

  describe('getKnowledgeBaseArticles', () => {
    it('should return paginated published articles', async () => {
      const articles = [
        {
          id: 'a1',
          slug: 'guide',
          title: 'Guide',
          excerpt: 'Excerpt',
          category: 'guide',
          tags: ['tag1'],
          views: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.knowledgeBaseArticle.findMany.mockResolvedValue(articles);
      mockPrisma.knowledgeBaseArticle.count.mockResolvedValue(1);

      const result = await service.getKnowledgeBaseArticles({ page: 1, limit: 20 });

      expect(result.articles).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
        }),
      );
    });
  });
});
