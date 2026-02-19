/**
 * AR Studio - Model Converter Service (Orchestrateur)
 * Detecte le format source, route vers le bon converter,
 * gere le workflow: Upload -> Validation -> Conversion -> Optimisation -> Stockage CDN
 */

import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { ARConversionStatus, ModelValidationStatus } from '@prisma/client';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';

export interface ConversionRequest {
  modelId: string;
  targetFormats: ('gltf' | 'glb' | 'usdz' | 'draco')[];
  optimize?: boolean;
  generateLODs?: boolean;
  generateThumbnail?: boolean;
}

export interface ConversionResult {
  modelId: string;
  format: string;
  url: string;
  fileSize: number;
  processingTime: number;
  compressionRatio?: number;
  qualityScore?: number;
}

const SUPPORTED_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'step', 'stp', '3ds', 'usdz'];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

@Injectable()
export class ModelConverterService {
  private readonly logger = new Logger(ModelConverterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly quotasService: QuotasService,
    @InjectQueue('ar-conversion') private readonly conversionQueue: Queue,
    @InjectQueue('ar-optimization') private readonly optimizationQueue: Queue,
  ) {}

  /**
   * Lance la conversion multi-format d'un modele 3D
   */
  async convertModel(request: ConversionRequest): Promise<{ jobIds: string[] }> {
    this.logger.log(`Starting conversion for model ${request.modelId}`);

    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: request.modelId },
    });

    if (!model) {
      throw new BadRequestException('3D Model not found');
    }

    const sourceFormat = model.originalFormat.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(sourceFormat)) {
      throw new BadRequestException(`Unsupported source format: ${sourceFormat}`);
    }

    const jobIds: string[] = [];

    for (const targetFormat of request.targetFormats) {
      // Create conversion record
      const conversion = await this.prisma.aRModelConversion.create({
        data: {
          modelId: request.modelId,
          sourceFormat,
          targetFormat,
          status: ARConversionStatus.PENDING,
        },
      });

      // Add job to conversion queue
      const job = await this.conversionQueue.add(
        'convert-model',
        {
          conversionId: conversion.id,
          modelId: request.modelId,
          sourceFormat,
          targetFormat,
          sourceUrl: model.originalFileURL,
          optimize: request.optimize ?? true,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        } as any,
      );

      jobIds.push(String(job.id ?? job.name));
    }

    // Optionally queue LOD generation
    if (request.generateLODs) {
      const lodJob = await this.optimizationQueue.add(
        'generate-lods',
        {
          modelId: request.modelId,
          levels: [
            { name: 'lod0', polyReduction: 0 },
            { name: 'lod1', polyReduction: 0.5 },
            { name: 'lod2', polyReduction: 0.8 },
          ],
        },
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 10000 },
        } as any,
      );
      jobIds.push(String(lodJob.id ?? lodJob.name));
    }

    // Update model status
    await this.prisma.aR3DModel.update({
      where: { id: request.modelId },
      data: { validationStatus: ModelValidationStatus.VALIDATING },
    });

    return { jobIds };
  }

  /**
   * Retourne le statut de toutes les conversions d'un modele
   */
  async getConversionStatus(modelId: string): Promise<{
    modelId: string;
    conversions: Array<{
      id: string;
      sourceFormat: string;
      targetFormat: string;
      status: ARConversionStatus;
      processingTime: number | null;
      errorMessage: string | null;
    }>;
    overallProgress: number;
  }> {
    const conversions = await this.prisma.aRModelConversion.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
    });

    const total = conversions.length;
    const completed = conversions.filter(
      (c) => c.status === ARConversionStatus.COMPLETED || c.status === ARConversionStatus.FAILED,
    ).length;

    return {
      modelId,
      conversions: conversions.map((c) => ({
        id: c.id,
        sourceFormat: c.sourceFormat,
        targetFormat: c.targetFormat,
        status: c.status,
        processingTime: c.processingTime,
        errorMessage: c.errorMessage,
      })),
      overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Upload un modele 3D, le valide, et lance la conversion
   */
  async uploadAndConvert(
    projectId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    options: {
      name?: string;
      autoConvert?: boolean;
      targetFormats?: ('gltf' | 'glb' | 'usdz' | 'draco')[];
      generateLODs?: boolean;
      brandId?: string;
    } = {},
  ): Promise<{ model: { id: string; name: string; status: ModelValidationStatus }; conversionJobIds?: string[] }> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';

    if (!SUPPORTED_FORMATS.includes(ext)) {
      throw new BadRequestException(
        `Format non supporte: .${ext}. Formats acceptes: ${SUPPORTED_FORMATS.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`Fichier trop volumineux. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    }

    // Check AR models quota if brandId is provided
    if (options.brandId) {
      const modelQuota = await this.quotasService.checkQuota(options.brandId, 'ar_models');
      if (!modelQuota.allowed) {
        throw new ForbiddenException(
          `Quota de modèles AR atteint (${modelQuota.limit}/mois). ` +
          `Veuillez mettre à niveau votre plan ou attendre le renouvellement.`,
        );
      }

      // Check storage quota (convert bytes to GB)
      const fileSizeGB = file.size / (1024 * 1024 * 1024);
      const storageQuota = await this.quotasService.checkQuota(options.brandId, 'storage_gb', fileSizeGB);
      if (!storageQuota.allowed && storageQuota.hardLimitReached) {
        throw new ForbiddenException(
          `Quota de stockage atteint (${storageQuota.limit} GB). ` +
          `Veuillez libérer de l'espace ou mettre à niveau votre plan.`,
        );
      }
    }

    // Upload to Cloudinary/CDN
    const storageKey = `ar-models/${projectId}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileURL = await this.storageService.uploadBuffer(file.buffer, storageKey, {
      contentType: file.mimetype || 'application/octet-stream',
    });

    // Create AR3DModel record
    const model = await this.prisma.aR3DModel.create({
      data: {
        projectId,
        name: options.name || file.originalname.replace(/\.[^/.]+$/, ''),
        originalFileName: file.originalname,
        originalFormat: ext,
        originalFileURL: fileURL,
        originalFileSize: file.size,
        validationStatus: ModelValidationStatus.PENDING,
      },
    });

    // Auto-convert if requested
    let conversionJobIds: string[] | undefined;
    if (options.autoConvert !== false) {
      const defaultFormats: ('gltf' | 'glb' | 'usdz' | 'draco')[] =
        options.targetFormats || this.getDefaultTargetFormats(ext);

      const result = await this.convertModel({
        modelId: model.id,
        targetFormats: defaultFormats,
        optimize: true,
        generateLODs: options.generateLODs ?? true,
        generateThumbnail: true,
      });

      conversionJobIds = result.jobIds;
    }

    return {
      model: {
        id: model.id,
        name: model.name,
        status: model.validationStatus,
      },
      conversionJobIds,
    };
  }

  /**
   * Determine les formats cibles par defaut selon le format source
   */
  private getDefaultTargetFormats(sourceFormat: string): ('gltf' | 'glb' | 'usdz' | 'draco')[] {
    switch (sourceFormat) {
      case 'glb':
      case 'gltf':
        return ['usdz', 'draco'];
      case 'fbx':
      case 'obj':
      case 'stl':
      case '3ds':
        return ['glb', 'usdz', 'draco'];
      case 'step':
      case 'stp':
        return ['glb', 'usdz'];
      case 'usdz':
        return ['glb', 'draco'];
      default:
        return ['glb', 'usdz'];
    }
  }
}
