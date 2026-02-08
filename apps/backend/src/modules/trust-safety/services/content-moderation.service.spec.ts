import { Test, TestingModule } from '@nestjs/testing';
import { ContentModerationService } from './content-moderation.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ContentModerationService', () => {
  let service: ContentModerationService;
  let prisma: PrismaService;

  const mockPrisma = {
    brand: { findUnique: jest.fn() },
    moderationRecord: {
      create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentModerationService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-key') },
        },
      ],
    }).compile();

    service = module.get<ContentModerationService>(ContentModerationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('moderate text', () => {
    it('should auto_approve clean text', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ settings: {} });

      const result = await service.moderate({
        type: 'text',
        content: 'A beautiful ring design for my store.',
        context: { brandId: 'brand-123' },
      });

      expect(result.approved).toBe(true);
      expect(result.action).toBe('auto_approve');
      expect(result.score).toBe(0);
      expect(result.flags).toEqual([]);
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should flag profanity and send to manual_review or auto_reject', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ settings: {} });

      const result = await service.moderate({
        type: 'text',
        content: 'This is shit and fucking bad',
      });

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('profanity');
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(['manual_review', 'auto_reject']).toContain(result.action);
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should flag spam (multiple URLs)', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ settings: {} });

      const result = await service.moderate({
        type: 'text',
        content: 'Check http://a.com and http://b.com and http://c.com now!',
      });

      expect(result.flags).toContain('spam');
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should block content with brand blacklisted words', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        settings: { blacklist: ['forbidden'] },
      });

      const result = await service.moderate({
        type: 'text',
        content: 'This contains forbidden word',
        context: { brandId: 'brand-123' },
      });

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('blacklist');
      expect(result.action).toBe('auto_reject');
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('moderate image', () => {
    it('should auto_approve when no metadata (no flags)', async () => {
      const result = await service.moderate({
        type: 'image',
        content: 'https://example.com/image.png',
      });

      expect(result.approved).toBe(true);
      expect(result.action).toBe('auto_approve');
      expect(result.flags).toEqual([]);
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should flag invalid MIME type and auto_reject', async () => {
      const result = await service.moderate({
        type: 'image',
        content: 'https://example.com/file.bin',
        context: {
          imageMetadata: {
            width: 100,
            height: 100,
            size: 1000,
            mimeType: 'application/octet-stream',
          },
        },
      });

      expect(result.approved).toBe(false);
      expect(result.flags).toContain('invalid_type');
      expect(result.action).toBe('auto_reject');
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should flag file_too_large', async () => {
      const result = await service.moderate({
        type: 'image',
        content: 'https://example.com/large.png',
        context: {
          imageMetadata: {
            width: 800,
            height: 600,
            size: 60 * 1024 * 1024, // 60MB
            mimeType: 'image/png',
          },
        },
      });

      expect(result.flags).toContain('file_too_large');
      expect(result.approved).toBe(false);
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });

    it('should flag oversized dimensions', async () => {
      const result = await service.moderate({
        type: 'image',
        content: 'https://example.com/huge.png',
        context: {
          imageMetadata: {
            width: 15000,
            height: 15000,
            size: 1024,
            mimeType: 'image/png',
          },
        },
      });

      expect(result.flags).toContain('oversized');
      expect(mockPrisma.moderationRecord.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModerationHistory', () => {
    it('should call findMany with filters', async () => {
      mockPrisma.moderationRecord.findMany.mockResolvedValue([{ id: '1' }]);

      await service.getModerationHistory(
        'user-1',
        'brand-1',
        50,
        'text',
        false,
        'review',
      );

      expect(prisma.moderationRecord.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          brandId: 'brand-1',
          type: 'text',
          approved: false,
          action: 'review',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
