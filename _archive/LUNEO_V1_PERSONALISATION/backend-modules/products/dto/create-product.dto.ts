import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsIn, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(255, { message: 'Product name must not exceed 255 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'SKU must not exceed 100 characters' })
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: string;
}





