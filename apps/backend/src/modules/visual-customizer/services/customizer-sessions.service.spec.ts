/**
 * CustomizerSessionsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CustomizerSessionsService } from './customizer-sessions.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StartSessionDto } from '../dto/sessions/start-session.dto';
import { SaveDesignDto } from '../dto/sessions/save-design.dto';
import { SessionInteractionDto } from '../dto/sessions/session-interaction.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';

describe('CustomizerSessionsService', () => {
  let service: CustomizerSessionsService;
  let _prisma: PrismaService;

  const mockPrisma = {
    visualCustomizer: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    customizerSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customizerInteraction: {
      create: jest.fn(),
    },
    customizerSavedDesign: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUser: CurrentUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.CONSUMER,
    brandId: 'brand-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizerSessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomizerSessionsService>(
      CustomizerSessionsService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('start', () => {
    it('should create session and increment sessionCount', async () => {
      const customizerId = 'customizer-1';
      const data: StartSessionDto & { userId?: string; anonymousId?: string } =
        {
          customizerId,
          source: 'WEB',
          userId: 'user-1',
        };

      const customizer = { id: customizerId };
      const session = {
        id: 'session-1',
        customizerId,
        userId: 'user-1',
        status: 'ACTIVE',
      };

      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(customizer);
      mockPrisma.customizerSession.create.mockResolvedValue(session);
      mockPrisma.visualCustomizer.update.mockResolvedValue({});

      const result = await service.start(data);

      expect(result).toEqual(session);
      expect(mockPrisma.customizerSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customizerId,
          userId: 'user-1',
          status: 'ACTIVE',
        }),
      });
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith({
        where: { id: customizerId },
        data: {
          sessionCount: { increment: 1 },
        },
      });
    });

    it('should throw NotFoundException when customizer not published', async () => {
      mockPrisma.visualCustomizer.findFirst.mockResolvedValue(null);

      await expect(
        service.start({
          customizerId: 'missing',
          source: 'WEB',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveDesign', () => {
    it('should create saved design and generate shareToken', async () => {
      const sessionId = 'session-1';
      const dto: SaveDesignDto = {
        name: 'My Design',
        canvasData: { objects: [] },
        thumbnailDataUrl: 'data:image/png;base64,...',
        isPublic: true,
      };

      const session = {
        id: sessionId,
        customizerId: 'customizer-1',
        userId: 'user-1',
        customizer: { id: 'customizer-1', brandId: 'brand-1' },
      };

      const savedDesign = {
        id: 'design-1',
        sessionId,
        shareToken: 'share_token_123',
        shareUrl: 'http://localhost:3000/designs/share_token_123',
      };

      mockPrisma.customizerSession.findFirst.mockResolvedValue(session);
      mockPrisma.customizerSavedDesign.count.mockResolvedValue(0);
      mockPrisma.customizerSavedDesign.create.mockResolvedValue(savedDesign);
      mockPrisma.visualCustomizer.update.mockResolvedValue({});

      const result = await service.saveDesign(sessionId, dto, mockUser);

      expect(result).toEqual(savedDesign);
      expect(result.shareToken).toBeDefined();
      expect(mockPrisma.customizerSavedDesign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId,
          name: 'My Design',
          shareToken: expect.any(String),
        }),
      });
      expect(mockPrisma.visualCustomizer.update).toHaveBeenCalledWith({
        where: { id: 'customizer-1' },
        data: {
          designsSaved: { increment: 1 },
        },
      });
    });

    it('should validate max saved designs limit', async () => {
      const sessionId = 'session-1';
      const dto: SaveDesignDto = {
        name: 'My Design',
        canvasData: { objects: [] },
      };

      const session = {
        id: sessionId,
        customizerId: 'customizer-1',
        userId: 'user-1',
        customizer: { id: 'customizer-1', brandId: 'brand-1' },
      };

      mockPrisma.customizerSession.findFirst.mockResolvedValue(session);
      mockPrisma.customizerSavedDesign.count.mockResolvedValue(
        VISUAL_CUSTOMIZER_LIMITS.MAX_SAVED_DESIGNS_PER_USER,
      );

      await expect(
        service.saveDesign(sessionId, dto, mockUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.saveDesign(sessionId, dto, mockUser),
      ).rejects.toThrow(/Maximum.*saved designs allowed/);
    });
  });

  describe('recordInteraction', () => {
    it('should create interaction record', async () => {
      const sessionId = 'session-1';
      const dto: SessionInteractionDto = {
        type: 'TEXT_ADDED',
        zoneId: 'zone-1',
        toolUsed: 'text',
        durationMs: 1000,
      };

      const session = { id: sessionId };
      const interaction = {
        id: 'interaction-1',
        sessionId,
        type: 'TEXT_ADDED',
      };

      mockPrisma.customizerSession.findUnique.mockResolvedValue(session);
      mockPrisma.customizerInteraction.create.mockResolvedValue(interaction);
      mockPrisma.customizerSession.update.mockResolvedValue({});

      const result = await service.recordInteraction(sessionId, dto);

      expect(result).toEqual(interaction);
      expect(mockPrisma.customizerInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId,
          type: 'TEXT_ADDED',
          zoneId: 'zone-1',
        }),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.customizerSession.findUnique.mockResolvedValue(null);

      await expect(
        service.recordInteraction('missing', {} as SessionInteractionDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('should set COMPLETED status', async () => {
      const sessionId = 'session-1';
      const session = { id: sessionId, userId: 'user-1' };
      const completed = {
        id: sessionId,
        status: 'COMPLETED',
        completedAt: new Date(),
      };

      mockPrisma.customizerSession.findFirst.mockResolvedValue(session);
      mockPrisma.customizerSession.update.mockResolvedValue(completed);

      const result = await service.complete(sessionId, mockUser);

      expect(result.status).toBe('COMPLETED');
      expect(result.completedAt).toBeDefined();
      expect(mockPrisma.customizerSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.customizerSession.findFirst.mockResolvedValue(null);

      await expect(
        service.complete('missing', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSharedDesign', () => {
    it('should return design by token', async () => {
      const token = 'share_token_123';
      const design = {
        id: 'design-1',
        shareToken: token,
        name: 'Shared Design',
        customizer: { id: 'customizer-1', name: 'Customizer' },
      };

      mockPrisma.customizerSavedDesign.findFirst.mockResolvedValue(design);
      mockPrisma.customizerSavedDesign.update.mockResolvedValue({});

      const result = await service.getSharedDesign(token);

      expect(result).toEqual(design);
      expect(mockPrisma.customizerSavedDesign.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          shareToken: token,
          isPublic: true,
          moderationStatus: 'APPROVED',
        }),
        include: expect.any(Object),
      });
      expect(mockPrisma.customizerSavedDesign.update).toHaveBeenCalledWith({
        where: { id: 'design-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when design not found', async () => {
      mockPrisma.customizerSavedDesign.findFirst.mockResolvedValue(null);

      await expect(service.getSharedDesign('invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getSharedDesign('invalid')).rejects.toThrow(
        /Shared design with token invalid not found/,
      );
    });
  });
});
