/**
 * NotificationsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockPrisma: Record<string, any> = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'VAPID_PUBLIC_KEY') return 'vapid-public';
      if (key === 'VAPID_PRIVATE_KEY') return 'vapid-private';
      return undefined;
    }),
  };

  const mockRedis = {
    healthCheck: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const userId = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.healthCheck.mockResolvedValue(true);
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'VAPID_PUBLIC_KEY') return 'vapid-public';
      if (key === 'VAPID_PRIVATE_KEY') return 'vapid-private';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisOptimizedService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVapidPublicKey', () => {
    it('should return VAPID public key', () => {
      expect(service.getVapidPublicKey()).toBe('vapid-public');
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const notifications = [
        { id: 'n1', userId, type: 'info', title: 'Test', message: 'Msg', read: false },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.notifications).toEqual(notifications);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId }, skip: 0, take: 10 }),
      );
    });

    it('should filter unread only when unreadOnly is true', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.findAll(userId, { unreadOnly: true });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, read: false } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return notification when found and user owns it', async () => {
      const notification = { id: 'n1', userId, type: 'info', title: 'T', message: 'M' };
      mockPrisma.notification.findUnique.mockResolvedValue(notification);

      const result = await service.findOne('n1', userId);

      expect(result).toEqual(notification);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', userId)).rejects.toThrow('Notification not found');
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'n1',
        userId: 'other',
        type: 'info',
        title: 'T',
        message: 'M',
      });

      await expect(service.findOne('n1', userId)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne('n1', userId)).rejects.toThrow('Access denied');
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const createData = {
        userId,
        type: 'info',
        title: 'Title',
        message: 'Message',
      };
      const created = { id: 'n1', ...createData };
      mockPrisma.notification.create.mockResolvedValue(created);

      const result = await service.create(createData);

      expect(result).toEqual(created);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createData.userId,
          type: createData.type,
          title: createData.title,
          message: createData.message,
        }),
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: 'n1', userId, read: false };
      mockPrisma.notification.findUnique.mockResolvedValue(notification);
      const updated = { ...notification, read: true, readAt: new Date() };
      mockPrisma.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('n1', userId);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: expect.objectContaining({ read: true }),
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead(userId);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, read: false },
        data: expect.objectContaining({ read: true }),
      });
    });
  });

  describe('delete', () => {
    it('should delete notification when user owns it', async () => {
      const notification = { id: 'n1', userId };
      mockPrisma.notification.findUnique.mockResolvedValue(notification);
      mockPrisma.notification.delete.mockResolvedValue(notification);

      const result = await service.delete('n1', userId);

      expect(result.success).toBe(true);
      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
    });
  });

  describe('subscribeToPush / unsubscribeFromPush', () => {
    it('should subscribe to push and return success', async () => {
      const result = await service.subscribeToPush(userId, {
        endpoint: 'https://push.example.com',
        keys: { p256dh: 'key', auth: 'auth' },
      });

      expect(result.success).toBe(true);
    });

    it('should unsubscribe from push and return success', async () => {
      const result = await service.unsubscribeFromPush(userId, 'https://push.example.com');

      expect(result.success).toBe(true);
    });
  });
});
