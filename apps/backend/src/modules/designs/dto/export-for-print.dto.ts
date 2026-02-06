import { IsEnum, IsOptional, IsObject, IsString, IsNumber, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DimensionsDto {
  @ApiProperty({ description: 'Largeur en pixels', example: 1920, minimum: 1 })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ description: 'Hauteur en pixels', example: 1080, minimum: 1 })
  @IsNumber()
  @Min(1)
  height: number;
}

export class ExportForPrintDto {
  @ApiPropertyOptional({
    description: 'ID du design (requis pour la route alias /export-print)',
    example: 'design_123',
  })
  @IsOptional()
  @IsString()
  designId?: string;

  @ApiPropertyOptional({
    description: 'Format d\'export',
    enum: ['pdf', 'png', 'jpg', 'svg'],
    example: 'pdf',
    default: 'pdf',
  })
  @IsOptional()
  @IsEnum(['pdf', 'png', 'jpg', 'svg'])
  format?: 'pdf' | 'png' | 'jpg' | 'svg';

  @ApiPropertyOptional({
    description: 'Qualité d\'export',
    enum: ['low', 'medium', 'high', 'ultra'],
    example: 'high',
    default: 'high',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'ultra'])
  quality?: 'low' | 'medium' | 'high' | 'ultra';

  @ApiPropertyOptional({
    description: 'Dimensions personnalisées',
    type: DimensionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({
    description: 'URL de l\'image à exporter (si différente de celle du design)',
    example: 'https://cdn.example.com/image.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Données du design pour génération SVG',
    example: { objects: [], background: '#ffffff' },
  })
  @IsOptional()
  @IsObject()
  designData?: Record<string, unknown>;
}
