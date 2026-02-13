import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PricingItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit price in cents; if omitted, fetched from provider' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  unitPriceCents?: number;
}
