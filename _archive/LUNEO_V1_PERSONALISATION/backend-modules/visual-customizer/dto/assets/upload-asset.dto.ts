import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import {
  CustomizerAssetType,
  CustomizerAssetVisibility,
} from '@prisma/client';

export class UploadAssetDto {
  @ApiProperty({
    description: 'Asset name',
    example: 'Logo Design',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Asset description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Asset type',
    enum: CustomizerAssetType,
    example: CustomizerAssetType.IMAGE,
  })
  @IsEnum(CustomizerAssetType)
  type: CustomizerAssetType;

  @ApiPropertyOptional({
    description: 'Associated customizer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  customizerId?: string;

  @ApiPropertyOptional({
    description: 'Asset visibility',
    enum: CustomizerAssetVisibility,
    example: CustomizerAssetVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(CustomizerAssetVisibility)
  visibility?: CustomizerAssetVisibility;

  @ApiPropertyOptional({
    description: 'Asset category',
    example: 'logos',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization (transformed to lowercase)',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((tag: string) => tag.toLowerCase());
    }
    return value;
  })
  tags?: string[];
}
