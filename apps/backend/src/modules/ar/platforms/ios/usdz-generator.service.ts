/**
 * USDZ Generator Service (iOS)
 * Ensures USDZ is available for a 3D model: checks existence, triggers conversion via worker if not.
 * Returns USDZ URL and readiness; callers can use the URL with proper Content-Type when serving the file.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ARConversionStatus } from '@prisma/client';

/** Result of ensuring USDZ availability for a model */
export interface UsdzResult {
  /** URL to the USDZ file (when ready) or fallback glTF/GLB URL (when conversion pending) */
  url: string;
  /** True if USDZ is available; false if conversion was triggered and URL is fallback */
  ready: boolean;
}

/** Content-Type for USDZ when serving the file */
export const USDZ_CONTENT_TYPE = 'model/vnd.usdz+zip';

const SUPPORTED_SOURCE_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'step', 'stp', '3ds', 'usdz'];

@Injectable()
export class UsdzGeneratorService {
  private readonly logger = new Logger(UsdzGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ar-conversion') private readonly conversionQueue: Queue,
  ) {}

  /**
   * Checks if USDZ exists for the model; if not, triggers conversion via the conversion worker.
   * Returns the USDZ URL when ready, or a fallback URL and ready=false when conversion is in progress.
   *
   * @param modelId - AR3DModel id
   * @returns UsdzResult with url and ready flag
   */
  async ensureUsdzUrl(modelId: string): Promise<UsdzResult> {
    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
      select: {
        usdzURL: true,
        gltfURL: true,
        gltfDracoURL: true,
        originalFileURL: true,
        originalFormat: true,
      },
    });

    if (!model) {
      throw new BadRequestException('3D model not found');
    }

    if (model.usdzURL) {
      return { url: model.usdzURL, ready: true };
    }

    const sourceFormat = model.originalFormat.toLowerCase();
    if (!SUPPORTED_SOURCE_FORMATS.includes(sourceFormat)) {
      this.logger.warn(`Unsupported source format for USDZ: ${sourceFormat}`);
      const fallbackUrl =
        model.gltfURL ?? model.gltfDracoURL ?? model.originalFileURL ?? '';
      return { url: fallbackUrl, ready: false };
    }

    this.logger.log(`USDZ not found for model ${modelId}; triggering conversion`);
    const conversion = await this.prisma.aRModelConversion.create({
      data: {
        modelId,
        sourceFormat,
        targetFormat: 'usdz',
        status: ARConversionStatus.PENDING,
      },
    });

    await this.conversionQueue.add(
      'convert-model',
      {
        conversionId: conversion.id,
        modelId,
        sourceFormat,
        targetFormat: 'usdz',
        sourceUrl: model.originalFileURL,
        optimize: true,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        timeout: 10 * 60 * 1000,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    const fallbackUrl =
      model.gltfURL ?? model.gltfDracoURL ?? model.originalFileURL ?? '';
    return {
      url: fallbackUrl,
      ready: false,
    };
  }

  /**
   * Returns the Content-Type header value for USDZ (model/vnd.usdz+zip).
   * Use when serving or redirecting to a USDZ file.
   */
  getUsdzContentType(): string {
    return USDZ_CONTENT_TYPE;
  }
}
