import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsObject,
  ArrayMaxSize,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Max base64 payload per screenshot: ~5MB image = ~6.7MB base64.
 * We cap at 7MB base64 string length to be safe.
 */
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;

export class BatchScreenshotItemDto {
  @ApiProperty({
    description: 'Image en base64 (data:image/png;base64,... ou raw base64)',
  })
  @IsString()
  @MaxLength(MAX_BASE64_LENGTH, {
    message: `Image base64 exceeds maximum size of ${Math.round(MAX_BASE64_LENGTH / 1024 / 1024)}MB`,
  })
  @Matches(
    /^(data:image\/(png|jpeg|jpg|webp);base64,)?[A-Za-z0-9+/]+=*$/,
    { message: 'Invalid base64 image format. Must be a valid base64 string with optional data:image/... prefix.' },
  )
  imageBase64: string;

  @ApiProperty({
    description: 'ID du produit visible dans le screenshot',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'Métadonnées du screenshot (angle caméra, éclairage, etc.)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class BatchScreenshotsDto {
  @ApiProperty({
    description: 'Tableau de screenshots à uploader (max 20)',
    type: [BatchScreenshotItemDto],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BatchScreenshotItemDto)
  screenshots: BatchScreenshotItemDto[];
}
