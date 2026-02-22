import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { AgentCategory, Plan, Prisma } from '@prisma/client';

@Injectable()
export class AgentTemplatesService {
  private readonly logger = new Logger(AgentTemplatesService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async findAll(filters?: { category?: AgentCategory; requiredPlan?: Plan }) {
    const where: Prisma.AgentTemplateWhereInput = {
      isPublic: true,
      isActive: true,
    };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.requiredPlan) {
      where.requiredPlan = filters.requiredPlan;
    }

    this.logger.debug(`Fetching agent templates with filters: ${JSON.stringify(filters)}`);

    return this.prisma.agentTemplate.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { usageCount: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        icon: true,
        color: true,
        coverImage: true,
        capabilities: true,
        requiredPlan: true,
        isFeatured: true,
        usageCount: true,
        avgRating: true,
        ratingsCount: true,
        estimatedSetupTime: true,
        targetIndustries: true,
        targetUseCases: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const template = await this.prisma.agentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new NotFoundException(`Agent template with slug "${slug}" not found`);
    }

    return template;
  }
}
