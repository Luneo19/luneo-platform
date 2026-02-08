import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@Injectable()
export class IndustryService {
  private readonly logger = new Logger(IndustryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.industry.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getBySlug(slug: string) {
    const industry = await this.prisma.industry.findUnique({
      where: { slug, isActive: true },
      include: {
        moduleConfigs: { orderBy: { sortOrder: 'asc' } },
        widgetConfigs: { orderBy: { position: 'asc' } },
        kpiConfigs: { orderBy: { sortOrder: 'asc' } },
        templates: { orderBy: { sortOrder: 'asc' } },
        terminology: true,
        onboardingSteps: { orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!industry) {
      throw new NotFoundException(`Industry not found: ${slug}`);
    }
    return industry;
  }

  async getConfig(slug: string) {
    const industry = await this.prisma.industry.findUnique({
      where: { slug, isActive: true },
      include: {
        moduleConfigs: { orderBy: { sortOrder: 'asc' } },
        widgetConfigs: { orderBy: { position: 'asc' } },
        kpiConfigs: { orderBy: { sortOrder: 'asc' } },
        terminology: true,
      },
    });
    if (!industry) {
      throw new NotFoundException(`Industry not found: ${slug}`);
    }
    return {
      modules: industry.moduleConfigs,
      widgets: industry.widgetConfigs,
      kpis: industry.kpiConfigs,
      terminology: industry.terminology,
    };
  }

  async create(dto: CreateIndustryDto) {
    const industry = await this.prisma.industry.create({
      data: {
        slug: dto.slug,
        labelFr: dto.labelFr,
        labelEn: dto.labelEn,
        icon: dto.icon,
        accentColor: dto.accentColor,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    this.logger.log(`Industry created: ${industry.slug}`);
    return industry;
  }

  async update(slug: string, dto: UpdateIndustryDto) {
    const existing = await this.prisma.industry.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new NotFoundException(`Industry not found: ${slug}`);
    }
    const industry = await this.prisma.industry.update({
      where: { slug },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.labelFr !== undefined && { labelFr: dto.labelFr }),
        ...(dto.labelEn !== undefined && { labelEn: dto.labelEn }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    this.logger.log(`Industry updated: ${industry.slug}`);
    return industry;
  }

  async delete(slug: string) {
    const existing = await this.prisma.industry.findUnique({
      where: { slug },
    });
    if (!existing) {
      throw new NotFoundException(`Industry not found: ${slug}`);
    }
    const industry = await this.prisma.industry.update({
      where: { slug },
      data: { isActive: false },
    });
    this.logger.log(`Industry soft-deleted: ${slug}`);
    return {
      success: true,
      slug: industry.slug,
      labelEn: industry.labelEn,
      labelFr: industry.labelFr,
      status: 'inactive',
      updatedAt: industry.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
