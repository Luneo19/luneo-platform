import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, DesignStatus, Prisma } from '@prisma/client';
import { AiQueueService } from '@/modules/ai/services/ai-queue.service';
import { PromptGuardService } from '@/modules/ai/services/prompt-guard.service';
import { PromptLocalizationService } from '@/modules/ai/services/prompt-localization.service';
import { UVReprojectorUtil } from './utils/uv-reprojector.util';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { UsdzConverterService } from './services/usdz-converter.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { ReprojectMaskDto } from './dto/reproject-mask.dto';
import type { LocalizedPrompt } from '@/modules/ai/services/prompt-localization.service';
import type {
  GenerateDesignJob,
  GenerateHighResJob,
} from '@/jobs/interfaces/ai-jobs.interface';
import type { User } from 'express';

@Injectable()
export class DesignsService {
  constructor(
    private prisma: PrismaService,
    private readonly aiQueueService: AiQueueService,
    private readonly promptGuard: PromptGuardService,
    private readonly promptLocalization: PromptLocalizationService,
    private readonly uvReprojector: UVReprojectorUtil,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usdzConverter: UsdzConverterService,
  ) {}

  async create(createDesignDto: CreateDesignDto, currentUser: User) {
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

  async findOne(id: string, currentUser: User) {
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

  async upgradeToHighRes(id: string, currentUser: User) {
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

  async reprojectMask(
    designId: string,
    maskFile: Express.Multer.File,
    reprojectionData: ReprojectMaskDto,
    currentUser: User,
  ) {
    // Verify design exists and user has access
    const design = await this.findOne(designId, currentUser);

    if (!maskFile) {
      throw new BadRequestException('Mask file is required');
    }

    // Validate file type
    if (!maskFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Mask must be an image file');
    }

    // Check size limits (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (maskFile.size > maxSize) {
      throw new BadRequestException('Mask file exceeds 10MB limit');
    }

    // Parse reprojection parameters
    const {
      sourceUVBBox,
      targetUVBBox,
      sourceTextureWidth,
      sourceTextureHeight,
      targetTextureWidth,
      targetTextureHeight,
    } = reprojectionData;

    if (!sourceUVBBox || !targetUVBBox) {
      throw new BadRequestException('Source and target UV bounding boxes are required');
    }

    // Validate UV coordinates
    const sourceValidation = this.uvReprojector.validateUVBBox(sourceUVBBox);
    const targetValidation = this.uvReprojector.validateUVBBox(targetUVBBox);

    if (!sourceValidation.valid || !targetValidation.valid) {
      throw new BadRequestException(
        `Invalid UV coordinates: ${sourceValidation.warnings.join(', ')} ${targetValidation.warnings.join(', ')}`
      );
    }

    // Clamp UV coordinates
    const clampedSource = this.uvReprojector.clampUVBBox(sourceUVBBox);
    const clampedTarget = this.uvReprojector.clampUVBBox(targetUVBBox);

    // Reproject mask
    const reprojectedBuffer = await this.uvReprojector.reprojectMask({
      maskImageBuffer: maskFile.buffer,
      sourceUVBBox: clampedSource,
      targetUVBBox: clampedTarget,
      sourceTextureWidth: sourceTextureWidth || 1024,
      sourceTextureHeight: sourceTextureHeight || 1024,
      targetTextureWidth: targetTextureWidth || 1024,
      targetTextureHeight: targetTextureHeight || 1024,
    });

    // Upload reprojected mask to Cloudinary
    const reprojectedUrl = await this.cloudinaryService.uploadImage(
      reprojectedBuffer,
      `luneo/designs/${designId}/masks/reprojected`
    );

    // Update design metadata
    const updatedDesign = await this.prisma.design.update({
      where: { id: designId },
      data: {
        metadata: {
          ...((design.metadata as Record<string, unknown>) || {}),
          reprojectedMasks: [
            ...(((design.metadata as Record<string, unknown>)?.reprojectedMasks as unknown[]) || []),
            {
              url: reprojectedUrl,
              reprojectedAt: new Date().toISOString(),
              sourceUVBBox: clampedSource,
              targetUVBBox: clampedTarget,
              warnings: [...sourceValidation.warnings, ...targetValidation.warnings],
            },
          ],
        },
      },
    });

    return {
      success: true,
      reprojectedMaskUrl: reprojectedUrl,
      warnings: [...sourceValidation.warnings, ...targetValidation.warnings],
    };
  }

  async getARUrl(id: string, currentUser: User, platform: 'ios' | 'android' | 'webxr' = 'ios') {
    // Verify design exists and user has access
    const design = await this.findOne(id, currentUser);

    // Find GLB model asset
    const modelAsset = await this.prisma.asset.findFirst({
      where: {
        designId: id,
        type: 'model',
        format: { in: ['glb', 'gltf'] },
      },
    });

    if (!modelAsset) {
      throw new NotFoundException('No 3D model found for this design');
    }

    // Find texture assets
    const textureAssets = await this.prisma.asset.findMany({
      where: {
        designId: id,
        type: 'texture',
      },
    });

    const textureUrls = textureAssets.map((asset) => asset.url);

    // Convert to USDZ
    const conversionResult = await this.usdzConverter.convertDesignToUsdz(
      id,
      modelAsset.url,
      textureUrls,
    );

    // Generate signed URL with short expiry (1 hour)
    const signedUrl = await this.usdzConverter.getSignedUsdzUrl(conversionResult.usdzUrl, 3600);

    return {
      usdzUrl: signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      platform,
      cacheKey: conversionResult.cacheKey,
      optimized: conversionResult.optimized,
    };
  }
}
