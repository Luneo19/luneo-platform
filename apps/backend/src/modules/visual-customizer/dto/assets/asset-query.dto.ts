import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CustomizerAssetType,
  CustomizerAssetVisibility,
} from '@prisma/client';

export class AssetQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by asset type',
    enum: CustomizerAssetType,
  })
  @IsOptional()
  @IsEnum(CustomizerAssetType)
  type?: CustomizerAssetType;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'logos',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search by name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by customizer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  customizerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: CustomizerAssetVisibility,
  })
  @IsOptional()
  @IsEnum(CustomizerAssetVisibility)
  visibility?: CustomizerAssetVisibility;
}
