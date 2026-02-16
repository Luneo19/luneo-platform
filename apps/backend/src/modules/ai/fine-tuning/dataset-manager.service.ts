import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface DatasetValidationResult {
  valid: boolean;
  imageCount: number;
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class DatasetManagerService {
  private readonly logger = new Logger(DatasetManagerService.name);

  async validateDataset(imageUrls: string[]): Promise<DatasetValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (imageUrls.length < 5) issues.push('Minimum 5 images required for training');
    if (imageUrls.length > 50) issues.push('Maximum 50 images allowed');
    if (imageUrls.length < 10) recommendations.push('10-20 images recommended for best results');
    if (imageUrls.length >= 10 && imageUrls.length < 20) recommendations.push('Good dataset size');
    if (imageUrls.length >= 20)
      recommendations.push('Large dataset - training may take longer but produce better results');

    // Basic URL validation
    const invalidUrls = imageUrls.filter((url) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });
    if (invalidUrls.length > 0) issues.push(`${invalidUrls.length} invalid image URLs`);

    // Check for duplicates
    const uniqueUrls = new Set(imageUrls);
    if (uniqueUrls.size < imageUrls.length) {
      issues.push(`${imageUrls.length - uniqueUrls.size} duplicate images detected`);
    }

    recommendations.push('Ensure images are high-quality and representative of desired output style');
    recommendations.push('Include variety in angles, lighting, and backgrounds');

    return {
      valid: issues.length === 0,
      imageCount: imageUrls.length,
      issues,
      recommendations,
    };
  }

  async prepareDataset(
    imageUrls: string[],
  ): Promise<{ zipUrl?: string; imageCount: number; status: string }> {
    const validation = await this.validateDataset(imageUrls);
    if (!validation.valid) {
      throw new BadRequestException(`Dataset validation failed: ${validation.issues.join(', ')}`);
    }

    // In production, this would download, resize, and zip images for training
    this.logger.log(`Dataset prepared: ${imageUrls.length} images ready for training`);
    return {
      imageCount: imageUrls.length,
      status: 'ready',
    };
  }
}
