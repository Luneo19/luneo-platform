import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  brandId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Price in cents', minimum: 0 })
  @IsNumber()
  @Min(0)
  priceCents: number;

  @ApiPropertyOptional({ description: 'Design ID' })
  @IsOptional()
  @IsString()
  designId?: string;

  @ApiPropertyOptional({ description: 'Customization ID' })
  @IsOptional()
  @IsString()
  customizationId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
