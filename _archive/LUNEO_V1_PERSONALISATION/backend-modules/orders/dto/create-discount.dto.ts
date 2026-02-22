import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount code (unique)', example: 'WELCOME10' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Discount type', enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Value: percentage (0-100) or fixed amount in cents', example: 10 })
  @IsInt()
  @Min(0)
  @Max(100_00_00) // cap for fixed cents
  value: number;

  @ApiPropertyOptional({ description: 'Minimum purchase amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchaseCents?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountCents?: number;

  @ApiPropertyOptional({ description: 'Valid from (ISO date string)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until (ISO date string)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Maximum number of usages' })
  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Whether the discount is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Brand ID (restrict to a brand)' })
  @IsOptional()
  @IsString()
  brandId?: string;
}
