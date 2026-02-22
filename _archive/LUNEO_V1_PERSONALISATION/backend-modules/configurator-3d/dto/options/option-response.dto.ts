import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Configurator3DOptionType, PricingType } from '@prisma/client';

export class OptionResponseDto {
  @ApiProperty({ description: 'Option ID' })
  id: string;

  @ApiProperty({ description: 'Configuration ID' })
  configurationId: string;

  @ApiPropertyOptional({ description: 'Component ID' })
  componentId?: string | null;

  @ApiProperty({ description: 'Option name' })
  name: string;

  @ApiPropertyOptional({ description: 'Label' })
  label?: string | null;

  @ApiPropertyOptional({ description: 'SKU' })
  sku?: string | null;

  @ApiProperty({ description: 'Option type', enum: Configurator3DOptionType })
  type: Configurator3DOptionType;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Value' })
  value?: string | null;

  @ApiPropertyOptional({ description: 'Values (JSON)' })
  values?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Default value' })
  defaultValue?: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Is default' })
  isDefault: boolean;

  @ApiProperty({ description: 'Is enabled' })
  isEnabled: boolean;

  @ApiProperty({ description: 'Is visible' })
  isVisible: boolean;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  previewImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Swatch image URL' })
  swatchImageUrl?: string | null;

  @ApiProperty({ description: 'Price delta (cents)' })
  priceDelta: number;

  @ApiProperty({ description: 'Pricing type', enum: PricingType })
  pricingType: PricingType;

  @ApiProperty({ description: 'Price modifier' })
  priceModifier: number;

  @ApiPropertyOptional({ description: 'Price formula' })
  priceFormula?: string | null;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'In stock' })
  inStock: boolean;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  stockQuantity?: number | null;

  @ApiPropertyOptional({ description: 'Lead time in days' })
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
