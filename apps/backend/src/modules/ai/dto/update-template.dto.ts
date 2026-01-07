/**
 * ★★★ DTO - UPDATE TEMPLATE ★★★
 * DTO pour la mise à jour d'un template AI
 * Respecte la Bible Luneo : validation Zod, types explicites
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, IsUrl } from 'class-validator';

export class UpdateTemplateDto {
  @ApiProperty({ description: 'Template name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Subcategory', required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ description: 'Prompt template', required: false })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({ description: 'Style', required: false })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({ description: 'Thumbnail URL', required: false })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Preview URL', required: false })
  @IsUrl()
  @IsOptional()
  previewUrl?: string;

  @ApiProperty({ description: 'Price in credits', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Is premium template', required: false })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiProperty({ description: 'Tags', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}


