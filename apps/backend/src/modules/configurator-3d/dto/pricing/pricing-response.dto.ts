import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =============================================================================
// Price breakdown item
// =============================================================================

export class PriceBreakdownItemDto {
  @ApiProperty({ description: 'Component/option name' })
  name: string;

  @ApiPropertyOptional({ description: 'Option ID' })
  optionId?: string;

  @ApiPropertyOptional({ description: 'Component ID' })
  componentId?: string;

  @ApiProperty({ description: 'Price in cents' })
  price: number;

  @ApiPropertyOptional({ description: 'Quantity' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Price type (base, option, etc.)' })
  type?: string;
}

// =============================================================================
// Pricing response
// =============================================================================

export class PricingResponseDto {
  @ApiProperty({ description: 'Base price in cents' })
  basePrice: number;

  @ApiProperty({ description: 'Options total in cents' })
  optionsTotal: number;

  @ApiProperty({ description: 'Subtotal in cents' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount in cents' })
  tax: number;

  @ApiProperty({ description: 'Total price in cents' })
  total: number;

  @ApiProperty({ description: 'Currency code', example: 'EUR' })
  currency: string;

  @ApiProperty({
    description: 'Price breakdown items',
    type: [PriceBreakdownItemDto],
  })
  items: PriceBreakdownItemDto[];
}

// =============================================================================
// Price breakdown (all option prices)
// =============================================================================

export class PriceBreakdownDto {
  @ApiProperty({ description: 'Base price in cents' })
  basePrice: number;

  @ApiProperty({
    description: 'Option prices by component/option',
    example: { 'option-1': 5000, 'option-2': 1000 },
  })
  options: Record<string, number>;

  @ApiProperty({ description: 'Subtotal in cents' })
  subtotal: number;

  @ApiProperty({ description: 'Tax in cents' })
  tax: number;

  @ApiProperty({ description: 'Total in cents' })
  total: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;
}

// =============================================================================
// Update pricing settings
// =============================================================================

export class UpdatePricingSettingsDto {
  @ApiPropertyOptional({ description: 'Base price in cents' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217)',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a valid ISO 4217 code' })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax rate (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Show price in configurator' })
  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;

  @ApiPropertyOptional({ description: 'Enable dynamic pricing' })
  @IsOptional()
  @IsBoolean()
  enableDynamicPricing?: boolean;
}
