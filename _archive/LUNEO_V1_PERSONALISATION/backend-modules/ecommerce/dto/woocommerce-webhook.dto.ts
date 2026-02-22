import { IsObject, IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Note: snake_case properties (e.g. line_items, meta_data) maintained for WooCommerce API contract */
export class WooCommerceWebhookPayloadDto {
  @ApiPropertyOptional({ description: 'WooCommerce resource ID' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional({ description: 'Order status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Order total' })
  @IsString()
  @IsOptional()
  total?: string;

  @ApiPropertyOptional({ description: 'Order currency' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Line items' })
  @IsOptional()
  @IsArray()
  line_items?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Billing details' })
  @IsObject()
  @IsOptional()
  billing?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Shipping details' })
  @IsObject()
  @IsOptional()
  shipping?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  meta_data?: Record<string, unknown>[];
}
