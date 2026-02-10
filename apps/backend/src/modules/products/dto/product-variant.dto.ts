import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty()
  @IsObject()
  attributes: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsObject() attributes?: Record<string, string>;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() compareAtPrice?: number;
  @IsOptional() @IsNumber() @Min(0) stock?: number;
  @IsOptional() @IsNumber() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class BulkCreateVariantsDto {
  @ApiProperty({ description: 'Attribute options for matrix generation', example: { color: ['Or Rose', 'Argent', 'Platine'], size: ['48', '50', '52', '54'] } })
  @IsObject()
  attributeOptions: Record<string, string[]>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  baseStock?: number;
}

export class UpdateStockDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock: number;
}
