import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CompanySize } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string, brandId: string | null) {
    if (!brandId) {
      return { currentStep: 0, progress: null, organization: null };
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        organization: {
          include: { industry: true },
        },
      },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    const org = brand.organization;
    if (!org) {
      return {
        currentStep: 0,
        progress: null,
        organization: null,
        brand: { id: brand.id, name: brand.name },
      };
    }
    let progress = await this.prisma.onboardingProgress.findUnique({
      where: {
        organizationId_userId: { organizationId: org.id, userId },
      },
    });
    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: {
          organizationId: org.id,
          userId,
        },
      });
    }
    const currentStep = org.onboardingCompletedAt
      ? 6
      : progress.step5CompletedAt
        ? 5
        : progress.step4CompletedAt
          ? 4
          : progress.step3CompletedAt
            ? 3
            : progress.step2CompletedAt
              ? 2
              : progress.step1CompletedAt
                ? 1
                : 0;
    return {
      currentStep,
      progress: {
        step1Profile: progress.step1Profile,
        step2Industry: progress.step2Industry,
        step3UseCases: progress.step3UseCases,
        step4Goals: progress.step4Goals,
        step5Integrations: progress.step5Integrations,
        completedAt: progress.completedAt,
        skippedAt: progress.skippedAt,
      },
      organization: {
        id: org.id,
        name: org.name,
        industryId: org.industryId,
        industry: org.industry,
        onboardingCompletedAt: org.onboardingCompletedAt,
      },
      brand: { id: brand.id, name: brand.name },
    };
  }

  async saveStep(
    userId: string,
    brandId: string | null,
    stepNumber: number,
    data?: Record<string, unknown>,
  ) {
    if (!brandId) {
      throw new BadRequestException('Brand required for onboarding');
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { organization: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    let org = brand.organization;

    if (stepNumber === 1) {
      const name = (data?.companyName ?? data?.name ?? brand.name) as string;
      const companySize = data?.companySize as CompanySize | undefined;
      if (!org) {
        const slugBase = (name || 'org').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50) || 'org';
        const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
        org = await this.prisma.organization.create({
          data: {
            name: name || brand.name,
            slug,
            ...(companySize && { companySize }),
          },
        });
        await this.prisma.brand.update({
          where: { id: brandId },
          data: { organizationId: org.id },
        });
      } else {
        await this.prisma.organization.update({
          where: { id: org.id },
          data: {
            ...(name && { name }),
            ...(companySize && { companySize }),
          },
        });
      }
      const progress = await this.upsertProgress(org!.id, userId);
      await this.prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          step1Profile: (data ?? {}) as object,
          step1CompletedAt: new Date(),
        },
      });
      return { step: 1, completed: true };
    }

    if (!org) {
      throw new BadRequestException('Complete step 1 first');
    }

    if (stepNumber === 2) {
      const industrySlug = (data?.industrySlug ?? data?.industry) as string;
      if (!industrySlug) {
        throw new BadRequestException('industrySlug required for step 2');
      }
      const industry = await this.prisma.industry.findUnique({
        where: { slug: industrySlug, isActive: true },
      });
      if (!industry) {
        throw new NotFoundException(`Industry not found: ${industrySlug}`);
      }
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { industryId: industry.id },
      });
      await this.prisma.brand.update({
        where: { id: brandId },
        data: { industry: industrySlug },
      });
      const progress = await this.upsertProgress(org.id, userId);
      await this.prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          step2Industry: industrySlug,
          step2CompletedAt: new Date(),
        },
      });
      return { step: 2, completed: true };
    }

    if (stepNumber === 3) {
      const progress = await this.upsertProgress(org.id, userId);
      await this.prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          step3UseCases: (data ?? {}) as object,
          step3CompletedAt: new Date(),
        },
      });
      return { step: 3, completed: true };
    }

    if (stepNumber === 4) {
      const progress = await this.upsertProgress(org.id, userId);
      await this.prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          step4Goals: (data ?? {}) as object,
          step4CompletedAt: new Date(),
        },
      });
      return { step: 4, completed: true };
    }

    if (stepNumber === 5) {
      const progress = await this.upsertProgress(org.id, userId);
      await this.prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: {
          step5Integrations: (data ?? {}) as object,
          step5CompletedAt: new Date(),
        },
      });
      return { step: 5, completed: true };
    }

    throw new BadRequestException(`Invalid step: ${stepNumber}`);
  }

  private async upsertProgress(organizationId: string, userId: string) {
    return this.prisma.onboardingProgress.upsert({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      create: { organizationId, userId },
      update: {},
    });
  }

  async complete(userId: string, brandId: string | null) {
    if (!brandId) {
      throw new BadRequestException('Brand required');
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { organization: true },
    });
    if (!brand?.organization) {
      throw new BadRequestException('Organization not found');
    }
    const orgId = brand.organization.id;
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { onboardingCompletedAt: new Date() },
    });
    await this.prisma.onboardingProgress.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      create: {
        organizationId: orgId,
        userId,
        completedAt: new Date(),
      },
      update: { completedAt: new Date() },
    });
    await this.prisma.userDashboardPreference.upsert({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
      create: {
        userId,
        organizationId: orgId,
      },
      update: {},
    });
    this.logger.log(`Onboarding completed for user ${userId}, org ${orgId}`);
    return { completed: true };
  }

  async skip(userId: string, brandId: string | null) {
    if (!brandId) {
      throw new BadRequestException('Brand required');
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { organization: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    const other = await this.prisma.industry.findUnique({
      where: { slug: 'other', isActive: true },
    });
    let org = brand.organization;
    if (!org) {
      const slug = `org-${crypto.randomBytes(4).toString('hex')}`;
      org = await this.prisma.organization.create({
        data: {
          name: brand.name || 'My Company',
          slug,
          industryId: other?.id ?? undefined,
          onboardingCompletedAt: new Date(),
        },
      });
      await this.prisma.brand.update({
        where: { id: brandId },
        data: { organizationId: org.id },
      });
    } else {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: {
          industryId: other?.id ?? undefined,
          onboardingCompletedAt: new Date(),
        },
      });
    }
    await this.prisma.onboardingProgress.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId } },
      create: {
        organizationId: org.id,
        userId,
        step2Industry: 'other',
        skippedAt: new Date(),
      },
      update: { step2Industry: 'other', skippedAt: new Date() },
    });
    await this.prisma.userDashboardPreference.upsert({
      where: {
        userId_organizationId: { userId, organizationId: org.id },
      },
      create: { userId, organizationId: org.id },
      update: {},
    });
    this.logger.log(`Onboarding skipped for user ${userId}`);
    return { skipped: true };
  }
}
