/**
 * IPClaimsService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { IPClaimsService, IPClaim } from '../services/ip-claims.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AppErrorFactory } from '@/common/errors/app-error';

describe('IPClaimsService', () => {
  let service: IPClaimsService;
  let prisma: PrismaService;

  const mockPrisma = {
    design: { findUnique: jest.fn(), update: jest.fn() },
    iPClaim: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IPClaimsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IPClaimsService>(IPClaimsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createClaim', () => {
    it('should throw when design not found', async () => {
      mockPrisma.design.findUnique.mockResolvedValue(null);

      await expect(
        service.createClaim({
          claimantName: 'Jane',
          claimantEmail: 'jane@example.com',
          claimantType: 'copyright',
          designId: 'design-missing',
          description: 'Infringement',
          evidence: [],
        }),
      ).rejects.toThrow();
      expect(mockPrisma.iPClaim.create).not.toHaveBeenCalled();
    });

    it('should create claim and block design', async () => {
      mockPrisma.design.findUnique.mockResolvedValue({ id: 'd1', brandId: 'b1', status: 'PUBLISHED' });
      const created = {
        id: 'claim-1',
        claimantName: 'Jane',
        claimantEmail: 'jane@example.com',
        claimantType: 'copyright',
        designId: 'd1',
        description: 'Infringement',
        evidence: ['https://proof.com'],
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        resolution: null,
      };
      mockPrisma.iPClaim.create.mockResolvedValue(created);
      mockPrisma.design.update.mockResolvedValue({});

      const result = await service.createClaim({
        claimantName: 'Jane',
        claimantEmail: 'jane@example.com',
        claimantType: 'copyright',
        designId: 'd1',
        description: 'Infringement',
        evidence: ['https://proof.com'],
      });

      expect(result.id).toBe('claim-1');
      expect(result.status).toBe('pending');
      expect(mockPrisma.iPClaim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            designId: 'd1',
            claimantName: 'Jane',
            claimantType: 'copyright',
          }),
        }),
      );
      expect(mockPrisma.design.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: expect.objectContaining({
          isBlocked: true,
          blockedReason: 'IP claim filed',
        }),
      });
    });
  });

  describe('reviewClaim', () => {
    it('should throw when claim not found', async () => {
      mockPrisma.iPClaim.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewClaim('claim-missing', 'rejected', 'admin-1', 'Invalid'),
      ).rejects.toThrow();
      expect(mockPrisma.iPClaim.update).not.toHaveBeenCalled();
    });

    it('should update claim and unblock design when rejected', async () => {
      const existing = {
        id: 'claim-1',
        designId: 'd1',
        status: 'pending',
        claimantName: 'J',
        claimantEmail: 'j@x.com',
        claimantType: 'copyright' as const,
        description: 'x',
        evidence: [],
        reviewedBy: null,
        reviewedAt: null,
        resolution: null,
      };
      mockPrisma.iPClaim.findUnique.mockResolvedValue(existing);
      mockPrisma.iPClaim.update.mockResolvedValue({
        ...existing,
        status: 'rejected',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
        resolution: 'Invalid',
      });
      mockPrisma.design.update.mockResolvedValue({});

      const result = await service.reviewClaim('claim-1', 'rejected', 'admin-1', 'Invalid');

      expect(result.status).toBe('rejected');
      expect(mockPrisma.design.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: expect.objectContaining({
          isBlocked: false,
          blockedReason: null,
        }),
      });
    });
  });

  describe('getClaim', () => {
    it('should return null when claim not found', async () => {
      mockPrisma.iPClaim.findUnique.mockResolvedValue(null);

      const result = await service.getClaim('claim-missing');

      expect(result).toBeNull();
    });

    it('should return claim when found', async () => {
      const row = {
        id: 'claim-1',
        claimantName: 'J',
        claimantEmail: 'j@x.com',
        claimantType: 'copyright' as const,
        designId: 'd1',
        description: 'x',
        evidence: [],
        status: 'pending' as const,
        reviewedBy: null,
        reviewedAt: null,
        resolution: null,
      };
      mockPrisma.iPClaim.findUnique.mockResolvedValue(row);

      const result = await service.getClaim('claim-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('claim-1');
      expect(result!.status).toBe('pending');
    });
  });

  describe('listClaims', () => {
    it('should return list of claims', async () => {
      const rows = [
        {
          id: 'c1',
          claimantName: 'J',
          claimantEmail: 'j@x.com',
          claimantType: 'copyright' as const,
          designId: 'd1',
          description: 'x',
          evidence: [],
          status: 'pending' as const,
          reviewedBy: null,
          reviewedAt: null,
          resolution: null,
        },
      ];
      mockPrisma.iPClaim.findMany.mockResolvedValue(rows);

      const result = await service.listClaims(undefined, 50, undefined);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
      expect(mockPrisma.iPClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
    });
  });
});
