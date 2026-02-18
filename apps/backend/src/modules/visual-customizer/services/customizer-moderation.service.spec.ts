/**
 * CustomizerModerationService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomizerModerationService } from './customizer-moderation.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { MODERATION_SETTINGS } from '../visual-customizer.constants';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('CustomizerModerationService', () => {
  let service: CustomizerModerationService;
  let prisma: PrismaService;

  const mockPrisma = {
    customizerModerationRecord: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    customizerSavedDesign: {
      update: jest.fn(),
    },
  };

  const mockUser: CurrentUser = {
    id: 'user-1',
    email: 'moderator@example.com',
    role: UserRole.BRAND_ADMIN,
    brandId: 'brand-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizerModerationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomizerModerationService>(
      CustomizerModerationService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDesign', () => {
    it('should detect profanity and return blocked', async () => {
      const canvasData = {
        objects: [
          {
            type: 'text',
            text: 'This is a damn test',
          },
        ],
      };

      const result = await service.checkDesign(canvasData);

      expect(result.isBlocked).toBe(true);
      expect(result.reasons).toContain('Profanity detected in text content');
      expect(result.confidence).toBeGreaterThanOrEqual(
        MODERATION_SETTINGS.NSFW_THRESHOLD,
      );
    });

    it('should return clean for safe content', async () => {
      const canvasData = {
        objects: [
          {
            type: 'text',
            text: 'This is a clean design',
          },
        ],
      };

      const result = await service.checkDesign(canvasData);

      expect(result.isBlocked).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('should extract text from nested objects', async () => {
      const canvasData = {
        objects: [
          {
            type: 'group',
            children: [
              {
                type: 'text',
                text: 'Nested text',
              },
            ],
          },
        ],
      };

      const result = await service.checkDesign(canvasData);

      expect(result).toBeDefined();
    });
  });

  describe('approve', () => {
    it('should update status to APPROVED', async () => {
      const recordId = 'record-1';
      const notes = 'Looks good';
      const record = {
        id: recordId,
        brandId: 'brand-1',
        status: 'PENDING',
      };
      const approved = {
        id: recordId,
        status: 'APPROVED',
        reviewedById: 'user-1',
        reviewedAt: new Date(),
        reviewNotes: notes,
        actionTaken: 'APPROVED',
      };

      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(
        record,
      );
      mockPrisma.customizerModerationRecord.update.mockResolvedValue(approved);

      const result = await service.approve(recordId, notes, mockUser);

      expect(result.status).toBe('APPROVED');
      expect(result.reviewedById).toBe('user-1');
      expect(mockPrisma.customizerModerationRecord.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedById: 'user-1',
          actionTaken: 'APPROVED',
        }),
      });
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.approve('missing', 'notes', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should update status to REJECTED', async () => {
      const recordId = 'record-1';
      const body = {
        reason: 'Inappropriate content',
        notifyUser: true,
      };
      const record = {
        id: recordId,
        brandId: 'brand-1',
        status: 'PENDING',
        designId: 'design-1',
      };
      const rejected = {
        id: recordId,
        status: 'REJECTED',
        reviewedById: 'user-1',
        reviewNotes: body.reason,
        actionTaken: 'REJECTED',
      };

      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(
        record,
      );
      mockPrisma.customizerModerationRecord.update.mockResolvedValue(rejected);
      mockPrisma.customizerSavedDesign.update.mockResolvedValue({});

      const result = await service.reject(recordId, body, mockUser);

      expect(result.status).toBe('REJECTED');
      expect(result.reviewNotes).toBe(body.reason);
      expect(mockPrisma.customizerSavedDesign.update).toHaveBeenCalledWith({
        where: { id: 'design-1' },
        data: expect.objectContaining({
          moderationStatus: 'REJECTED',
        }),
      });
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.reject('missing', { reason: 'test' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('escalate', () => {
    it('should update status to ESCALATED', async () => {
      const recordId = 'record-1';
      const reason = 'Needs review';
      const record = {
        id: recordId,
        brandId: 'brand-1',
        status: 'PENDING',
      };
      const escalated = {
        id: recordId,
        status: 'ESCALATED',
        reviewedById: 'user-1',
        reviewNotes: reason,
        actionTaken: 'ESCALATED',
      };

      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(
        record,
      );
      mockPrisma.customizerModerationRecord.update.mockResolvedValue(escalated);

      const result = await service.escalate(recordId, reason, mockUser);

      expect(result.status).toBe('ESCALATED');
      expect(result.actionTaken).toBe('ESCALATED');
      expect(mockPrisma.customizerModerationRecord.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: expect.objectContaining({
          status: 'ESCALATED',
          actionTaken: 'ESCALATED',
        }),
      });
    });

    it('should throw NotFoundException when record not found', async () => {
      mockPrisma.customizerModerationRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.escalate('missing', 'reason', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      };

      mockPrisma.customizerModerationRecord.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(60) // approved
        .mockResolvedValueOnce(15) // rejected
        .mockResolvedValueOnce(5); // escalated

      const result = await service.getStats(dateRange, mockUser);

      expect(result.total).toBe(100);
      expect(result.pending).toBe(20);
      expect(result.approved).toBe(60);
      expect(result.rejected).toBe(15);
      expect(result.escalated).toBe(5);
      expect(result.approvalRate).toBe(60);
      expect(result.rejectionRate).toBe(15);
    });

    it('should handle zero total correctly', async () => {
      const dateRange = {
        from: new Date('2024-01-01'),
        to: new Date('2024-12-31'),
      };

      mockPrisma.customizerModerationRecord.count.mockResolvedValue(0);

      const result = await service.getStats(dateRange, mockUser);

      expect(result.total).toBe(0);
      expect(result.approvalRate).toBe(0);
      expect(result.rejectionRate).toBe(0);
    });
  });
});
