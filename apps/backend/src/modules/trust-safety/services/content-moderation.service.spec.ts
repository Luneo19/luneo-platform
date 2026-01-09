import { Test, TestingModule } from '@nestjs/testing';
import { ContentModerationService } from './content-moderation.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ContentModerationService', () => {
  let service: ContentModerationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentModerationService,
        {
          provide: PrismaService,
          useValue: {
            brand: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ContentModerationService>(ContentModerationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('moderate', () => {
    it('should moderate text content', async () => {
      // Mock OpenAI moderation API
      const mockModeration = {
        results: [
          {
            flagged: false,
            categories: {},
            category_scores: {},
          },
        ],
      };

      // Mock OpenAI instance
      jest.spyOn(service as any, 'getOpenAI').mockResolvedValue({
        moderations: {
          create: jest.fn().mockResolvedValue(mockModeration),
        },
      });

      jest.spyOn(prisma.brand, 'findUnique').mockResolvedValue({
        settings: {},
      } as any);

      const result = await service.moderate({
        type: 'text',
        content: 'A beautiful ring design',
        context: { brandId: 'brand-123' },
      });

      expect(result.approved).toBe(true);
      expect(result.action).toBe('allow');
    });

    it('should block content with blacklisted words', async () => {
      jest.spyOn(service as any, 'getOpenAI').mockResolvedValue({
        moderations: {
          create: jest.fn().mockResolvedValue({
            results: [{ flagged: false, categories: {}, category_scores: {} }],
          }),
        },
      });

      jest.spyOn(prisma.brand, 'findUnique').mockResolvedValue({
        settings: {
          blacklist: ['forbidden'],
        },
      } as any);

      const result = await service.moderate({
        type: 'text',
        content: 'This contains forbidden word',
        context: { brandId: 'brand-123' },
      });

      expect(result.approved).toBe(false);
      expect(result.action).toBe('block');
    });
  });
});

































