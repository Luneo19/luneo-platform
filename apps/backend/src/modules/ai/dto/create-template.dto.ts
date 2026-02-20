/**
 * ★★★ DTO - CREATE TEMPLATE ★★★
 * DTO pour la création d'un template AI
 * Respecte la Bible Luneo : validation Zod, types explicites
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, IsUrl } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Logo Minimaliste' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Category', example: 'logo' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Subcategory', example: 'minimalist', required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ description: 'Prompt template', example: 'Create a minimalist logo' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Style', example: 'modern', required: false })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({ description: 'Thumbnail URL', example: 'https://example.com/thumb.jpg' })
  @IsUrl()
  thumbnailUrl: string;

  @ApiProperty({ description: 'Preview URL', example: 'https://example.com/preview.jpg', required: false })
  @IsUrl()
  @IsOptional()
  previewUrl?: string;

  @ApiProperty({ description: 'Price in credits', example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Is premium template', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiProperty({ description: 'Tags', example: ['logo', 'minimalist'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}



