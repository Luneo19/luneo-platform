import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  completedSteps: string[];
  missingItems: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: Date;
  data?: Record<string, unknown>;
}

export interface OnboardingChecklist {
  items: ChecklistItem[];
  overallComplete: boolean;
}

const ONBOARDING_STEP_IDS = ['profile', 'industry', 'useCases', 'goals', 'integrations'] as const;

@Injectable()
export class OnboardingEnhancedService {
  private readonly logger = new Logger(OnboardingEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns current wizard step, completion, and missing items (user or org onboarding).
   */
  async getWizardState(userId: string): Promise<WizardState> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, brandId: true, brand: { select: { organizationId: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organizationId = user.brand?.organizationId ?? null;
    const totalSteps = ONBOARDING_STEP_IDS.length;
    let currentStep = 0;
    const completedSteps: string[] = [];
    const missingItems: string[] = [];

    if (organizationId) {
      const progress = await this.prisma.onboardingProgress.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: userId },
        },
      });

      if (progress) {
        const steps = [
          { key: 'step1Profile', stepId: 'profile', completedAt: progress.step1CompletedAt },
          { key: 'step2Industry', stepId: 'industry', completedAt: progress.step2CompletedAt },
          { key: 'step3UseCases', stepId: 'useCases', completedAt: progress.step3CompletedAt },
          { key: 'step4Goals', stepId: 'goals', completedAt: progress.step4CompletedAt },
          { key: 'step5Integrations', stepId: 'integrations', completedAt: progress.step5CompletedAt },
        ];
        for (let i = 0; i < steps.length; i++) {
          if (steps[i].completedAt) {
            completedSteps.push(steps[i].stepId);
            currentStep = i + 1;
          } else {
            if (currentStep === 0) currentStep = i + 1;
            missingItems.push(steps[i].stepId);
          }
        }
        if (progress.completedAt) currentStep = totalSteps;
      } else {
        currentStep = 1;
        missingItems.push(...ONBOARDING_STEP_IDS);
      }
    } else {
      const brand = await this.prisma.brand.findFirst({
        where: { users: { some: { id: userId } } },
        select: { id: true, name: true, logo: true, website: true, settings: true },
      });
      currentStep = 1;
      if (brand?.name) completedSteps.push('profile');
      else missingItems.push('profile');
      if (brand?.website) completedSteps.push('goals');
      else missingItems.push('goals');
      if (!brand?.settings || !(brand.settings as Record<string, unknown>)?.sampleDataSeeded) {
        missingItems.push('integrations');
      }
    }

    return {
      currentStep,
      totalSteps,
      completed: completedSteps.length >= totalSteps,
      completedSteps: [...completedSteps],
      missingItems: missingItems.length ? missingItems : [...missingItems],
    };
  }

  /**
   * Mark a wizard step as complete with associated data.
   */
  async completeStep(
    userId: string,
    stepId: string,
    data: Record<string, unknown>,
  ): Promise<WizardState> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, brandId: true, brand: { select: { organizationId: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const organizationId = user.brand?.organizationId;
    if (!organizationId) {
      const brandId = user.brandId;
      if (!brandId) throw new BadRequestException('User has no brand or organization');
      const current = (await this.prisma.brand.findUnique({ where: { id: brandId }, select: { settings: true } }))?.settings as Record<string, unknown> | null ?? {};
      const merged = { ...current, [`onboarding_${stepId}`]: { completedAt: new Date().toISOString(), data } } as Prisma.InputJsonValue;
      await this.prisma.brand.update({
        where: { id: brandId },
        data: { settings: merged },
      });
      return this.getWizardState(userId);
    }

    const stepMap = {
      profile: { completedAt: 'step1CompletedAt' as const, payload: 'step1Profile' as const },
      industry: { completedAt: 'step2CompletedAt' as const, payload: 'step2Industry' as const },
      useCases: { completedAt: 'step3CompletedAt' as const, payload: 'step3UseCases' as const },
      goals: { completedAt: 'step4CompletedAt' as const, payload: 'step4Goals' as const },
      integrations: { completedAt: 'step5CompletedAt' as const, payload: 'step5Integrations' as const },
    };
    const step = stepMap[stepId as keyof typeof stepMap];
    if (!step) {
      throw new BadRequestException(`Unknown step: ${stepId}`);
    }

    const payloadValue = step.payload === 'step2Industry' || step.payload === 'step4Goals'
      ? (typeof data?.value === 'string' ? data.value : JSON.stringify(data))
      : data;

    await this.prisma.onboardingProgress.upsert({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      create: {
        organizationId,
        userId,
        [step.completedAt]: new Date(),
        [step.payload]: payloadValue,
      },
      update: {
        [step.completedAt]: new Date(),
        [step.payload]: payloadValue,
      },
    });

    this.logger.log(`Onboarding step ${stepId} completed for user ${userId}`);
    return this.getWizardState(userId);
  }

  /**
   * Returns onboarding checklist with status per item.
   */
  async getChecklist(userId: string): Promise<OnboardingChecklist> {
    const state = await this.getWizardState(userId);
    const items: ChecklistItem[] = ONBOARDING_STEP_IDS.map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      completed: state.completedSteps.includes(id),
      completedAt: undefined,
      data: undefined,
    }));

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { brand: { select: { organizationId: true } } },
    });
    const organizationId = user?.brand?.organizationId;
    if (organizationId) {
      const progress = await this.prisma.onboardingProgress.findUnique({
        where: {
          organizationId_userId: { organizationId, userId },
        },
      });
      if (progress) {
        const dates = [progress.step1CompletedAt, progress.step2CompletedAt, progress.step3CompletedAt, progress.step4CompletedAt, progress.step5CompletedAt];
        ONBOARDING_STEP_IDS.forEach((id, i) => {
          const item = items[i];
          if (item && dates[i]) item.completedAt = dates[i];
        });
      }
    }

    return {
      items,
      overallComplete: state.completed,
    };
  }

  /**
   * Create sample products, designs, and templates for a new brand.
   */
  async createSampleData(brandId: string): Promise<{ products: number; designs: number; templates: number }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, slug: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const slugBase = brand.slug ?? brandId.slice(0, 8);
    let productsCreated = 0;
    let templatesCreated = 0;

    for (const name of ['Sample Bracelet', 'Sample Necklace']) {
      const slug = `${slugBase}-${name.toLowerCase().replace(/\s/g, '-')}-${Date.now().toString(36)}`;
      const exists = await this.prisma.product.findFirst({ where: { brandId, slug } });
      if (!exists) {
        await this.prisma.product.create({
          data: {
            brandId,
            name,
            slug,
            price: 39.99,
            currency: 'EUR',
            images: [],
            tags: ['sample'],
            status: 'DRAFT',
          },
        });
        productsCreated++;
      }
    }

    const templateCount = await this.prisma.template.count({ where: { brandId } });
    if (templateCount === 0) {
      await this.prisma.template.create({
        data: {
          brandId,
          name: 'Sample template',
          promptTemplate: 'A beautiful {{style}} design',
          variables: {},
          isActive: true,
        },
      });
      templatesCreated = 1;
    }

    const designCount = await this.prisma.design.count({ where: { brandId } });
    this.logger.log(`Sample data created for brand ${brandId}: ${productsCreated} products, ${templatesCreated} templates`);
    return {
      products: productsCreated,
      designs: designCount,
      templates: templatesCreated,
    };
  }
}
