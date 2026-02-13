import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from '../settings.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationPreferences', () => {
    it('should return merged preferences with defaults', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        notificationPreferences: {
          email: { orders: true, marketing: false },
        },
      });
      const result = await service.getNotificationPreferences('user-1');
      expect(result).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.email?.orders).toBe(true);
      expect(result.push).toBeDefined();
      expect(result.inApp).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.getNotificationPreferences('invalid-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply defaults when user has null preferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        notificationPreferences: null,
      });
      const result = await service.getNotificationPreferences('user-1');
      expect(result.email?.securityAlerts).toBe(true);
      expect(result.push?.orders).toBe(true);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should merge and persist preferences', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        notificationPreferences: {
          email: { orders: true, designs: true, marketing: false, securityAlerts: true },
          push: { orders: true, designs: true },
          inApp: { orders: true, designs: true, system: true },
        },
      });
      mockPrisma.user.update.mockResolvedValue({});
      const dto = {
        email: { marketing: true },
        push: {},
        inApp: {},
      };
      const result = await service.updateNotificationPreferences('user-1', dto);
      expect(result.email?.marketing).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { notificationPreferences: expect.any(Object) },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateNotificationPreferences('invalid', { email: {}, push: {}, inApp: {} } as any),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
