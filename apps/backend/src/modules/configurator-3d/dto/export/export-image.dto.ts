import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const EXPORT_IMAGE_FORMAT = ['png', 'jpg', 'webp'] as const;
export type ExportImageFormat = (typeof EXPORT_IMAGE_FORMAT)[number];

export class ExportImageDto {
  @ApiPropertyOptional({
    description: 'Image width (100-8192)',
    minimum: 100,
    maximum: 8192,
    default: 1920,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8192)
  width?: number = 1920;

  @ApiPropertyOptional({
    description: 'Image height (100-8192)',
    minimum: 100,
    maximum: 8192,
    default: 1080,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(8192)
  height?: number = 1080;

  @ApiPropertyOptional({
    description: 'Image format',
    enum: EXPORT_IMAGE_FORMAT,
    default: 'png',
  })
  @IsOptional()
  @IsIn(EXPORT_IMAGE_FORMAT)
  format?: ExportImageFormat = 'png';

  @ApiPropertyOptional({
    description: 'Quality (1-100, for jpg/webp)',
    minimum: 1,
    maximum: 100,
    default: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number = 90;

  @ApiPropertyOptional({
    description: 'Transparent background (for PNG)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  transparent?: boolean = false;
}
