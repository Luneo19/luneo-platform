import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';

export class CreatePresetDto {
  @ApiProperty({
    description: 'Preset name',
    example: 'Summer Collection Template',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Preset description',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Canvas data (JSON object containing layers, zones, etc.)',
    example: {
      layers: [],
      zones: [],
      settings: {},
    },
  })
  @IsObject()
  canvasData: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Preset category',
    example: 'templates',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Is public preset',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Is default preset',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

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
}
