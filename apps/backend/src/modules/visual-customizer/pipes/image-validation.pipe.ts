import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import {
  VISUAL_CUSTOMIZER_LIMITS,
} from '../visual-customizer.constants';

const ALLOWED_IMAGE_TYPES = VISUAL_CUSTOMIZER_LIMITS.ALLOWED_IMAGE_TYPES;

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  async transform(
    value: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    metadata: ArgumentMetadata,
  ): Promise<{ buffer: Buffer; mimetype: string; originalname: string; size: number }> {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    // Validate file size
    const maxSizeBytes = VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (value.size > maxSizeBytes) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB}MB`,
      );
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(value.mimetype as typeof ALLOWED_IMAGE_TYPES[number])) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Skip dimension validation for SVG
    if (value.mimetype === 'image/svg+xml') {
      return value;
    }

    // Validate dimensions using sharp
    try {
      const metadata = await sharp(value.buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Check minimum dimensions
      if (
        width < VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.width ||
        height < VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.height
      ) {
        throw new BadRequestException(
          `Image dimensions too small. Minimum: ${VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.width}x${VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.height}`,
        );
      }

      // Check maximum dimensions
      if (
        width > VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.width ||
        height > VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.height
      ) {
        throw new BadRequestException(
          `Image dimensions too large. Maximum: ${VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.width}x${VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.height}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate image dimensions');
    }

    return value;
  }
}
