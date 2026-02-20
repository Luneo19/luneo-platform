/**
 * @fileoverview Tests unitaires pour WhiteLabelService
 * @module WhiteLabelService.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhiteLabelService } from './white-label.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

describe('WhiteLabelService', () => {
  let service: WhiteLabelService;
  let prismaService: Record<string, unknown>;
  let _cacheService: jest.Mocked<SmartCacheService>;

  const mockBrand = {
    id: 'brand-123',
    name: 'Test Brand',
    whiteLabel: true,
  };

  const mockTheme = {
    id: 'theme-123',
    brandId: 'brand-123',
    name: 'Custom Theme',
    primaryColor: '#FF5733',
    secondaryColor: '#33FF57',
    accentColor: '#3357FF',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    fontFamily: 'Inter',
    borderRadius: '8px',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      brand: {
        findUnique: jest.fn(),
      },
      customDomain: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      customTheme: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidateTags: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhiteLabelService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SmartCacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<WhiteLabelService>(WhiteLabelService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(SmartCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTheme', () => {
    const validThemeData = {
      brandId: 'brand-123',
      name: 'Custom Theme',
      primaryColor: '#FF5733',
      secondaryColor: '#33FF57',
      accentColor: '#3357FF',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
    };

    it('should create theme with valid data', async () => {
      prismaService.brand.findUnique.mockResolvedValue(mockBrand);
      prismaService.customTheme.updateMany.mockResolvedValue({ count: 0 });
      prismaService.customTheme.create.mockResolvedValue(mockTheme);

      const result = await service.createTheme(validThemeData);

      expect(result).toBeDefined();
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({
        where: { id: validThemeData.brandId },
        select: { id: true, whiteLabel: true },
      });
    });

    it('should throw BadRequestException when brandId is missing', async () => {
      await expect(service.createTheme({ ...validThemeData, brandId: '' } as unknown)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when color format is invalid', async () => {
      await expect(
        service.createTheme({ ...validThemeData, primaryColor: 'invalid-color' } as unknown),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when brand does not exist', async () => {
      prismaService.brand.findUnique.mockResolvedValue(null);

      await expect(service.createTheme(validThemeData)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when white-label is not enabled', async () => {
      prismaService.brand.findUnique.mockResolvedValue({ ...mockBrand, whiteLabel: false });

      await expect(service.createTheme(validThemeData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveTheme', () => {
    it('should return active theme when exists', async () => {
      prismaService.customTheme.findFirst.mockResolvedValue(mockTheme);

      const result = await service.getActiveTheme('brand-123');

      expect(result).toBeDefined();
      expect(result.brandId).toBe('brand-123');
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException when brandId is missing', async () => {
      await expect(service.getActiveTheme('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no active theme exists', async () => {
      prismaService.customTheme.findFirst.mockResolvedValue(null);

      await expect(service.getActiveTheme('brand-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCustomDomain', () => {
    const validDomainData = {
      brandId: 'brand-123',
      domain: 'custom.example.com',
    };

    it('should create domain with valid data', async () => {
      const createdDomain = {
        id: 'domain-123',
        brandId: 'brand-123',
        domain: 'custom.example.com',
        isActive: false,
        sslCertificate: null,
        sslExpiresAt: null,
      };
      
      prismaService.brand.findUnique.mockResolvedValue(mockBrand);
      prismaService.customDomain.findUnique.mockResolvedValue(null); // No existing domain
      prismaService.customDomain.create.mockResolvedValue(createdDomain);

      const result = await service.createCustomDomain(validDomainData);

      expect(result).toBeDefined();
      expect(result.domain).toBe('custom.example.com');
    });

    it('should throw BadRequestException when domain format is invalid', async () => {
      await expect(
        service.createCustomDomain({ ...validDomainData, domain: 'invalid domain' } as unknown),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when domain is already taken', async () => {
      prismaService.brand.findUnique.mockResolvedValue(mockBrand);
      // Mock that the domain already exists
      prismaService.customDomain.findUnique.mockResolvedValue({ id: 'existing-domain', domain: 'custom.example.com' });

      await expect(service.createCustomDomain(validDomainData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('activateDomain', () => {
    it('should activate domain successfully', async () => {
      const mockDomain = { id: 'domain-123', isActive: false, brandId: 'brand-123' };
      const activatedDomain = { ...mockDomain, isActive: true };
      
      prismaService.customDomain.findUnique.mockResolvedValue(mockDomain);
      prismaService.customDomain.update.mockResolvedValue(activatedDomain);

      const result = await service.activateDomain('domain-123');

      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestException when domainId is missing', async () => {
      await expect(service.activateDomain('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when domain does not exist', async () => {
      prismaService.customDomain.findUnique.mockResolvedValue(null);

      await expect(service.activateDomain('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
