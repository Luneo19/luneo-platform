import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import * as sharp from 'sharp';
import {
  VISUAL_CUSTOMIZER_LIMITS,
} from '../visual-customizer.constants';

const ALLOWED_IMAGE_TYPES = VISUAL_CUSTOMIZER_LIMITS.ALLOWED_IMAGE_TYPES;

export type FileMetadata = {
  width?: number;
  height?: number;
  format?: string;
  hasAlpha?: boolean;
  mimeType: string;
  size: number;
};

export type RequestWithFileMetadata = Request & {
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
  fileMetadata?: FileMetadata;
  fileType?: string;
};

@Injectable()
export class FileUploadValidationInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithFileMetadata>();
    const file = request.file;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file size
    const maxSizeBytes = VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB}MB`,
      );
    }

    // Detect MIME type by magic bytes using file-type
    let detectedMimeType: string | undefined;
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const result = await fileTypeFromBuffer(file.buffer);
      detectedMimeType = result?.mime;
    } catch (error) {
      // file-type might not be available, fall back to multer's mimetype
      detectedMimeType = file.mimetype;
    }

    // Validate MIME type
    const mimeType = detectedMimeType || file.mimetype;
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType as typeof ALLOWED_IMAGE_TYPES[number])) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Skip dimension validation for SVG
    if (mimeType === 'image/svg+xml') {
      request.fileMetadata = {
        mimeType,
        size: file.size,
        format: 'svg',
      };
      request.fileType = 'svg';
      return next.handle();
    }

    // Validate dimensions for raster images using sharp
    try {
      const metadata = await sharp(file.buffer).metadata();
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

      request.fileMetadata = {
        width,
        height,
        format: metadata.format || undefined,
        hasAlpha: metadata.hasAlpha || false,
        mimeType,
        size: file.size,
      };
      request.fileType = metadata.format || 'unknown';
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process image metadata');
    }

    return next.handle();
  }
}
