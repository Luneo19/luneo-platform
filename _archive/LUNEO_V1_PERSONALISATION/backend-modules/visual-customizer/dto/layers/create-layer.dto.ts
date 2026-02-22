import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import {
  VisualCustomizerLayerType,
  BlendMode,
} from '@prisma/client';

// =============================================================================
// Nested DTOs
// =============================================================================

export class TransformDto {
  @ApiProperty({
    description: 'X position',
    example: 0,
  })
  @IsNumber()
  @Type(() => Number)
  x: number;

  @ApiProperty({
    description: 'Y position',
    example: 0,
  })
  @IsNumber()
  @Type(() => Number)
  y: number;

  @ApiPropertyOptional({
    description: 'Width (min 1)',
    example: 100,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional({
    description: 'Height (min 1)',
    example: 100,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  height?: number;

  @ApiPropertyOptional({
    description: 'Scale X (0.01-100)',
    example: 1,
    minimum: 0.01,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Type(() => Number)
  scaleX?: number;

  @ApiPropertyOptional({
    description: 'Scale Y (0.01-100)',
    example: 1,
    minimum: 0.01,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Type(() => Number)
  scaleY?: number;

  @ApiPropertyOptional({
    description: 'Rotation in degrees (-360 to 360)',
    example: 0,
    minimum: -360,
    maximum: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(-360)
  @Max(360)
  @Type(() => Number)
  rotation?: number;

  @ApiPropertyOptional({
    description: 'Skew X in degrees (-90 to 90)',
    example: 0,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  skewX?: number;

  @ApiPropertyOptional({
    description: 'Skew Y in degrees (-90 to 90)',
    example: 0,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  skewY?: number;

  @ApiPropertyOptional({
    description: 'Flip horizontally',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  flipX?: boolean;

  @ApiPropertyOptional({
    description: 'Flip vertically',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  flipY?: boolean;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateLayerDto {
  @ApiProperty({
    description: 'Zone ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  zoneId: string;

  @ApiProperty({
    description: 'Layer name',
    example: 'Text Layer 1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiProperty({
    description: 'Layer type',
    enum: VisualCustomizerLayerType,
    example: VisualCustomizerLayerType.TEXT,
  })
  @IsEnum(VisualCustomizerLayerType)
  type: VisualCustomizerLayerType;

  @ApiProperty({
    description: 'Layer transform',
    type: TransformDto,
  })
  @ValidateNested()
  @Type(() => TransformDto)
  transform: TransformDto;

  @ApiProperty({
    description: 'Layer content (type-specific data)',
    example: {
      text: 'Hello World',
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
    },
  })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Opacity (0-1)',
    example: 1,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  opacity?: number;

  @ApiPropertyOptional({
    description: 'Blend mode',
    enum: BlendMode,
    example: BlendMode.NORMAL,
  })
  @IsOptional()
  @IsEnum(BlendMode)
  blendMode?: BlendMode;

  @ApiPropertyOptional({
    description: 'Sort order (0-1000)',
    example: 0,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Is visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Is locked',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({
    description: 'Is selectable',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSelectable?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Shadow enabled', default: false })
  @IsOptional()
  @IsBoolean()
  shadowEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Shadow color', example: '#000000' })
  @IsOptional()
  @IsString()
  shadowColor?: string;

  @ApiPropertyOptional({ description: 'Shadow offset X', example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shadowOffsetX?: number;

  @ApiPropertyOptional({ description: 'Shadow offset Y', example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shadowOffsetY?: number;

  @ApiPropertyOptional({ description: 'Shadow blur', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shadowBlur?: number;

  @ApiPropertyOptional({ description: 'Parent layer ID' })
  @IsOptional()
  @IsString()
  parentLayerId?: string;
}
