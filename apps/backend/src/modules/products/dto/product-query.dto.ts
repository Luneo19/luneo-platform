import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  limit?: number;
}





