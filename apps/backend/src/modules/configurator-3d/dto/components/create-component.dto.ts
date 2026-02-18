import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUrl,
  IsNumber,
  IsUUID,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
export const ComponentType = {
  MESH: 'MESH',
  MATERIAL: 'MATERIAL',
  TEXTURE: 'TEXTURE',
  COLOR: 'COLOR',
  DECAL: 'DECAL',
  ACCESSORY: 'ACCESSORY',
  SIZE: 'SIZE',
  ENGRAVING: 'ENGRAVING',
} as const;
export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

export const SelectionMode = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
} as const;
export type SelectionMode = (typeof SelectionMode)[keyof typeof SelectionMode];
import {
  CONFIGURATOR_3D_LIMITS,
} from '../../configurator-3d.constants';

// =============================================================================
// Nested DTOs
// =============================================================================

export class ComponentPositionDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  z: number;
}

export class ComponentBoundsDto {
  @ApiProperty({ description: 'Minimum bounds' })
  @ValidateNested()
  @Type(() => ComponentPositionDto)
  min: ComponentPositionDto;

  @ApiProperty({ description: 'Maximum bounds' })
  @ValidateNested()
  @Type(() => ComponentPositionDto)
  max: ComponentPositionDto;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateComponentDto {
  @ApiProperty({
    description: 'Configuration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  configurationId: string;

  @ApiProperty({
    description: 'Component name',
    example: 'Dial Color',
    minLength: CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH,
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH,
  })
  @IsString()
  @MinLength(CONFIGURATOR_3D_LIMITS.MIN_NAME_LENGTH)
  @MaxLength(CONFIGURATOR_3D_LIMITS.MAX_NAME_LENGTH)
  @Sanitize()
  name: string;

  @ApiProperty({
    description: 'Technical ID (alphanumeric, underscore, hyphen)',
    example: 'dial_color',
    pattern: '^[a-zA-Z0-9_-]+$',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'technicalId must contain only alphanumeric, underscore, or hyphen',
  })
  technicalId: string;

  @ApiPropertyOptional({
    description: 'Component description',
    maxLength: CONFIGURATOR_3D_LIMITS.MAX_DESCRIPTION_LENGTH,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Component type',
    enum: ComponentType,
  })
  @IsEnum(ComponentType)
  type: ComponentType;

  @ApiPropertyOptional({
    description: 'Selection mode',
    enum: SelectionMode,
  })
  @IsOptional()
  @IsEnum(SelectionMode)
  selectionMode?: SelectionMode;

  @ApiPropertyOptional({
    description: 'Sort order (0-1000)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  sortOrder?: number = 0;

  @ApiPropertyOptional({ description: 'Is visible', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true;

  @ApiPropertyOptional({ description: 'Is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @IsOptional()
  @IsUrl()
  previewImageUrl?: string;

  @ApiPropertyOptional({ description: '3D bounds' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentBoundsDto)
  bounds?: ComponentBoundsDto;

  @ApiPropertyOptional({ description: 'Camera focus point' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentPositionDto)
  cameraFocusPoint?: ComponentPositionDto;

  @ApiPropertyOptional({
    description: 'Dependency component IDs (max 20)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(CONFIGURATOR_3D_LIMITS.MAX_DEPENDENCIES)
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
