/**
 * Image Target Service - CRUD for ARImageTarget with upload, quality analysis, and storage.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { TargetQualityAnalyzerService } from './target-quality-analyzer.service';
import { FeatureExtractorService } from './feature-extractor.service';
import { TargetManagerService } from './target-manager.service';
import { TriggerAction } from '@prisma/client';

/** Multer-compatible file for upload */
export interface UploadedImageFile {
  fieldname?: string;
  originalname?: string;
  buffer: Buffer;
  mimetype?: string;
  size?: number;
}

export interface CreateTargetOptions {
  name: string;
  physicalWidthCm: number;
  physicalHeightCm: number;
  linkedModelId?: string;
  triggerAction?: TriggerAction;
  triggerConfig?: Record<string, unknown>;
}

export interface UpdateTargetData {
  name?: string;
  physicalWidthCm?: number;
  physicalHeightCm?: number;
  linkedModelId?: string | null;
  triggerAction?: TriggerAction;
  triggerConfig?: Record<string, unknown> | null;
  isActive?: boolean;
}

@Injectable()
export class ImageTargetService {
  private readonly logger = new Logger(ImageTargetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly qualityAnalyzer: TargetQualityAnalyzerService,
    private readonly featureExtractor: FeatureExtractorService,
    private readonly targetManager: TargetManagerService,
  ) {}

  /**
   * Upload image, analyze quality, create ARImageTarget record.
   */
  async createTarget(
    projectId: string,
    brandId: string,
    file: UploadedImageFile,
    options: CreateTargetOptions,
  ) {
    await this.targetManager.assertProjectAccess(projectId, brandId);

    if (!file?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer as ArrayBuffer);
    const [qualityResult, features] = await Promise.all([
      this.qualityAnalyzer.analyzeQuality(buffer),
      this.featureExtractor.extractFeatures(buffer),
    ]);

    const key = `ar-studio/targets/${projectId}/${Date.now()}-${file.originalname ?? 'image.png'}`;
    const imageURL = await this.storage.uploadBuffer(buffer, key, {
      contentType: file.mimetype ?? 'image/png',
      bucket: 'ar-targets',
    });

    let thumbnailURL: string | undefined;
    try {
      const sharp = await import('sharp');
      const thumb = await sharp.default(buffer)
        .resize(200, 200, { fit: 'cover' })
        .png()
        .toBuffer();
      thumbnailURL = await this.storage.uploadBuffer(thumb, `${key}-thumb`, {
        contentType: 'image/png',
        bucket: 'ar-targets',
      });
    } catch {
      thumbnailURL = imageURL;
    }

    const target = await this.prisma.aRImageTarget.create({
      data: {
        projectId,
        name: options.name,
        imageURL,
        thumbnailURL,
        physicalWidth: options.physicalWidthCm,
        physicalHeight: options.physicalHeightCm,
        linkedModelId: options.linkedModelId ?? undefined,
        triggerAction: options.triggerAction ?? TriggerAction.SHOW_3D_MODEL,
        triggerConfig: (options.triggerConfig ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
        trackingQuality: qualityResult.trackingQuality,
        qualityScore: qualityResult.score,
        qualityIssues: qualityResult.qualityIssues,
        recommendations: qualityResult.recommendations,
        featurePoints: features.featurePointCount,
      },
      include: {
        linkedModel: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Created image target ${target.id} for project ${projectId}`);
    return target;
  }

  async getTarget(id: string, brandId: string) {
    return this.targetManager.getTargetById(id, brandId);
  }

  async listTargets(projectId: string, brandId: string, includeInactive?: boolean, limit?: number, offset?: number) {
    return this.targetManager.listTargets({
      projectId,
      brandId,
      includeInactive,
      limit,
      offset,
    });
  }

  /**
   * Update target (linked model, trigger, etc.). Soft delete via isActive.
   */
  async updateTarget(id: string, brandId: string, data: UpdateTargetData) {
    const existing = await this.targetManager.getTargetById(id, brandId);

    const updateData: import('@prisma/client').Prisma.ARImageTargetUpdateInput = {
      ...(data.name != null && { name: data.name }),
      ...(data.physicalWidthCm != null && { physicalWidth: data.physicalWidthCm }),
      ...(data.physicalHeightCm != null && { physicalHeight: data.physicalHeightCm }),
      ...(data.triggerAction != null && { triggerAction: data.triggerAction }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };
    if (data.linkedModelId !== undefined) {
      updateData.linkedModel = data.linkedModelId != null
        ? { connect: { id: data.linkedModelId } }
        : { disconnect: true };
    }
    if (data.triggerConfig !== undefined) updateData.triggerConfig = data.triggerConfig as import('@prisma/client').Prisma.InputJsonValue;

    const target = await this.prisma.aRImageTarget.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        linkedModel: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Updated image target ${id}`);
    return target;
  }

  /**
   * Soft delete: set isActive = false.
   */
  async deleteTarget(id: string, brandId: string) {
    const existing = await this.targetManager.getTargetById(id, brandId);
    await this.prisma.aRImageTarget.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    this.logger.log(`Soft-deleted image target ${id}`);
    return { ok: true };
  }

  /**
   * Re-analyze quality for an existing target (fetches image from URL and re-runs analyzer).
   */
  async reanalyzeQuality(id: string, brandId: string) {
    const target = await this.targetManager.getTargetById(id, brandId);
    const response = await fetch(target.imageURL);
    if (!response.ok) {
      throw new BadRequestException('Could not fetch image for re-analysis');
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const [qualityResult, features] = await Promise.all([
      this.qualityAnalyzer.analyzeQuality(buffer),
      this.featureExtractor.extractFeatures(buffer),
    ]);

    const updated = await this.prisma.aRImageTarget.update({
      where: { id: target.id },
      data: {
        trackingQuality: qualityResult.trackingQuality,
        qualityScore: qualityResult.score,
        qualityIssues: qualityResult.qualityIssues,
        recommendations: qualityResult.recommendations,
        featurePoints: features.featurePointCount,
      },
      include: {
        linkedModel: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Re-analyzed quality for target ${id}: score=${qualityResult.score}`);
    return updated;
  }
}
