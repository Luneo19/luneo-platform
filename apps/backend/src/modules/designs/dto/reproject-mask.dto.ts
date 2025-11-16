import { IsObject, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UVBBoxDto {
  @ApiProperty({ description: 'Coordonnée U minimale', example: 0.0 })
  @IsNumber()
  minU: number;

  @ApiProperty({ description: 'Coordonnée V minimale', example: 0.0 })
  @IsNumber()
  minV: number;

  @ApiProperty({ description: 'Coordonnée U maximale', example: 1.0 })
  @IsNumber()
  maxU: number;

  @ApiProperty({ description: 'Coordonnée V maximale', example: 1.0 })
  @IsNumber()
  maxV: number;
}

export class ReprojectMaskDto {
  @ApiProperty({ description: 'Bounding box UV source', type: UVBBoxDto })
  @ValidateNested()
  @Type(() => UVBBoxDto)
  sourceUVBBox: UVBBoxDto;

  @ApiProperty({ description: 'Bounding box UV cible', type: UVBBoxDto })
  @ValidateNested()
  @Type(() => UVBBoxDto)
  targetUVBBox: UVBBoxDto;

  @ApiPropertyOptional({ description: 'Largeur de la texture source', example: 1024 })
  @IsOptional()
  @IsNumber()
  sourceTextureWidth?: number;

  @ApiPropertyOptional({ description: 'Hauteur de la texture source', example: 1024 })
  @IsOptional()
  @IsNumber()
  sourceTextureHeight?: number;

  @ApiPropertyOptional({ description: 'Largeur de la texture cible', example: 1024 })
  @IsOptional()
  @IsNumber()
  targetTextureWidth?: number;

  @ApiPropertyOptional({ description: 'Hauteur de la texture cible', example: 1024 })
  @IsOptional()
  @IsNumber()
  targetTextureHeight?: number;
}
