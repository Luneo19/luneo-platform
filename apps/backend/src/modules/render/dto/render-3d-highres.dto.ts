import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Render3DHighResDto {
  @ApiProperty({ description: '3D configuration ID' })
  @IsString()
  @IsNotEmpty()
  configurationId: string;

  @ApiPropertyOptional({
    description: 'Render preset',
    enum: ['thumbnail', 'preview', 'hd', '2k', '4k', 'print'],
  })
  @IsOptional()
  @IsEnum(['thumbnail', 'preview', 'hd', '2k', '4k', 'print'])
  preset?: 'thumbnail' | 'preview' | 'hd' | '2k' | '4k' | 'print';

  @ApiPropertyOptional({ description: 'Output width', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Output height', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    description: 'Output format',
    enum: ['png', 'jpg', 'webp'],
  })
  @IsOptional()
  @IsEnum(['png', 'jpg', 'webp'])
  format?: 'png' | 'jpg' | 'webp';

  @ApiPropertyOptional({ description: 'Quality 0-100', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ description: 'Transparent background' })
  @IsOptional()
  @IsBoolean()
  transparent?: boolean;

  @ApiPropertyOptional({ description: 'Watermark text' })
  @IsOptional()
  @IsString()
  watermark?: string;
}
