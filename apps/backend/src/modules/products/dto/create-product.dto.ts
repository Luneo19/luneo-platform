import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min, Max, MaxLength, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductCategory {
  JEWELRY = 'JEWELRY',
  WATCHES = 'WATCHES',
  GLASSES = 'GLASSES',
  ACCESSORIES = 'ACCESSORIES',
  HOME = 'HOME',
  TECH = 'TECH',
  OTHER = 'OTHER',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Nom du produit', example: 'Bague en or avec diamant' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Description du produit', example: 'Magnifique bague en or 18 carats avec diamant central' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'SKU du produit', example: 'RING-GOLD-001' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ description: 'Catégorie du produit', enum: ProductCategory, example: ProductCategory.JEWELRY })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiPropertyOptional({ description: 'Prix du produit', example: 299.99 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999999.99)
  price?: number;

  @ApiPropertyOptional({ description: 'Devise', example: 'EUR', default: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'URL du modèle 3D', example: 'https://example.com/model.glb' })
  @IsUrl()
  @IsOptional()
  model3dUrl?: string;

  @ApiPropertyOptional({ description: 'URL de l\'asset de base', example: 'https://example.com/base.png' })
  @IsUrl()
  @IsOptional()
  baseAssetUrl?: string;

  @ApiPropertyOptional({ description: 'Tableau d\'URLs d\'images', example: ['https://example.com/image1.jpg'] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Produit actif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Produit public', default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles', example: { tags: ['premium', 'gold'] } })
  @IsOptional()
  metadata?: Record<string, any>;
}

