/**
 * Tests unitaires pour PersonalizationController
 * TEST-NEW-02: Couverture des endpoints de personnalisation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationService } from './personalization.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('PersonalizationController', () => {
  let controller: PersonalizationController;
  let personalizationService: any; // Use any for mock methods
  let prismaService: any; // Use any for mock methods

  const mockRequest = { brandId: 'brand-123' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalizationController],
      providers: [
        {
          provide: PersonalizationService,
          useValue: {
            validateZoneInputs: jest.fn(),
            normalizeText: jest.fn(),
            calculateAutoFit: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            product: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    controller = module.get<PersonalizationController>(PersonalizationController);
    personalizationService = module.get(PersonalizationService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validate', () => {
    const validDto = {
      productId: 'product-123',
      zoneInputs: [{ zoneId: 'zone-1', value: 'test' }],
    };

    it('should throw ForbiddenException when product not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        controller.validate(validDto as any, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when product belongs to different brand', async () => {
      prismaService.product.findUnique.mockResolvedValue({
        brandId: 'different-brand',
      } as any);

      await expect(
        controller.validate(validDto as any, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate zone inputs when product belongs to user brand', async () => {
      prismaService.product.findUnique.mockResolvedValue({
        brandId: 'brand-123',
      } as any);
      personalizationService.validateZoneInputs.mockResolvedValue({
        valid: true,
        errors: [],
      } as any);

      const result = await controller.validate(validDto as any, mockRequest);

      expect(result.valid).toBe(true);
      expect(personalizationService.validateZoneInputs).toHaveBeenCalledWith(validDto);
    });
  });

  describe('normalize', () => {
    it('should normalize text successfully', async () => {
      const dto = { text: 'Héllo Wörld', form: 'NFD' as const };
      personalizationService.normalizeText.mockResolvedValue({
        original: 'Héllo Wörld',
        normalized: 'Hello World',
      } as any);

      const result = await controller.normalize(dto as any);

      expect(result.normalized).toBe('Hello World');
      expect(personalizationService.normalizeText).toHaveBeenCalledWith(dto);
    });
  });

  describe('autoFit', () => {
    it('should calculate auto-fit successfully', async () => {
      const dto = {
        type: 'text',
        text: 'Sample text',
        maxWidth: 200,
        maxHeight: 100,
        minFontSize: 10,
        maxFontSize: 72,
      };
      personalizationService.calculateAutoFit.mockResolvedValue({
        fontSize: 24,
        lineHeight: 1.2,
        scale: 1.0,
      } as any);

      const result = await controller.autoFit(dto as any);

      expect(result.fontSize).toBe(24);
      expect(result.scale).toBe(1.0);
      expect(personalizationService.calculateAutoFit).toHaveBeenCalledWith(dto);
    });
  });
});
