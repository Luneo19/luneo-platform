import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractColorsDto {
  @ApiProperty({ description: 'URL of the image to extract colors from' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Maximum number of colors to extract', minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxColors?: number;

  @ApiPropertyOptional({ description: 'Whether to include neutral colors' })
  @IsOptional()
  @IsBoolean()
  includeNeutral?: boolean;
}
