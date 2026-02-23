import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface PromptTemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface IndustryPromptTemplate {
  id: string;
  industry: string;
  name: string;
  description?: string | null;
  prompt: string;
  variables: string[];
  category?: string | null;
}

export interface IndustryTemplatesGroup {
  industry: string;
  industryLabel?: string;
  templates: IndustryPromptTemplate[];
}

/** In-memory fallback when no DB templates exist for an industry */
const FALLBACK_TEMPLATES: Record<string, { prompt: string; variables: string[] }> = {
  jewelry: {
    prompt:
      'Professional product photography of {{productName}}, {{style}} style, luxury jewelry, studio lighting, sharp focus, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  fashion: {
    prompt:
      'Professional fashion photography of {{productName}}, {{style}} style, clean backdrop, editorial lighting, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  watches: {
    prompt:
      'Professional product photography of {{productName}}, {{style}} style, luxury watch, macro detail, studio lighting, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  cosmetics: {
    prompt:
      'Professional product photography of {{productName}}, {{style}} style, clean beauty shot, soft lighting, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  electronics: {
    prompt:
      'Professional product photography of {{productName}}, {{style}} style, tech product, clean minimal backdrop, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  automotive: {
    prompt:
      'Professional automotive photography of {{productName}}, {{style}} style, dramatic lighting, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  food: {
    prompt:
      'Professional food photography of {{productName}}, {{style}} style, appetizing, natural lighting, {{context}}',
    variables: ['productName', 'style', 'context'],
  },
  'real-estate': {
    prompt:
      'Professional real estate photography, {{style}} style, {{roomType}}, natural light, {{context}}',
    variables: ['style', 'roomType', 'context'],
  },
};

@Injectable()
export class IndustryTemplatesService {
  private readonly logger = new Logger(IndustryTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a prompt template for the given industry and optional category (productType).
   * Uses DB IndustryTemplate when available; otherwise falls back to in-memory templates.
   */
  async getTemplate(
    industry: string,
    category?: string,
  ): Promise<IndustryPromptTemplate | null> {
    const slug = industry.toLowerCase().trim().replace(/\s+/g, '-');

    try {
      // First try with category filter if provided
      const industryRecord = await this.prisma.industry.findFirst({
        where: { slug, isActive: true },
        include: {
          templates: {
            where: category
              ? { productType: category }
              : undefined,
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      });

      if (industryRecord?.templates?.length) {
        const t = industryRecord.templates[0];
        const data = (t.templateData as { prompt?: string; variables?: string[] }) ?? {};
        return {
          id: t.id,
          industry: industryRecord.slug,
          name: t.name,
          description: t.description,
          prompt: data.prompt ?? '',
          variables: Array.isArray(data.variables) ? data.variables : [],
          category: t.productType,
        };
      }

      // No DB template: use fallback
      const fallback = FALLBACK_TEMPLATES[slug];
      if (fallback) {
        return {
          id: `fallback-${slug}`,
          industry: slug,
          name: `${slug} default`,
          prompt: fallback.prompt,
          variables: fallback.variables,
          category: category ?? null,
        };
      }

      this.logger.debug(`getTemplate(industry=${industry}, category=${category}) not found`);
      return null;
    } catch (error) {
      this.logger.warn('getTemplate failed, using fallback', {
        industry,
        error: error instanceof Error ? error.message : error,
      });
      const fallback = FALLBACK_TEMPLATES[slug];
      if (fallback) {
        return {
          id: `fallback-${slug}`,
          industry: slug,
          name: `${slug} default`,
          prompt: fallback.prompt,
          variables: fallback.variables,
          category: category ?? null,
        };
      }
      return null;
    }
  }

  /**
   * Returns all available prompt templates grouped by industry.
   */
  async getAllTemplates(): Promise<IndustryTemplatesGroup[]> {
    try {
      const industries = await this.prisma.industry.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          templates: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      const groups: IndustryTemplatesGroup[] = [];

      for (const ind of industries) {
        const templates: IndustryPromptTemplate[] = ind.templates.map((t) => {
          const data = (t.templateData as { prompt?: string; variables?: string[] }) ?? {};
          return {
            id: t.id,
            industry: ind.slug,
            name: t.name,
            description: t.description,
            prompt: data.prompt ?? '',
            variables: Array.isArray(data.variables) ? data.variables : [],
            category: t.productType,
          };
        });

        if (templates.length > 0) {
          groups.push({
            industry: ind.slug,
            industryLabel: ind.labelEn,
            templates,
          });
        }
      }

      // Append fallback industries that have no DB templates
      const existingSlugs = new Set(groups.map((g) => g.industry));
      for (const [slug, fallback] of Object.entries(FALLBACK_TEMPLATES)) {
        if (existingSlugs.has(slug)) continue;
        groups.push({
          industry: slug,
          templates: [
            {
              id: `fallback-${slug}`,
              industry: slug,
              name: `${slug} default`,
              prompt: fallback.prompt,
              variables: fallback.variables,
            },
            ],
        });
      }

      return groups;
    } catch (error) {
      this.logger.warn('getAllTemplates failed, returning fallbacks only', {
        error: error instanceof Error ? error.message : error,
      });
      return Object.entries(FALLBACK_TEMPLATES).map(([industry, fallback]) => ({
        industry,
        templates: [
          {
            id: `fallback-${industry}`,
            industry,
            name: `${industry} default`,
            prompt: fallback.prompt,
            variables: fallback.variables,
          },
        ],
      }));
    }
  }

  /**
   * Renders a template by replacing {{variable}} placeholders with the provided values.
   */
  renderTemplate(
    template: IndustryPromptTemplate,
    values: PromptTemplateVariables,
  ): string {
    let out = template.prompt;
    for (const key of template.variables) {
      const placeholder = `{{${key}}}`;
      const value = values[key];
      out = out.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value ?? ''));
    }
    return out;
  }
}
