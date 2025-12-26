import { IsOptional, IsString, IsBoolean, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from './create-product.dto';

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'ID de la marque' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Recherche textuelle', example: 'bague' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Catégorie', enum: ProductCategory })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiPropertyOptional({ description: 'Produit actif' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Produit public' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Prix minimum', example: 0 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Prix maximum', example: 1000 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Date de début (ISO string)' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO string)' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page', example: 1, default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite par page', example: 50, default: 50 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

