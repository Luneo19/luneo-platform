import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const EXPORT_IMAGE_FORMAT = ['PNG', 'JPEG', 'WEBP'] as const;
export type ExportImageFormat = (typeof EXPORT_IMAGE_FORMAT)[number];

export const EXPORT_QUALITY = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as const;
export type ExportQuality = (typeof EXPORT_QUALITY)[number];

export class ExportImageDto {
  @ApiProperty({
    description: 'Session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'View ID (for multi-view customizers)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  viewId?: string;

  @ApiProperty({
    description: 'Export format',
    enum: EXPORT_IMAGE_FORMAT,
    example: 'PNG',
  })
  @IsIn(EXPORT_IMAGE_FORMAT)
  format: ExportImageFormat;

  @ApiPropertyOptional({
    description: 'Export quality',
    enum: EXPORT_QUALITY,
    example: 'HIGH',
  })
  @IsOptional()
  @IsIn(EXPORT_QUALITY)
  quality?: ExportQuality;

  @ApiPropertyOptional({
    description: 'Image width (100-8192)',
    example: 1920,
    minimum: 100,
    maximum: 8192,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8192)
  width?: number;

  @ApiPropertyOptional({
    description: 'Image height (100-8192)',
    example: 1080,
    minimum: 100,
    maximum: 8192,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8192)
  height?: number;

  @ApiPropertyOptional({
    description: 'JPEG quality (1-100, only for JPEG format)',
    example: 90,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  jpegQuality?: number;

  @ApiPropertyOptional({
    description: 'Include background',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeBackground?: boolean;

  @ApiPropertyOptional({
    description: 'Include product image',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeProductImage?: boolean;

  @ApiPropertyOptional({
    description: 'Export design only (without product)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  designOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Add watermark',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  addWatermark?: boolean;
}
