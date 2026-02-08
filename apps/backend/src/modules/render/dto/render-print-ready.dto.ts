import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenderPrintReadyDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Width in pixels', minimum: 1 })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ description: 'Height in pixels', minimum: 1 })
  @IsNumber()
  @Min(1)
  height: number;

  @ApiPropertyOptional({ description: 'DPI (default 300)', minimum: 72, maximum: 600 })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(600)
  dpi?: number;

  @ApiPropertyOptional({
    description: 'Output format',
    enum: ['png', 'jpg', 'pdf'],
  })
  @IsOptional()
  @IsEnum(['png', 'jpg', 'pdf'])
  format?: 'png' | 'jpg' | 'pdf';

  @ApiPropertyOptional({ description: 'Quality 0-100', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ description: 'Background color (e.g. #ffffff)' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Bleed in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bleed?: number;
}
