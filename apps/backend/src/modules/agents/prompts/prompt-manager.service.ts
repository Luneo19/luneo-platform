import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { SYSTEM_PROMPTS } from './templates/system-prompts';

export interface ResolvedPrompt {
  content: string;
  version: number;
  source: 'database' | 'default';
}

@Injectable()
export class PromptManagerService {
  private readonly logger = new Logger(PromptManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  async getSystemPrompt(agentType: string, brandId?: string): Promise<ResolvedPrompt> {
    const cacheKey = `prompt:system:${agentType}:${brandId || 'default'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Priority 1: Brand-specific template from DB
        if (brandId) {
          const brandTemplate = await this.prisma.agentPromptTemplate.findFirst({
            where: {
              brandId,
              agentType,
              type: 'system',
              isActive: true,
            },
            orderBy: { version: 'desc' },
          });

          if (brandTemplate) {
            await this.incrementUsage(brandTemplate.id);
            return {
              content: brandTemplate.content,
              version: brandTemplate.version,
              source: 'database' as const,
            };
          }
        }

        // Priority 2: Default template from DB
        const defaultTemplate = await this.prisma.agentPromptTemplate.findFirst({
          where: {
            agentType,
            type: 'system',
            isDefault: true,
            isActive: true,
          },
          orderBy: { version: 'desc' },
        });

        if (defaultTemplate) {
          await this.incrementUsage(defaultTemplate.id);
          return {
            content: defaultTemplate.content,
            version: defaultTemplate.version,
            source: 'database' as const,
          };
        }

        // Priority 3: Hardcoded defaults
        const hardcoded = SYSTEM_PROMPTS[agentType];
        return {
          content: hardcoded || SYSTEM_PROMPTS['default'],
          version: 0,
          source: 'default' as const,
        };
      },
      600, // 10 minutes cache
    );
  }

  async getToolInstructions(agentType: string): Promise<string> {
    const template = await this.prisma.agentPromptTemplate.findFirst({
      where: {
        agentType,
        type: 'tool_instruction',
        isActive: true,
      },
      orderBy: { version: 'desc' },
    });
    return template?.content || '';
  }

  private async incrementUsage(templateId: string): Promise<void> {
    try {
      await this.prisma.agentPromptTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });
    } catch {
      // Non-critical
    }
  }
}
