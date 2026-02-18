/**
 * AR Studio - Model Validator Service
 * Validates 3D models for AR readiness: polygons, textures, materials, size limits
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ModelValidationStatus } from '@prisma/client';

export interface ValidationReport {
  modelId: string;
  isValid: boolean;
  status: ModelValidationStatus;
  checks: ValidationCheck[];
  autoFixes: string[];
  recommendations: string[];
  metadata: {
    polyCount: number;
    textureCount: number;
    materialCount: number;
    dimensions: { width: number; height: number; depth: number };
    boundingBox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    estimatedLoadTime: { mobile: number; desktop: number };
  };
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  value?: number;
  limit?: number;
}

// AR readiness limits
const AR_LIMITS = {
  maxPolyCount: 500000,
  maxPolyCountMobile: 100000,
  maxTextureSize: 4096,
  maxTextureSizeMobile: 2048,
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  maxFileSizeMobile: 15 * 1024 * 1024, // 15 MB
  maxMaterialCount: 20,
  maxTextureCount: 30,
  minDimension: 0.01, // 1 cm
  maxDimension: 1000, // 10 m
  maxLoadTimeTarget: 3000, // 3 seconds
};

@Injectable()
export class ModelValidatorService {
  private readonly logger = new Logger(ModelValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a 3D model for AR readiness
   */
  async validate(modelId: string): Promise<ValidationReport> {
    this.logger.log(`Validating 3D model: ${modelId}`);

    const model = await this.prisma.aR3DModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const checks: ValidationCheck[] = [];
    const autoFixes: string[] = [];
    const recommendations: string[] = [];

    // Check file size
    checks.push({
      name: 'file_size',
      passed: model.originalFileSize <= AR_LIMITS.maxFileSize,
      severity: model.originalFileSize > AR_LIMITS.maxFileSize ? 'error' : 'info',
      message: model.originalFileSize > AR_LIMITS.maxFileSize
        ? `File size (${(model.originalFileSize / 1024 / 1024).toFixed(1)} MB) exceeds limit (${AR_LIMITS.maxFileSize / 1024 / 1024} MB)`
        : `File size: ${(model.originalFileSize / 1024 / 1024).toFixed(1)} MB`,
      value: model.originalFileSize,
      limit: AR_LIMITS.maxFileSize,
    });

    // Check mobile file size
    if (model.originalFileSize > AR_LIMITS.maxFileSizeMobile) {
      checks.push({
        name: 'mobile_file_size',
        passed: false,
        severity: 'warning',
        message: `File may be too large for mobile AR (${(model.originalFileSize / 1024 / 1024).toFixed(1)} MB > ${AR_LIMITS.maxFileSizeMobile / 1024 / 1024} MB)`,
        value: model.originalFileSize,
        limit: AR_LIMITS.maxFileSizeMobile,
      });
      recommendations.push('Consider generating LOD levels for mobile delivery');
    }

    // Check polygon count
    if (model.polyCount > 0) {
      checks.push({
        name: 'poly_count',
        passed: model.polyCount <= AR_LIMITS.maxPolyCount,
        severity: model.polyCount > AR_LIMITS.maxPolyCount ? 'error' : 'info',
        message: `Polygon count: ${model.polyCount.toLocaleString()}`,
        value: model.polyCount,
        limit: AR_LIMITS.maxPolyCount,
      });

      if (model.polyCount > AR_LIMITS.maxPolyCountMobile) {
        recommendations.push(
          `High polygon count (${model.polyCount.toLocaleString()}) - LOD generation recommended for mobile`,
        );
      }
    }

    // Check material count
    if (model.materialCount > 0) {
      checks.push({
        name: 'material_count',
        passed: model.materialCount <= AR_LIMITS.maxMaterialCount,
        severity: model.materialCount > AR_LIMITS.maxMaterialCount ? 'warning' : 'info',
        message: `Material count: ${model.materialCount}`,
        value: model.materialCount,
        limit: AR_LIMITS.maxMaterialCount,
      });
    }

    // Check format support
    const format = model.originalFormat.toLowerCase();
    const arReadyFormats = ['glb', 'gltf', 'usdz'];
    const convertibleFormats = ['fbx', 'obj', 'stl', '3ds', 'step', 'stp'];

    if (arReadyFormats.includes(format)) {
      checks.push({
        name: 'format',
        passed: true,
        severity: 'info',
        message: `Format ${format.toUpperCase()} is AR-ready`,
      });
    } else if (convertibleFormats.includes(format)) {
      checks.push({
        name: 'format',
        passed: true,
        severity: 'warning',
        message: `Format ${format.toUpperCase()} needs conversion to glTF/USDZ`,
      });
      recommendations.push(`Automatic conversion from ${format.toUpperCase()} to glTF/USDZ available`);
    } else {
      checks.push({
        name: 'format',
        passed: false,
        severity: 'error',
        message: `Format ${format.toUpperCase()} is not supported for AR`,
      });
    }

    // Determine overall status
    const hasErrors = checks.some((c) => !c.passed && c.severity === 'error');
    const hasWarnings = checks.some((c) => !c.passed && c.severity === 'warning');

    let status: ModelValidationStatus;
    if (hasErrors) {
      status = ModelValidationStatus.INVALID;
    } else if (autoFixes.length > 0) {
      status = ModelValidationStatus.FIXED_AUTOMATICALLY;
    } else {
      status = ModelValidationStatus.VALID;
    }

    // Estimate load time based on file size
    const estimatedLoadTime = {
      mobile: Math.round((model.originalFileSize / (2 * 1024 * 1024)) * 1000), // ~2 MB/s mobile
      desktop: Math.round((model.originalFileSize / (10 * 1024 * 1024)) * 1000), // ~10 MB/s desktop
    };

    // Parse dimensions from model if available
    const dimensions = (model.dimensions as { width?: number; height?: number; depth?: number }) || {
      width: 0,
      height: 0,
      depth: 0,
    };
    const boundingBox = (model.boundingBox as {
      min?: { x: number; y: number; z: number };
      max?: { x: number; y: number; z: number };
    }) || {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };

    // Update model in database
    await this.prisma.aR3DModel.update({
      where: { id: modelId },
      data: {
        validationStatus: status,
        validationErrors: checks.filter((c) => !c.passed).map((c) => c.message),
        autoFixApplied: autoFixes,
        estimatedLoadTime: estimatedLoadTime as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return {
      modelId,
      isValid: !hasErrors,
      status,
      checks,
      autoFixes,
      recommendations,
      metadata: {
        polyCount: model.polyCount,
        textureCount: model.textureCount,
        materialCount: model.materialCount,
        dimensions: dimensions as { width: number; height: number; depth: number },
        boundingBox: boundingBox as {
          min: { x: number; y: number; z: number };
          max: { x: number; y: number; z: number };
        },
        estimatedLoadTime,
      },
    };
  }
}
