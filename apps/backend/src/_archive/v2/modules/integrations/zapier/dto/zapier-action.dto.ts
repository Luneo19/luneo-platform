import { IsString, IsOptional, IsObject, IsNumber, IsUUID, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ZapierCreateDesignDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'AI prompt for the design' })
  @IsString()
  @MaxLength(2000)
  prompt: string;

  @ApiPropertyOptional({ description: 'Design name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Customization data' })
  @IsObject()
  @IsOptional()
  customizationData?: Record<string, unknown>;
}

export class ZapierUpdateProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Price (number)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  isActive?: boolean;
}
