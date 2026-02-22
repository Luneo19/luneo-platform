import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SessionTrackerService } from '../analytics/session-tracker.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createMockPrismaService, createSampleSession, type ARPrismaMock } from './test-helpers';

describe('SessionTrackerService', () => {
  let service: SessionTrackerService;
  let prisma: ARPrismaMock;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionTrackerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SessionTrackerService>(SessionTrackerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create new AR session', async () => {
    const created = createSampleSession({
      id: 'session-new',
      projectId: 'proj-1',
      modelId: 'model-1',
      platform: 'ios',
      device: 'iPhone',
      browser: 'Safari',
      arMethod: 'ar-quick-look',
    });
    prisma.aRSession.create.mockResolvedValue(created);

    const result = await service.startSession({
      projectId: 'proj-1',
      modelId: 'model-1',
      platform: 'ios',
      device: 'iPhone',
      browser: 'Safari',
      arMethod: 'ar-quick-look',
    });

    expect(result.sessionId).toBe('session-new');
    expect(prisma.aRSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj-1',
        modelId: 'model-1',
        platform: 'ios',
        device: 'iPhone',
        browser: 'Safari',
        arMethod: 'ar-quick-look',
      }),
    });
  });

  it('should update session on end', async () => {
    const existing = createSampleSession({ id: 's1', endedAt: null });
    prisma.aRSession.findUnique.mockResolvedValue(existing);
    prisma.aRSession.update.mockResolvedValue({
      ...existing,
      endedAt: new Date(),
      duration: 45000,
      placementCount: 2,
    });

    const result = await service.endSession('s1', {
      duration: 45000,
      placementCount: 2,
      rotationCount: 1,
    });

    expect(result.ok).toBe(true);
    expect(prisma.aRSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({
        duration: 45000,
        placementCount: 2,
        rotationCount: 1,
      }),
    });
  });

  it('should calculate duration correctly when provided', async () => {
    const existing = createSampleSession({ id: 's1' });
    prisma.aRSession.findUnique.mockResolvedValue(existing);
    prisma.aRSession.update.mockResolvedValue({ ...existing, duration: 120000 });

    await service.endSession('s1', { duration: 120000 });

    expect(prisma.aRSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ duration: 120000 }),
      }),
    );
  });

  it('should update interaction counters', async () => {
    const existing = createSampleSession({ id: 's1' });
    prisma.aRSession.findUnique.mockResolvedValue(existing);
    prisma.aRSession.update.mockResolvedValue(existing);

    await service.endSession('s1', {
      placementCount: 3,
      rotationCount: 5,
      scaleChangeCount: 2,
      screenshotsTaken: 1,
      shareCount: 1,
      conversionAction: 'add_to_cart',
      conversionValue: 99.99,
    });

    expect(prisma.aRSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({
        placementCount: 3,
        rotationCount: 5,
        scaleChangeCount: 2,
        screenshotsTaken: 1,
        shareCount: 1,
        conversionAction: 'add_to_cart',
        conversionValue: 99.99,
      }),
    });
  });

  it('should throw NotFoundException when ending non-existent session', async () => {
    prisma.aRSession.findUnique.mockResolvedValue(null);
    await expect(service.endSession('missing', { duration: 1000 })).rejects.toThrow(NotFoundException);
    await expect(service.endSession('missing', { duration: 1000 })).rejects.toThrow(/Session not found/);
  });

  it('should return session details when brandId matches', async () => {
    const sessionWithProject = {
      ...createSampleSession({ id: 's1' }),
      project: { id: 'proj-1', name: 'P', brandId: 'brand-1' },
      model: { id: 'm1', name: 'M', thumbnailURL: null },
    };
    prisma.aRSession.findUnique.mockResolvedValue(sessionWithProject);

    const result = await service.getSessionDetails('s1', 'brand-1');
    expect(result.id).toBe('s1');
    expect(result.project.brandId).toBe('brand-1');
  });

  it('should throw ForbiddenException when brandId does not match', async () => {
    const sessionWithProject = {
      ...createSampleSession({ id: 's1' }),
      project: { id: 'proj-1', name: 'P', brandId: 'other-brand' },
      model: null,
    };
    prisma.aRSession.findUnique.mockResolvedValue(sessionWithProject);

    await expect(service.getSessionDetails('s1', 'brand-1')).rejects.toThrow(ForbiddenException);
    await expect(service.getSessionDetails('s1', 'brand-1')).rejects.toThrow(/Access denied/);
  });
});
