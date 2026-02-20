import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';

@Injectable()
export class FileSizePipe implements PipeTransform {
  constructor(private readonly maxSizeMB: number) {}

  transform(
    value: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    _metadata: ArgumentMetadata,
  ): { buffer: Buffer; mimetype: string; originalname: string; size: number } {
    if (!value) {
      throw new BadRequestException('File is required');
    }

    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;

    if (value.size > maxSizeBytes) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${this.maxSizeMB}MB`,
      );
    }

    return value;
  }
}
