import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
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
  ZoneType2D,
  ZoneShape,
} from '@prisma/client';

// =============================================================================
// Nested DTOs
// =============================================================================

export class PointDto {
  @ApiProperty({
    description: 'X coordinate',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  x: number;

  @ApiProperty({
    description: 'Y coordinate',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  y: number;
}

export class BoundsDto {
  @ApiProperty({
    description: 'X position',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  x: number;

  @ApiProperty({
    description: 'Y position',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  y: number;

  @ApiProperty({
    description: 'Width',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  width: number;

  @ApiProperty({
    description: 'Height',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  height: number;

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
}

export class ConstraintsDto {
  @ApiPropertyOptional({
    description: 'Allow text elements',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowText?: boolean;

  @ApiPropertyOptional({
    description: 'Allow images',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowImages?: boolean;

  @ApiPropertyOptional({
    description: 'Allow shapes',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowShapes?: boolean;

  @ApiPropertyOptional({
    description: 'Allow clipart',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowClipart?: boolean;

  @ApiPropertyOptional({
    description: 'Allow drawing',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowDrawing?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of elements (1-100)',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  maxElements?: number;

  @ApiPropertyOptional({
    description: 'Lock aspect ratio',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  lockAspectRatio?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum scale (0.1-1)',
    example: 0.1,
    minimum: 0.1,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1)
  @Type(() => Number)
  minScale?: number;

  @ApiPropertyOptional({
    description: 'Maximum scale (1-10)',
    example: 10,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxScale?: number;

  @ApiPropertyOptional({
    description: 'Allow rotation',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowRotation?: boolean;

  @ApiPropertyOptional({
    description: 'Snap to bounds',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  snapToBounds?: boolean;

  @ApiPropertyOptional({
    description: 'Clip content to bounds',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  clipContent?: boolean;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateZoneDto {
  @ApiProperty({
    description: 'Customizer ID',
    example: 'cmlrpvbbm0001ap19lhv53716',
  })
  @IsString()
  customizerId: string;

  @ApiPropertyOptional({
    description: 'View ID (for multi-view customizers)',
    example: 'cmlrpvbbm0001ap19lhv53716',
  })
  @IsOptional()
  @IsString()
  viewId?: string;

  @ApiProperty({
    description: 'Zone name',
    example: 'Front Design Area',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Zone description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Zone type',
    enum: ZoneType2D,
    example: ZoneType2D.EDITABLE,
  })
  @IsEnum(ZoneType2D)
  type: ZoneType2D;

  @ApiProperty({
    description: 'Zone shape',
    enum: ZoneShape,
    example: ZoneShape.RECTANGLE,
  })
  @IsEnum(ZoneShape)
  shape: ZoneShape;

  @ApiProperty({
    description: 'Zone bounds',
    type: BoundsDto,
  })
  @ValidateNested()
  @Type(() => BoundsDto)
  bounds: BoundsDto;

  @ApiPropertyOptional({
    description: 'Polygon points (for POLYGON shape)',
    type: [PointDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointDto)
  polygonPoints?: PointDto[];

  @ApiPropertyOptional({
    description: 'Border radius (0-100)',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  borderRadius?: number;

  @ApiPropertyOptional({
    description: 'Background color in hex format',
    example: '#ffffff',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'backgroundColor must be a valid hex color',
  })
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Border color in hex format',
    example: '#000000',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'borderColor must be a valid hex color',
  })
  borderColor?: string;

  @ApiPropertyOptional({
    description: 'Border width (0-10)',
    example: 1,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  borderWidth?: number;

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
    description: 'Zone constraints',
    type: ConstraintsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConstraintsDto)
  constraints?: ConstraintsDto;

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
    description: 'Price modifier (>=0)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceModifier?: number;
}
