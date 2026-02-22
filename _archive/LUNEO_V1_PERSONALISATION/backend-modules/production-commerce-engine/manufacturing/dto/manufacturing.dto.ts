import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  IsIn,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POD_PROVIDERS } from '../../pce.constants';

/** Single line item for production (product + quantity + options) */
export class ProductionItemDto {
  @ApiProperty({ description: 'Product/variant identifier from provider catalog' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Variant/sku identifier' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Print file URLs or design references' })
  @IsOptional()
  @IsObject()
  files?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

/** Shipping address for production order */
export class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

/** Request body for getting quotes */
export class GetQuotesDto {
  @ApiProperty({ type: [ProductionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionItemDto)
  items: ProductionItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Preferred provider ID to quote from' })
  @IsOptional()
  @IsString()
  providerId?: string;
}

/** Request body for creating a production order */
export class CreateProductionOrderDto {
  @ApiProperty({ description: 'Commerce order ID this production is for' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ type: [ProductionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionItemDto)
  items: ProductionItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Specific provider ID; if omitted, optimal provider is selected' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/** Query params for listing production orders */
export class ListProductionOrdersQueryDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

/** Request body for registering a POD provider */
export class RegisterProviderDto {
  @ApiProperty({ description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique slug (e.g. printful, gelato)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ enum: POD_PROVIDERS })
  @IsString()
  @IsIn(POD_PROVIDERS)
  providerType: string;

  @ApiProperty({ description: 'API credentials (e.g. apiKey)' })
  @IsObject()
  credentials: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0, description: 'Selection priority (higher = preferred)' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Supported product types, regions, etc.' })
  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/** Quality rejection payload */
export class RejectQualityDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
