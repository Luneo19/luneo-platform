import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const org = user.memberships?.[0]?.organization;
    const raw = (org?.onboardingData as Record<string, unknown>) ?? {};
    const steps = (raw.v2Steps as Record<string, unknown>) ?? {};

    let currentStep = 0;
    for (let i = 1; i <= 5; i++) {
      if (steps[`step${i}_completed`]) currentStep = i;
    }
    if (raw.completed === true || (raw.onboardingStatus as Record<string, unknown>)?.completed === true) {
      currentStep = 6;
    }

    return {
      currentStep,
      progress: {
        id: org?.id ?? '',
        organizationId: org?.id ?? '',
        userId,
        step1Profile: (steps.step1 as Record<string, unknown>) ?? null,
        step1CompletedAt: (steps.step1_completed as string) ?? null,
        step2Industry: (steps.step2_industry as string) ?? null,
        step2CompletedAt: (steps.step2_completed as string) ?? null,
        step3UseCases: (steps.step3 as Record<string, unknown>) ?? null,
        step3CompletedAt: (steps.step3_completed as string) ?? null,
        step4Goals: (steps.step4 as Record<string, unknown>) ?? null,
        step4CompletedAt: (steps.step4_completed as string) ?? null,
        step5Integrations: (steps.step5 as Record<string, unknown>) ?? null,
        step5CompletedAt: (steps.step5_completed as string) ?? null,
        completedAt: (raw.completed_at as string) ?? null,
        skippedAt: (raw.skipped_at as string) ?? null,
      },
    };
  }

  async saveStep(userId: string, stepNumber: number, data: Record<string, unknown>) {
    if (stepNumber < 1 || stepNumber > 5) {
      throw new BadRequestException(`Invalid step number: ${stepNumber}. Must be 1-5.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    let orgId = user.memberships?.[0]?.organizationId;
    const org = user.memberships?.[0]?.organization;
    const rawOnboarding = (org?.onboardingData as Record<string, unknown>) ?? {};
    const v2Steps = ((rawOnboarding.v2Steps as Record<string, unknown>) ?? {}) as Record<string, unknown>;

    if (stepNumber === 1) {
      const payload = data.data ? (data.data as Record<string, unknown>) : data;
      const firstName = (payload.firstName as string) ?? '';
      const lastName = (payload.lastName as string) ?? '';
      const fullName = (payload.name as string) ?? `${firstName} ${lastName}`.trim();
      const companyName = (payload.companyName as string) ?? '';

      if (firstName || lastName) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        });
      }

      if (companyName && !orgId) {
        const slugBase = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50) || 'brand';
        const slug = `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;
        const newOrg = await this.prisma.organization.create({
          data: { name: companyName, slug, plan: 'FREE' },
        });
        orgId = newOrg.id;
        await this.prisma.organizationMember.create({
          data: { userId, organizationId: newOrg.id, role: 'OWNER' },
        });
      } else if (companyName && orgId) {
        await this.prisma.organization.update({
          where: { id: orgId },
          data: { name: companyName },
        });
      }

      v2Steps.step1 = { name: fullName, firstName, lastName, companyName, website: payload.website ?? '' };
      v2Steps.step1_completed = new Date().toISOString();
    } else if (stepNumber === 2) {
      const payload = data.data ? (data.data as Record<string, unknown>) : data;
      v2Steps.step2_industry = (payload.industrySlug as string) ?? (payload.sector as string) ?? '';
      v2Steps.step2 = payload;
      v2Steps.step2_completed = new Date().toISOString();
    } else if (stepNumber === 3) {
      const payload = data.data ? (data.data as Record<string, unknown>) : data;
      v2Steps.step3 = payload;
      v2Steps.step3_completed = new Date().toISOString();
    } else if (stepNumber === 4) {
      const payload = data.data ? (data.data as Record<string, unknown>) : data;
      v2Steps.step4 = payload;
      v2Steps.step4_completed = new Date().toISOString();
    } else if (stepNumber === 5) {
      const payload = data.data ? (data.data as Record<string, unknown>) : data;
      v2Steps.step5 = payload;
      v2Steps.step5_completed = new Date().toISOString();
    }

    if (orgId) {
      const updatedOnboarding = { ...rawOnboarding, v2Steps };
      await this.prisma.organization.update({
        where: { id: orgId },
        data: { onboardingData: updatedOnboarding as Prisma.InputJsonValue },
      });
    }

    return { success: true, step: stepNumber };
  }

  async complete(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const orgId = user.memberships?.[0]?.organizationId;
    if (!orgId) throw new BadRequestException('No organization found');

    const raw = (user.memberships[0].organization.onboardingData as Record<string, unknown>) ?? {};
    const onboardingStatus = ((raw.onboardingStatus as Record<string, unknown>) ?? {}) as Record<string, unknown>;

    const updated = {
      ...raw,
      completed: true,
      completed_at: new Date().toISOString(),
      onboardingStatus: {
        ...onboardingStatus,
        completed: true,
        completed_at: new Date().toISOString(),
      },
    };

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        onboardingData: updated as Prisma.InputJsonValue,
        onboardingCompleted: true,
      },
    });

    return { success: true, completed: true };
  }

  async skip(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const orgId = user.memberships?.[0]?.organizationId;
    if (!orgId) throw new BadRequestException('No organization found');

    const raw = (user.memberships[0].organization.onboardingData as Record<string, unknown>) ?? {};
    const onboardingStatus = ((raw.onboardingStatus as Record<string, unknown>) ?? {}) as Record<string, unknown>;

    const updated = {
      ...raw,
      completed: true,
      skipped: true,
      skipped_at: new Date().toISOString(),
      onboardingStatus: {
        ...onboardingStatus,
        completed: true,
        skipped: true,
      },
    };

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        onboardingData: updated as Prisma.InputJsonValue,
        onboardingCompleted: true,
      },
    });

    return { success: true, skipped: true };
  }
}
