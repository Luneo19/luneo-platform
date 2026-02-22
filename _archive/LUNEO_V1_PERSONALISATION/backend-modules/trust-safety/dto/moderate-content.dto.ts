import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsObject,
  IsNumber,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageModerationMetadataDto {
  @ApiPropertyOptional({ description: 'Image width in pixels' })
  @IsNumber()
  @Min(1)
  @Max(50000)
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels' })
  @IsNumber()
  @Min(1)
  @Max(50000)
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ description: 'MIME type (e.g. image/jpeg)' })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class ModerateContentDto {
  @ApiProperty({ description: 'Content type', enum: ['text', 'image', 'ai_generation'] })
  @IsEnum(['text', 'image', 'ai_generation'])
  type: 'text' | 'image' | 'ai_generation';

  @ApiPropertyOptional({ description: 'Text content (for text type)' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'Image URL (for image/ai_generation type)' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Image metadata for image/ai_generation moderation' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageModerationMetadataDto)
  imageMetadata?: ImageModerationMetadataDto;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Design ID' })
  @IsString()
  @IsOptional()
  designId?: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}

































