import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VerticalTemplate } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { VERTICAL_TEMPLATES } from './templates/vertical-templates';

@Injectable()
export class VerticalsService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  private templateBySlug(slug: string) {
    return VERTICAL_TEMPLATES.find((item) => item.slug === slug);
  }

  private async ensureTemplatePersisted(slug: string): Promise<VerticalTemplate> {
    const existing = await this.prisma.verticalTemplate.findUnique({ where: { slug } });
    if (existing) return existing;

    const seed = this.templateBySlug(slug);
    if (!seed) throw new NotFoundException(`Vertical template "${slug}" introuvable`);

    return this.prisma.verticalTemplate.create({
      data: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        icon: seed.icon,
        onboardingQuestions: seed.onboardingQuestions as Prisma.InputJsonValue,
        defaultKnowledge: seed.defaultKnowledgeTemplates as Prisma.InputJsonValue,
        defaultWorkflows: seed.defaultWorkflows as Prisma.InputJsonValue,
        kpiDefinitions: seed.kpiDefinitions as Prisma.InputJsonValue,
        intentCategories: seed.intentCategories as Prisma.InputJsonValue,
        industryVocabulary: seed.industryVocabulary as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  async listTemplates() {
    const persisted = await this.prisma.verticalTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        onboardingQuestions: true,
        kpiDefinitions: true,
      },
    });

    if (persisted.length > 0) return persisted;
    return VERTICAL_TEMPLATES.map((item) => ({
      id: `seed:${item.slug}`,
      slug: item.slug,
      name: item.name,
      description: item.description,
      icon: item.icon,
      onboardingQuestions: item.onboardingQuestions,
      kpiDefinitions: item.kpiDefinitions,
    }));
  }

  async getTemplate(slug: string) {
    const template = await this.prisma.verticalTemplate.findUnique({ where: { slug } });
    if (template) return template;

    const seed = this.templateBySlug(slug);
    if (!seed) throw new NotFoundException(`Vertical template "${slug}" introuvable`);
    return seed;
  }

  async selectVerticalForOrganization(user: CurrentUser, slug: string, onboardingData?: Record<string, unknown>) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.selectVerticalByOrganizationId(user.organizationId, slug, onboardingData);
  }

  async selectVerticalByOrganizationId(
    organizationId: string,
    slug: string,
    onboardingData?: Record<string, unknown>,
  ) {
    const template = await this.ensureTemplatePersisted(slug);

    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        verticalTemplateId: template.id,
        onboardingData: onboardingData as Prisma.InputJsonValue | undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        verticalTemplateId: true,
        onboardingData: true,
      },
    });

    return {
      organization,
      template: {
        id: template.id,
        slug: template.slug,
        name: template.name,
      },
    };
  }
}
