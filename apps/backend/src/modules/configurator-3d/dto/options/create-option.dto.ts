import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import {
  Configurator3DOptionType,
  PricingType,
} from '@prisma/client';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

// =============================================================================
// Value DTOs (for option value JSON)
// =============================================================================

export class ColorValueDto {
  @ApiProperty({
    example: '#000000',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  hex: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  metalness?: number;

  @ApiPropertyOptional({ example: 0.5, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  roughness?: number;
}

export class MaterialValueDto {
  @ApiProperty({ example: 'Leather' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Diffuse map URL' })
  @IsOptional()
  @IsUrl()
  diffuseMapUrl?: string;

  @ApiPropertyOptional({ description: 'Normal map URL' })
  @IsOptional()
  @IsUrl()
  normalMapUrl?: string;

  @ApiPropertyOptional({ description: 'Roughness map URL' })
  @IsOptional()
  @IsUrl()
  roughnessMapUrl?: string;

  @ApiPropertyOptional({ description: 'Metalness map URL' })
  @IsOptional()
  @IsUrl()
  metalnessMapUrl?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  metalness?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  roughness?: number;

  @ApiPropertyOptional({ description: 'Environment map intensity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  envMapIntensity?: number;
}

export class TextureValueDto {
  @ApiProperty({ description: 'Texture URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  repeatX?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  repeatY?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  offsetX?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  offsetY?: number;
}

export class ModelValueDto {
  @ApiProperty({
    description: 'Model URL (.gltf or .glb)',
    example: 'https://example.com/part.glb',
  })
  @IsUrl()
  @Matches(/\.(gltf|glb)(\?|$)/i, {
    message: 'url must point to a .gltf or .glb file',
  })
  url: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  scale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  position?: { x: number; y: number; z: number };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rotation?: { x: number; y: number; z: number };
}

export class PricingDto {
  @ApiProperty({ enum: PricingType })
  @IsEnum(PricingType)
  type: PricingType;

  @ApiProperty({ example: 0, description: 'Price value (cents or percentage)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Formula for FORMULA type' })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217)',
    pattern: '^[A-Z]{3}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateOptionDto {
  @ApiProperty({
    description: 'Component ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
    message: 'componentId must be a valid UUID',
  })
  componentId: string;

  @ApiProperty({
    description: 'Option name',
    example: 'Midnight Black',
    minLength: 1,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'SKU',
    pattern: '^[a-zA-Z0-9_-]+$',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_SKU_LENGTH,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_SKU_LENGTH)
  sku?: string;

  @ApiPropertyOptional({
    description: 'Option description',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Option type',
    enum: Configurator3DOptionType,
  })
  @IsEnum(Configurator3DOptionType)
  type: Configurator3DOptionType;

  @ApiProperty({
    description: 'Option value (structure depends on type)',
    example: { hex: '#000000', name: 'Black' },
  })
  @IsObject()
  value: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Pricing configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @IsOptional()
  @IsUrl()
  previewImageUrl?: string;

  @ApiPropertyOptional({ description: 'Is default option', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ description: 'Is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;

  @ApiPropertyOptional({ description: 'In stock', default: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean = true;

  @ApiPropertyOptional({
    description: 'Lead time in days (0-365)',
    minimum: 0,
    maximum: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
