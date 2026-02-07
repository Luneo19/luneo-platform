/**
 * Configurator3DSessionService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Configurator3DSessionService } from './configurator-3d-session.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DSessionStatus } from '@prisma/client';

describe('Configurator3DSessionService', () => {
  let service: Configurator3DSessionService;
  let prisma: PrismaService;

  const mockPrisma = {
    configurator3DConfiguration: {
      findUnique: jest.fn(),
    },
    configurator3DSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Configurator3DSessionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<Configurator3DSessionService>(Configurator3DSessionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should create session when configuration exists and is active', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: 'cfg1',
        isActive: true,
      });
      const session = {
        id: 's1',
        sessionId: 'cfg3d_abc',
        visitorId: 'visitor-1',
        status: Configurator3DSessionStatus.ACTIVE,
        configuration: {},
      };
      mockPrisma.configurator3DSession.create.mockResolvedValue(session);

      const result = await service.startSession('cfg1', 'visitor-1');

      expect(result).toEqual(session);
      expect(mockPrisma.configurator3DSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configurationId: 'cfg1',
          visitorId: 'visitor-1',
          status: Configurator3DSessionStatus.ACTIVE,
        }),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue(null);

      await expect(service.startSession('missing', 'v1')).rejects.toThrow(NotFoundException);
      await expect(service.startSession('missing', 'v1')).rejects.toThrow(
        /Configurator 3D configuration with ID missing not found/,
      );
    });

    it('should throw BadRequestException when configuration is not active', async () => {
      mockPrisma.configurator3DConfiguration.findUnique.mockResolvedValue({
        id: 'cfg1',
        isActive: false,
      });

      await expect(service.startSession('cfg1', 'v1')).rejects.toThrow(BadRequestException);
      await expect(service.startSession('cfg1', 'v1')).rejects.toThrow(
        'Configurator 3D configuration is not active',
      );
    });
  });

  describe('updateSession', () => {
    it('should update session state', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({ id: 's1' });
      const updated = {
        id: 's1',
        sessionId: 'cfg3d_abc',
        status: Configurator3DSessionStatus.ACTIVE,
        state: { color: '#fff' },
        previewImageUrl: 'https://img.png',
      };
      mockPrisma.configurator3DSession.update.mockResolvedValue(updated);

      const result = await service.updateSession('cfg3d_abc', { color: '#fff' }, 'https://img.png');

      expect(result).toEqual(updated);
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { state: { color: '#fff' }, previewImageUrl: 'https://img.png' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.updateSession('missing', {})).rejects.toThrow(NotFoundException);
      await expect(service.updateSession('missing', {})).rejects.toThrow(
        'Session with ID missing not found',
      );
    });
  });

  describe('saveSession', () => {
    it('should mark session as saved', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue({ id: 's1' });
      const saved = {
        id: 's1',
        sessionId: 'cfg3d_abc',
        status: Configurator3DSessionStatus.SAVED,
        savedAt: new Date(),
      };
      mockPrisma.configurator3DSession.update.mockResolvedValue(saved);

      const result = await service.saveSession('cfg3d_abc');

      expect(result.status).toBe(Configurator3DSessionStatus.SAVED);
      expect(mockPrisma.configurator3DSession.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ status: Configurator3DSessionStatus.SAVED }),
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.saveSession('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return session when found', async () => {
      const session = {
        id: 's1',
        sessionId: 'cfg3d_abc',
        visitorId: 'v1',
        status: Configurator3DSessionStatus.ACTIVE,
        configuration: {},
      };
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(session);

      const result = await service.findOne('cfg3d_abc');

      expect(result).toEqual(session);
      expect(mockPrisma.configurator3DSession.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'cfg3d_abc' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.configurator3DSession.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing')).rejects.toThrow(
        'Session with ID missing not found',
      );
    });
  });
});
