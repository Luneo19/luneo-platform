import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SpecsService } from '../specs.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SpecBuilderService } from '../services/spec-builder.service';
import { SpecCanonicalizerService } from '../services/spec-canonicalizer.service';
import { SpecHasherService } from '../services/spec-hasher.service';

describe('SpecsService', () => {
  let service: SpecsService;

  const mockPrisma = {
    designSpec: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockSpecBuilder = {
    build: jest.fn(),
  };

  const mockCanonicalizer = {
    canonicalize: jest.fn((x) => x),
  };

  const mockHasher = {
    hash: jest.fn().mockReturnValue('abc123hash'),
  };

  const brandId = 'brand-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SpecBuilderService, useValue: mockSpecBuilder },
        { provide: SpecCanonicalizerService, useValue: mockCanonicalizer },
        { provide: SpecHasherService, useValue: mockHasher },
      ],
    }).compile();

    service = module.get<SpecsService>(SpecsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGet', () => {
    it('should return existing spec when specHash matches and product belongs to brand', async () => {
      const builtSpec = { productId: 'prod-1', zones: [] };
      mockSpecBuilder.build.mockResolvedValue(builtSpec);
      mockCanonicalizer.canonicalize.mockReturnValue(builtSpec);
      mockHasher.hash.mockReturnValue('existing-hash');
      const existingSpec = {
        id: 'spec-1',
        specHash: 'existing-hash',
        productId: 'prod-1',
        product: { id: 'prod-1', name: 'P', brandId },
      };
      mockPrisma.designSpec.findUnique.mockResolvedValue(existingSpec);
      const result = await service.createOrGet(
        { productId: 'prod-1', zoneInputs: {} },
        brandId,
      );
      expect(result).toEqual(existingSpec);
      expect(mockPrisma.designSpec.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when existing spec belongs to another brand', async () => {
      mockSpecBuilder.build.mockResolvedValue({ productId: 'prod-1', zones: [] });
      mockCanonicalizer.canonicalize.mockReturnValue({});
      mockHasher.hash.mockReturnValue('hash');
      mockPrisma.designSpec.findUnique.mockResolvedValue({
        specHash: 'hash',
        product: { brandId: 'other-brand' },
      });
      await expect(
        service.createOrGet({ productId: 'prod-1', zoneInputs: {} }, brandId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new spec when no existing and product belongs to brand', async () => {
      mockSpecBuilder.build.mockResolvedValue({ productId: 'prod-1', zones: [] });
      mockCanonicalizer.canonicalize.mockReturnValue({});
      mockHasher.hash.mockReturnValue('new-hash');
      mockPrisma.designSpec.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        brandId,
      });
      const created = {
        id: 'spec-1',
        specHash: 'new-hash',
        productId: 'prod-1',
        product: { id: 'prod-1', name: 'P', brandId },
      };
      mockPrisma.designSpec.create.mockResolvedValue(created);
      const result = await service.createOrGet(
        { productId: 'prod-1', zoneInputs: {} },
        brandId,
      );
      expect(result).toEqual(created);
      expect(mockPrisma.designSpec.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found or wrong brand', async () => {
      mockSpecBuilder.build.mockResolvedValue({});
      mockCanonicalizer.canonicalize.mockReturnValue({});
      mockHasher.hash.mockReturnValue('h');
      mockPrisma.designSpec.findUnique.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.createOrGet({ productId: 'prod-1', zoneInputs: {} }, brandId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByHash', () => {
    it('should return spec when found and brand matches', async () => {
      const spec = {
        specHash: 'abc',
        product: { brandId },
      };
      mockPrisma.designSpec.findUnique.mockResolvedValue(spec);
      const result = await service.findByHash('abc', brandId);
      expect(result).toEqual(spec);
      expect(mockPrisma.designSpec.findUnique).toHaveBeenCalledWith({
        where: { specHash: 'abc' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when spec not found', async () => {
      mockPrisma.designSpec.findUnique.mockResolvedValue(null);
      await expect(service.findByHash('missing', brandId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when spec belongs to another brand', async () => {
      mockPrisma.designSpec.findUnique.mockResolvedValue({
        specHash: 'abc',
        product: { brandId: 'other' },
      });
      await expect(service.findByHash('abc', brandId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validate', () => {
    it('should return valid when spec has productId and zones', async () => {
      const result = await service.validate({
        productId: 'prod-1',
        zones: [],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid when spec is not an object', async () => {
      const result = await service.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spec must be an object');
    });

    it('should return invalid when productId or zones missing', async () => {
      const result = await service.validate({ productId: 'p1' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spec must have productId and zones');
    });
  });
});
