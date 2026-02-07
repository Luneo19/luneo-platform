/**
 * OnboardingService - Unit tests
 * Tests for onboarding progress, saveStep, complete, skip
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CompanySize } from '@prisma/client';
import * as crypto from 'crypto';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: jest.Mocked<PrismaService>;

  const userId = 'user-1';
  const brandId = 'brand-1';
  const orgId = 'org-1';
  const industryId = 'ind-1';

  const mockBrand = {
    id: brandId,
    name: 'Test Brand',
    organizationId: orgId,
    organization: {
      id: orgId,
      name: 'Test Org',
      industryId,
      industry: { id: industryId, slug: 'jewelry' },
      onboardingCompletedAt: null,
    },
  };

  const mockProgress = {
    id: 'prog-1',
    organizationId: orgId,
    userId,
    step1Profile: null,
    step1CompletedAt: null,
    step2Industry: null,
    step2CompletedAt: null,
    step3UseCases: null,
    step3CompletedAt: null,
    step4Goals: null,
    step4CompletedAt: null,
    step5Integrations: null,
    step5CompletedAt: null,
    completedAt: null,
    skippedAt: null,
  };

  beforeEach(async () => {
    jest.spyOn(crypto, 'randomBytes').mockImplementation(() => Buffer.from('abcd1234', 'hex'));
    const mockPrisma = {
      brand: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      onboardingProgress: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      industry: {
        findUnique: jest.fn(),
      },
      userDashboardPreference: {
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getProgress', () => {
    it('should return existing progress', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue({
        ...mockProgress,
        step1CompletedAt: new Date(),
      });

      const result = await service.getProgress(userId, brandId);

      expect(result.currentStep).toBe(1);
      expect(result.progress).toBeDefined();
      expect(result.organization).toBeDefined();
      expect(result.organization?.id).toBe(orgId);
      expect(prisma.onboardingProgress.findUnique).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });
      expect(prisma.onboardingProgress.create).not.toHaveBeenCalled();
    });

    it('should create new progress if not found', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.onboardingProgress.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.onboardingProgress.create as jest.Mock).mockResolvedValue(mockProgress);

      const result = await service.getProgress(userId, brandId);

      expect(result.progress).toBeDefined();
      expect(prisma.onboardingProgress.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, userId },
      });
    });

    it('should return currentStep 0 and null progress when brandId is null', async () => {
      const result = await service.getProgress(userId, null);

      expect(result.currentStep).toBe(0);
      expect(result.progress).toBeNull();
      expect(result.organization).toBeNull();
      expect(prisma.brand.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when brand not found', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProgress(userId, brandId)).rejects.toThrow(NotFoundException);
      await expect(service.getProgress(userId, brandId)).rejects.toThrow('Brand not found');
    });
  });

  describe('saveStep', () => {
    it('should save step 1 (profile) and update organization', async () => {
      const brandWithOrg = { ...mockBrand, organization: mockBrand.organization };
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(brandWithOrg);
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.onboardingProgress.update as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.organization.update as jest.Mock).mockResolvedValue(mockBrand.organization);

      const result = await service.saveStep(userId, brandId, 1, {
        companyName: 'Acme Inc',
        companySize: CompanySize.SMALL_2_10,
      });

      expect(result).toEqual({ step: 1, completed: true });
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orgId },
          data: expect.objectContaining({ name: 'Acme Inc', companySize: CompanySize.SMALL_2_10 }),
        }),
      );
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            step1Profile: expect.any(Object),
            step1CompletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should save step 1 and create organization when brand has no org', async () => {
      const brandNoOrg = { id: brandId, name: 'Brand', organizationId: null, organization: null };
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(brandNoOrg);
      const newOrg = { id: 'org-new', name: 'Acme Inc', slug: 'acme-inc-abcd1234' };
      (prisma.organization.create as jest.Mock).mockResolvedValue(newOrg);
      (prisma.brand.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({
        ...mockProgress,
        id: 'prog-1',
        organizationId: newOrg.id,
      });
      (prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({});

      const result = await service.saveStep(userId, brandId, 1, { companyName: 'Acme Inc' });

      expect(result).toEqual({ step: 1, completed: true });
      expect(prisma.organization.create).toHaveBeenCalled();
      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: brandId },
        data: { organizationId: newOrg.id },
      });
    });

    it('should save step 2 (industry) and update organization.industryId', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue({
        id: industryId,
        slug: 'jewelry',
        isActive: true,
      });
      (prisma.organization.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({});

      const result = await service.saveStep(userId, brandId, 2, { industrySlug: 'jewelry' });

      expect(result).toEqual({ step: 2, completed: true });
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { industryId },
      });
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            step2Industry: 'jewelry',
            step2CompletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should save step 3 (use cases)', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.onboardingProgress.update as jest.Mock).mockResolvedValue({});

      const result = await service.saveStep(userId, brandId, 3, { useCases: ['configurator'] });

      expect(result).toEqual({ step: 3, completed: true });
      expect(prisma.onboardingProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            step3UseCases: { useCases: ['configurator'] },
            step3CompletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw for invalid step number', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);

      await expect(service.saveStep(userId, brandId, 99)).rejects.toThrow(BadRequestException);
      await expect(service.saveStep(userId, brandId, 99)).rejects.toThrow('Invalid step: 99');
    });

    it('should throw when brandId is null', async () => {
      await expect(service.saveStep(userId, null, 1)).rejects.toThrow(BadRequestException);
      await expect(service.saveStep(userId, null, 1)).rejects.toThrow('Brand required for onboarding');
    });

    it('should throw when step 2 missing industrySlug', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);

      await expect(service.saveStep(userId, brandId, 2, {})).rejects.toThrow(BadRequestException);
      await expect(service.saveStep(userId, brandId, 2, {})).rejects.toThrow('industrySlug required for step 2');
    });
  });

  describe('complete', () => {
    it('should mark onboarding as completed', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.organization.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      const result = await service.complete(userId, brandId);

      expect(result).toEqual({ completed: true });
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { onboardingCompletedAt: expect.any(Date) },
      });
      expect(prisma.onboardingProgress.upsert).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: orgId, userId } },
        create: expect.objectContaining({ organizationId: orgId, userId, completedAt: expect.any(Date) }),
        update: { completedAt: expect.any(Date) },
      });
    });

    it('should create UserDashboardPreference', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.organization.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      await service.complete(userId, brandId);

      expect(prisma.userDashboardPreference.upsert).toHaveBeenCalledWith({
        where: { userId_organizationId: { userId, organizationId: orgId } },
        create: { userId, organizationId: orgId },
        update: {},
      });
    });

    it('should throw when brandId is null', async () => {
      await expect(service.complete(userId, null)).rejects.toThrow(BadRequestException);
    });

    it('should throw when organization not found', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue({
        id: brandId,
        name: 'Brand',
        organization: null,
      });

      await expect(service.complete(userId, brandId)).rejects.toThrow(BadRequestException);
      await expect(service.complete(userId, brandId)).rejects.toThrow('Organization not found');
    });
  });

  describe('skip', () => {
    it('should set industry to "other"', async () => {
      const otherIndustry = { id: 'ind-other', slug: 'other', isActive: true };
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue(otherIndustry);
      (prisma.organization.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      const result = await service.skip(userId, brandId);

      expect(result).toEqual({ skipped: true });
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: expect.objectContaining({
          industryId: otherIndustry.id,
          onboardingCompletedAt: expect.any(Date),
        }),
      });
      expect(prisma.onboardingProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ step2Industry: 'other', skippedAt: expect.any(Date) }),
        }),
      );
    });

    it('should mark as completed', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrand);
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue({ id: 'ind-other', slug: 'other' });
      (prisma.organization.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      const result = await service.skip(userId, brandId);

      expect(result.skipped).toBe(true);
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ onboardingCompletedAt: expect.any(Date) }),
        }),
      );
    });

    it('should create org and set industry other when brand has no org', async () => {
      const brandNoOrg = { id: brandId, name: 'Brand', organization: null };
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(brandNoOrg);
      (prisma.industry.findUnique as jest.Mock).mockResolvedValue({ id: 'ind-other', slug: 'other' });
      const newOrg = { id: 'org-new', name: 'Brand', slug: 'org-abcd1234', industryId: 'ind-other', onboardingCompletedAt: new Date() };
      (prisma.organization.create as jest.Mock).mockResolvedValue(newOrg);
      (prisma.brand.update as jest.Mock).mockResolvedValue({});
      (prisma.onboardingProgress.upsert as jest.Mock).mockResolvedValue({});
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      const result = await service.skip(userId, brandId);

      expect(result).toEqual({ skipped: true });
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            industryId: 'ind-other',
            onboardingCompletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw when brandId is null', async () => {
      await expect(service.skip(userId, null)).rejects.toThrow(BadRequestException);
    });

    it('should throw when brand not found', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.skip(userId, brandId)).rejects.toThrow(NotFoundException);
      await expect(service.skip(userId, brandId)).rejects.toThrow('Brand not found');
    });
  });
});
