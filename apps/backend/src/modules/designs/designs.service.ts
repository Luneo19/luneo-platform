import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, DesignStatus, Prisma } from '@prisma/client';
import { AiQueueService } from '@/modules/ai/services/ai-queue.service';
import { PromptGuardService } from '@/modules/ai/services/prompt-guard.service';
import { PromptLocalizationService } from '@/modules/ai/services/prompt-localization.service';
import type { LocalizedPrompt } from '@/modules/ai/services/prompt-localization.service';
import type {
  GenerateDesignJob,
  GenerateHighResJob,
} from '@/jobs/interfaces/ai-jobs.interface';

@Injectable()
export class DesignsService {
  constructor(
    private prisma: PrismaService,
    private readonly aiQueueService: AiQueueService,
    private readonly promptGuard: PromptGuardService,
    private readonly promptLocalization: PromptLocalizationService,
  ) {}

  async create(createDesignDto: any, currentUser: any) {
    const { productId, prompt, options } = createDesignDto;
    const sanitizedOptions = this.sanitizeOptions(options);
    const optionsJson = this.toJsonValue(sanitizedOptions);

    // Check if product exists and user has access
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== product.brandId) {
      throw new ForbiddenException('Access denied to this product');
    }

    const { prompt: sanitizedPrompt } = this.promptGuard.enforcePolicies(prompt, {
      userId: currentUser.id,
      brandId: product.brandId,
    });

    const localizedPrompt: LocalizedPrompt = await this.promptLocalization.normalizePrompt(
      sanitizedPrompt,
      'en',
    );

    // Create design record
    const design = await this.prisma.design.create({
      data: {
        prompt: localizedPrompt.prompt,
        options: optionsJson,
        status: DesignStatus.PENDING,
        userId: currentUser.id,
        brandId: product.brandId,
        productId,
        metadata: this.toJsonValue({
          originalLocale: localizedPrompt.originalLocale,
          normalizedLocale: localizedPrompt.targetLocale,
          translated: localizedPrompt.translated,
        }),
      },
      include: {
        product: true,
        brand: true,
      },
    });

    // Add to AI generation queue
    const payload: GenerateDesignJob = {
      designId: design.id,
      prompt: localizedPrompt.prompt,
      options: sanitizedOptions,
      userId: currentUser.id,
      brandId: product.brandId,
      originalLocale: localizedPrompt.originalLocale ?? undefined,
      normalizedLocale: localizedPrompt.targetLocale,
    };

    await this.aiQueueService.enqueueDesign(payload);

    return design;
  }

  private sanitizeOptions(rawOptions: unknown): Record<string, unknown> {
    if (rawOptions && typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
      return rawOptions as Record<string, unknown>;
    }

    return {};
  }

  private toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  async findOne(id: string, currentUser: any) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        product: true,
        brand: true,
        user: true,
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== design.brandId) {
      throw new ForbiddenException('Access denied to this design');
    }

    return design;
  }

  async upgradeToHighRes(id: string, currentUser: any) {
    const design = await this.findOne(id, currentUser);

    if (design.status !== DesignStatus.COMPLETED) {
      throw new ForbiddenException('Design must be completed to upgrade to high-res');
    }

    const options = this.sanitizeOptions(design.options as unknown);
    const payload: GenerateHighResJob = {
      designId: design.id,
      prompt: design.prompt,
      options,
      userId: currentUser.id,
      originalLocale:
        (design.metadata as Record<string, unknown> | null)?.['originalLocale']?.toString(),
      normalizedLocale:
        (design.metadata as Record<string, unknown> | null)?.['normalizedLocale']?.toString() ??
        'en',
    };

    // Add to high-res generation queue
    await this.aiQueueService.enqueueHighRes(payload);

    return { message: 'High-res generation started' };
  }
}
