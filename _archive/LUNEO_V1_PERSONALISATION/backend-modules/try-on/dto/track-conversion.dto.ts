import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConversionActionDto {
  ADD_TO_CART = 'ADD_TO_CART',
  PURCHASE = 'PURCHASE',
  WISHLIST = 'WISHLIST',
  SHARE = 'SHARE',
  CLICK_THROUGH = 'CLICK_THROUGH',
}

export class TrackConversionDto {
  @ApiProperty({ description: 'Try-on session external ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Product ID that was converted' })
  @IsString()
  productId: string;

  @ApiProperty({
    enum: ConversionActionDto,
    description: 'Conversion action type',
  })
  @IsEnum(ConversionActionDto)
  action: ConversionActionDto;

  @ApiProperty({ description: 'Source of conversion (widget, dashboard, embed, pixel)' })
  @IsString()
  source: string;

  @ApiPropertyOptional({ description: 'Attribution data (UTM params, referrer, etc.)' })
  @IsOptional()
  @IsObject()
  attributionData?: Record<string, unknown>;
}

export class AttributeRevenueDto {
  @ApiProperty({ description: 'Sale revenue amount' })
  @IsNumber()
  @Min(0)
  revenue: number;

  @ApiProperty({ description: 'ISO currency code (EUR, CHF, USD, etc.)' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'External order ID (Shopify, WooCommerce, etc.)' })
  @IsOptional()
  @IsString()
  externalOrderId?: string;
}
