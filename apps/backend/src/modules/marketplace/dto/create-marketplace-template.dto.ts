import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a marketplace template
 * Matches CreateMarketplaceTemplateData interface
 */
export class CreateMarketplaceTemplateDto {
  @ApiProperty({
    description: 'Creator ID',
    example: 'creator_123',
  })
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @ApiProperty({
    description: 'Template name',
    example: 'Product Photography Style',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Template slug (URL-friendly)',
    example: 'product-photography-style',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'A professional product photography style template',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category',
    example: 'photography',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['photography', 'product', 'professional'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Prompt template',
    example: 'A professional product photo of {product}',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  promptTemplate: string;

  @ApiPropertyOptional({
    description: 'Negative prompt',
    example: 'blurry, low quality',
  })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({
    description: 'Variables for the prompt template',
    example: { product: 'string', style: 'string' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Example output URLs',
    example: ['https://example.com/output1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exampleOutputs?: string[];

  @ApiPropertyOptional({
    description: 'AI provider',
    example: 'openai',
    default: 'openai',
  })
  @IsOptional()
  @IsString()
  aiProvider?: string;

  @ApiPropertyOptional({
    description: 'Model name',
    example: 'dall-e-3',
    default: 'dall-e-3',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Quality setting',
    example: 'standard',
    default: 'standard',
  })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({
    description: 'Style setting',
    example: 'natural',
    default: 'natural',
  })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({
    description: 'Price in cents',
    example: 999,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({
    description: 'Whether the template is free',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Revenue share percentage for creator',
    example: 70,
    minimum: 0,
    maximum: 100,
    default: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  revenueSharePercent?: number;

  @ApiPropertyOptional({
    description: 'Thumbnail URL',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Preview image URLs',
    example: ['https://example.com/preview1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previewImages?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { version: '1.0', license: 'MIT' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
