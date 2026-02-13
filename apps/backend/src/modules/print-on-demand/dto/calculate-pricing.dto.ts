import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingItemDto } from './pricing-item.dto';

export class CalculatePricingDto {
  @ApiProperty({ enum: ['printful', 'printify', 'gelato'] })
  @IsString()
  provider: string;

  @ApiProperty({ type: [PricingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingItemDto)
  items: PricingItemDto[];

  @ApiPropertyOptional({ description: 'Brand markup percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  brandMarginPercent?: number;
}
