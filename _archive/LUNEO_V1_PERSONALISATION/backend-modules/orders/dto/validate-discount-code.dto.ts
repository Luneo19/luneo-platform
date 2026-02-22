import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateDiscountCodeDto {
  @ApiProperty({ description: 'Discount code to validate' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Subtotal in cents for validation' })
  @IsOptional()
  @IsNumber()
  subtotalCents?: number;

  @ApiPropertyOptional({ description: 'Brand ID for scoped discounts' })
  @IsOptional()
  @IsString()
  brandId?: string;
}
