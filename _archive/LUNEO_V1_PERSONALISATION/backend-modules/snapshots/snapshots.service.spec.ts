/**
 * SnapshotsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

describe('SnapshotsService', () => {
  let service: SnapshotsService;
  let _prisma: PrismaService;

  const mockPrisma = {
    designSpec: {
      findUnique: jest.fn(),
    },
    snapshot: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const brandId = 'brand-1';
  const userId = 'user-1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SnapshotsService>(SnapshotsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create snapshot when spec exists and belongs to brand', async () => {
      const spec = {
        id: 'spec1',
        specHash: 'abc123',
        spec: { version: 1 },
        product: { id: 'p1', brandId },
      };
      mockPrisma.designSpec.findUnique.mockResolvedValue(spec);
      mockPrisma.snapshot.findFirst.mockResolvedValue(null);
      const created = {
        id: 'snap1',
        specId: spec.id,
        specHash: 'abc123',
        specData: spec.spec,
        spec: { product: spec.product },
      };
      mockPrisma.snapshot.create.mockResolvedValue(created);

      const dto: CreateSnapshotDto = { specHash: 'abc123' };
      const result = await service.create(dto, brandId, userId);

      expect(result).toEqual(created);
      expect(mockPrisma.snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          specId: spec.id,
          specHash: dto.specHash,
          specData: spec.spec,
          createdBy: userId,
        }),
        include: expect.any(Object),
      });
    });

    it('should return existing snapshot when idempotent match', async () => {
      const spec = {
        id: 'spec1',
        specHash: 'abc123',
        spec: {},
        product: { id: 'p1', brandId },
      };
      mockPrisma.designSpec.findUnique.mockResolvedValue(spec);
      const existing = { id: 'snap1', specHash: 'abc123', spec: { product: spec.product } };
      mockPrisma.snapshot.findFirst.mockResolvedValue(existing);

      const dto: CreateSnapshotDto = { specHash: 'abc123' };
      const result = await service.create(dto, brandId, userId);

      expect(result).toEqual(existing);
      expect(mockPrisma.snapshot.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when spec not found', async () => {
      mockPrisma.designSpec.findUnique.mockResolvedValue(null);

      await expect(service.create({ specHash: 'missing' }, brandId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create({ specHash: 'missing' }, brandId, userId)).rejects.toThrow(
        'Spec not found',
      );
    });

    it('should throw NotFoundException when spec belongs to another brand', async () => {
      mockPrisma.designSpec.findUnique.mockResolvedValue({
        id: 'spec1',
        specHash: 'abc',
        spec: {},
        product: { id: 'p1', brandId: 'other-brand' },
      });

      await expect(service.create({ specHash: 'abc' }, brandId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create({ specHash: 'abc' }, brandId, userId)).rejects.toThrow(
        'Spec not found',
      );
    });
  });

  describe('findOne', () => {
    it('should return snapshot when found and brand matches', async () => {
      const snapshot = {
        id: 'snap1',
        spec: { product: { id: 'p1', brandId, name: 'P' } },
      };
      mockPrisma.snapshot.findUnique.mockResolvedValue(snapshot);

      const result = await service.findOne('snap1', brandId);

      expect(result).toEqual(snapshot);
      expect(mockPrisma.snapshot.findUnique).toHaveBeenCalledWith({
        where: { id: 'snap1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when snapshot not found', async () => {
      mockPrisma.snapshot.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing', brandId)).rejects.toThrow('Snapshot not found');
    });

    it('should throw NotFoundException when snapshot belongs to another brand', async () => {
      mockPrisma.snapshot.findUnique.mockResolvedValue({
        id: 'snap1',
        spec: { product: { brandId: 'other-brand' } },
      });

      await expect(service.findOne('snap1', brandId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('snap1', brandId)).rejects.toThrow('Snapshot not found');
    });
  });

  describe('lock', () => {
    it('should lock snapshot when not already locked', async () => {
      const snapshot = {
        id: 'snap1',
        isLocked: false,
        spec: { product: { brandId } },
      };
      mockPrisma.snapshot.findUnique.mockResolvedValue(snapshot);
      const updated = { ...snapshot, isLocked: true };
      mockPrisma.snapshot.update.mockResolvedValue(updated);

      const result = await service.lock('snap1', brandId, userId);

      expect(result.isLocked).toBe(true);
      expect(mockPrisma.snapshot.update).toHaveBeenCalledWith({
        where: { id: 'snap1' },
        data: expect.objectContaining({ isLocked: true }),
      });
    });

    it('should throw ForbiddenException when snapshot already locked', async () => {
      const snapshot = {
        id: 'snap1',
        isLocked: true,
        spec: { product: { brandId } },
      };
      mockPrisma.snapshot.findUnique.mockResolvedValue(snapshot);

      await expect(service.lock('snap1', brandId, userId)).rejects.toThrow(ForbiddenException);
      await expect(service.lock('snap1', brandId, userId)).rejects.toThrow(
        'Snapshot already locked',
      );
    });
  });
});
