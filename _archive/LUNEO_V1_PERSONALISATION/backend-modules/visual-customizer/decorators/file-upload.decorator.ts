import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadValidationInterceptor } from '../interceptors/file-upload.interceptor';

/**
 * Decorator to handle file uploads with size limit
 * Usage: @FileUpload(10) // 10MB max
 */
export const FileUpload = (maxSizeMB: number) => {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor('file', {
        limits: {
          fileSize: maxSizeMB * 1024 * 1024, // Convert MB to bytes
        },
      }),
      FileUploadValidationInterceptor,
    ),
  );
};
