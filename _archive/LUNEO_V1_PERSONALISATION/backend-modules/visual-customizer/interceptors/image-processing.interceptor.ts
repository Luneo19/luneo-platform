import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import * as sharp from 'sharp';

export type ProcessedFile = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
};

export type ThumbnailFile = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
};

export type RequestWithProcessedFiles = Request & {
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
  processedFile?: ProcessedFile;
  thumbnailFile?: ThumbnailFile;
};

@Injectable()
export class ImageProcessingInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithProcessedFiles>();
    const file = request.file;

    if (!file) {
      return next.handle();
    }

    // Skip SVG processing
    if (file.mimetype === 'image/svg+xml') {
      return next.handle();
    }

    try {
      // Process image: auto-rotate based on EXIF
      const processedImage = sharp(file.buffer);
      const processedBuffer = await processedImage
        .rotate() // Auto-rotate based on EXIF orientation
        .toBuffer();

      const processedMetadata = await sharp(processedBuffer).metadata();

      request.processedFile = {
        buffer: processedBuffer,
        mimeType: file.mimetype,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
      };

      // Generate thumbnail: 200x200 JPEG, quality 80
      const thumbnailBuffer = await sharp(processedBuffer)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();

      request.thumbnailFile = {
        buffer: thumbnailBuffer,
        mimeType: 'image/jpeg',
        width: thumbnailMetadata.width || 200,
        height: thumbnailMetadata.height || 200,
      };
    } catch (error) {
      throw new BadRequestException('Failed to process image');
    }

    return next.handle();
  }
}
