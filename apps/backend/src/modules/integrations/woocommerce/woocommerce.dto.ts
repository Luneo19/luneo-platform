/**
 * DTOs for WooCommerce integration endpoints
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsArray, MinLength } from 'class-validator';

export class WooCommerceConnectDto {
  @ApiProperty({ description: 'WooCommerce site URL (e.g. https://myshop.com)' })
  @IsUrl()
  siteUrl: string;

  @ApiProperty({ description: 'WooCommerce REST API consumer key' })
  @IsString()
  @MinLength(1)
  consumerKey: string;

  @ApiProperty({ description: 'WooCommerce REST API consumer secret' })
  @IsString()
  @MinLength(1)
  consumerSecret: string;
}

export class WooCommercePushProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Product description (HTML)' })
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsString()
  short_description?: string;

  @ApiPropertyOptional({ description: 'SKU' })
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'Regular price' })
  @IsString()
  regular_price: string;

  @ApiPropertyOptional({ description: 'Sale price' })
  @IsString()
  sale_price?: string;

  @ApiPropertyOptional({ description: 'Product type: simple, variable, etc.' })
  @IsString()
  type?: 'simple' | 'variable' | 'grouped' | 'external';

  @ApiPropertyOptional({ description: 'Status: publish, draft, pending, private' })
  @IsString()
  status?: 'publish' | 'draft' | 'pending' | 'private';

  @ApiPropertyOptional({ description: 'Image URLs' })
  @IsArray()
  images?: Array<{ src: string; alt?: string }>;

  @ApiPropertyOptional({ description: 'Luneo product ID to link mapping' })
  @IsString()
  luneoProductId?: string;


}
