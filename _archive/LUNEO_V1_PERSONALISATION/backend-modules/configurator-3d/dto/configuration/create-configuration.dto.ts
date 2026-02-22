import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import {
  ConfiguratorType,
  ConfiguratorStatus,
} from '@prisma/client';
import {
  CONFIGURATOR_3D_LIMITS,
} from '../../configurator-3d.constants';

// =============================================================================
// Nested DTOs
// =============================================================================

export class Vector3Dto {
  @ApiProperty({ example: 0, description: 'X coordinate' })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0, description: 'Y coordinate' })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 0, description: 'Z coordinate' })
  @IsNumber()
  z: number;
}

export class SceneSettingsDto {
  @ApiPropertyOptional({
    example: '#ffffff',
    description: 'Background color in hex format',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'backgroundColor must be a valid hex color (e.g. #ffffff)',
  })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Environment map URL' })
  @IsOptional()
  @IsString()
  environmentMap?: string;

  @ApiPropertyOptional({ description: 'Lights configuration' })
  @IsOptional()
  @IsObject()
  lights?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Shadows configuration' })
  @IsOptional()
  @IsObject()
  shadows?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Enable auto-rotate' })
  @IsOptional()
  @IsBoolean()
  autoRotate?: boolean;
}

export class CameraSettingsDto {
  @ApiPropertyOptional({
    example: 45,
    description: 'Field of view (10-120)',
    minimum: 10,
    maximum: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  fov?: number;

  @ApiPropertyOptional({ description: 'Minimum camera distance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDistance?: number;

  @ApiPropertyOptional({ description: 'Maximum camera distance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Enable zoom' })
  @IsOptional()
  @IsBoolean()
  enableZoom?: boolean;

  @ApiPropertyOptional({ description: 'Enable pan' })
  @IsOptional()
  @IsBoolean()
  enablePan?: boolean;

  @ApiPropertyOptional({ description: 'Initial camera position' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  initialPosition?: Vector3Dto;
}

export class PricingSettingsDto {
  @ApiPropertyOptional({ example: 0, description: 'Base price in cents' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    example: 'EUR',
    description: 'ISO 4217 currency code',
    pattern: '^[A-Z]{3}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a valid ISO 4217 code' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Show price in configurator' })
  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;

  @ApiPropertyOptional({ description: 'Enable dynamic pricing' })
  @IsOptional()
  @IsBoolean()
  enableDynamicPricing?: boolean;

  @ApiPropertyOptional({
    example: 0.2,
    description: 'Tax rate (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateConfigurationDto {
  @ApiProperty({
    description: 'Configuration name',
    example: 'Premium Watch Configurator',
    minLength: CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Configuration description',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'Associated product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  @Matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    { message: 'productId must be a valid UUID' },
  )
  productId?: string;

  @ApiProperty({
    description: 'Configurator type',
    enum: ConfiguratorType,
  })
  @IsEnum(ConfiguratorType)
  type: ConfiguratorType;

  @ApiPropertyOptional({
    description: 'Configurator status',
    enum: ConfiguratorStatus,
  })
  @IsOptional()
  @IsEnum(ConfiguratorStatus)
  status?: ConfiguratorStatus;

  @ApiPropertyOptional({
    description: '3D model URL (.gltf or .glb)',
    example: 'https://example.com/model.glb',
  })
  @IsOptional()
  @IsUrl()
  @Matches(/\.(gltf|glb)(\?|$)/i, {
    message: 'modelUrl must point to a .gltf or .glb file',
  })
  modelUrl?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail image URL',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Scene settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneSettingsDto)
  sceneSettings?: SceneSettingsDto;

  @ApiPropertyOptional({ description: 'Camera settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CameraSettingsDto)
  cameraSettings?: CameraSettingsDto;

  @ApiPropertyOptional({ description: 'Pricing settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingSettingsDto)
  pricingSettings?: PricingSettingsDto;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    maxItems: CONFIGURATOR_3D_LIMITS.MAX_TAGS,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_TAGS)
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Enable AR mode', default: true })
  @IsOptional()
  @IsBoolean()
  enableAR?: boolean;

  @ApiPropertyOptional({ description: 'Enable screenshots', default: true })
  @IsOptional()
  @IsBoolean()
  enableScreenshots?: boolean;

  @ApiPropertyOptional({ description: 'Enable sharing', default: true })
  @IsOptional()
  @IsBoolean()
  enableSharing?: boolean;

  @ApiPropertyOptional({
    description: 'Custom CSS (no HTML tags)',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_CUSTOM_CSS,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_CUSTOM_CSS)
  @Matches(/^(?!.*<[^>]+>).*$/s, {
    message: 'customCss must not contain HTML tags',
  })
  customCss?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
