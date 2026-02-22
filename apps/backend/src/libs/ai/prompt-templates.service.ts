// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface PromptTemplateContext {
  occasion?: string;
  style?: string;
  productName?: string;
  productDescription?: string;
  userInput?: string;
  brandKit?: {
    colors?: string[];
    tone?: string;
    forbidden?: string[];
  };
  constraints?: {
    engraving?: boolean;
    setting?: string; // 'claw', 'pave', etc.
  };
}

@Injectable()
export class PromptTemplatesService {
  private readonly logger = new Logger(PromptTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère un template par occasion/style
   */
  async getTemplate(
    occasion?: string,
    style?: string,
    version?: number,
  ): Promise<unknown> {
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (occasion) {
      where.occasion = occasion;
    }

    if (style) {
      where.style = style;
    }

    if (version) {
      where.version = version;
    }

    const template = await this.prisma.promptTemplate.findFirst({
      where,
      orderBy: version ? {} : { version: 'desc' }, // Dernière version si non spécifiée
    });

    return template;
  }

  /**
   * Rendu un template avec le contexte
   */
  renderTemplate(template: { prompt: string; variables?: Record<string, unknown> }, context: PromptTemplateContext): string {
    let rendered = template.prompt;

    // Remplacer les variables {{variable}}
    const _variables = template.variables || {};
    
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      if (rendered.includes(placeholder)) {
        rendered = rendered.replace(
          new RegExp(placeholder, 'g'),
          String(value || ''),
        );
      }
    }

    // Variables spéciales
    if (context.userInput) {
      rendered = rendered.replace(/{{userInput}}/g, context.userInput);
    }

    if (context.productName) {
      rendered = rendered.replace(/{{productName}}/g, context.productName);
    }

    if (context.productDescription) {
      rendered = rendered.replace(
        /{{productDescription}}/g,
        context.productDescription,
      );
    }

    // Brand kit integration
    if (context.brandKit) {
      if (context.brandKit.colors) {
        rendered = rendered.replace(
          /{{brandColors}}/g,
          context.brandKit.colors.join(', '),
        );
      }

      if (context.brandKit.tone) {
        rendered = rendered.replace(/{{brandTone}}/g, context.brandKit.tone);
      }
    }

    // Constraints
    if (context.constraints) {
      if (context.constraints.engraving) {
        rendered = rendered.replace(
          /{{engraving}}/g,
          'with personalized engraving',
        );
      }

      if (context.constraints.setting) {
        rendered = rendered.replace(
          /{{setting}}/g,
          `with ${context.constraints.setting} setting`,
        );
      }
    }

    // Nettoyer les placeholders non remplacés
    rendered = rendered.replace(/{{[^}]+}}/g, '');

    return rendered.trim();
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(data: {
    name: string;
    occasion?: string;
    style?: string;
    prompt: string;
    variables?: Record<string, unknown>;
    constraints?: Record<string, unknown>;
    brandKit?: Record<string, unknown>;
  }): Promise<unknown> {
    // Trouver la dernière version
    const lastVersion = await this.prisma.promptTemplate.findFirst({
      where: { name: data.name },
      orderBy: { version: 'desc' },
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    return this.prisma.promptTemplate.create({
      data: {
        ...data,
        version,
        variables: data.variables as Prisma.InputJsonValue | undefined,
        constraints: data.constraints as Prisma.InputJsonValue | undefined,
        brandKit: data.brandKit as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Liste tous les templates disponibles
   */
  async listTemplates(filters?: {
    occasion?: string;
    style?: string;
    isActive?: boolean;
  }): Promise<unknown[]> {
    const where: Record<string, unknown> = {};

    if (filters?.occasion) {
      where.occasion = filters.occasion;
    }

    if (filters?.style) {
      where.style = filters.style;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.promptTemplate.findMany({
      where,
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  }
}

































