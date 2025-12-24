import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour les webhooks Shopify
 * Shopify envoie différents types de payloads selon le topic
 */
export class ShopifyWebhookDto {
  @ApiProperty({ description: 'Shopify webhook topic (e.g., orders/create, products/update)' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Shop domain (e.g., myshop.myshopify.com)' })
  @IsString()
  shop: string;

  @ApiProperty({ description: 'Webhook payload (varies by topic)' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'HMAC signature for verification' })
  @IsString()
  @IsOptional()
  hmac?: string;
}

/**
 * DTO pour les webhooks WooCommerce
 */
export class WooCommerceWebhookDto {
  @ApiProperty({ description: 'WooCommerce webhook topic' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Webhook payload' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Webhook signature for verification' })
  @IsString()
  @IsOptional()
  signature?: string;
}

/**
 * DTO pour les options de synchronisation
 */
export class SyncOptionsDto {
  @ApiPropertyOptional({ description: 'Force full sync' })
  force?: boolean;

  @ApiPropertyOptional({ description: 'Sync direction (import, export, bidirectional)' })
  direction?: 'import' | 'export' | 'bidirectional';

  @ApiPropertyOptional({ description: 'Include images in sync' })
  includeImages?: boolean;

  @ApiPropertyOptional({ description: 'Include inventory in sync' })
  includeInventory?: boolean;

  @ApiPropertyOptional({ description: 'Include orders in sync' })
  includeOrders?: boolean;

  @ApiPropertyOptional({ description: 'Additional sync options' })
  options?: Record<string, unknown>;
}

/**
 * DTO pour la synchronisation de produits
 */
export class SyncProductsDto {
  @ApiPropertyOptional({ description: 'Specific product IDs to sync' })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Sync options' })
  @ValidateNested()
  @Type(() => SyncOptionsDto)
  @IsOptional()
  options?: SyncOptionsDto;
}

/**
 * DTO pour la synchronisation de commandes
 */
export class SyncOrdersDto {
  @ApiPropertyOptional({ description: 'Specific order IDs to sync' })
  orderIds?: string[];

  @ApiPropertyOptional({ description: 'Sync options' })
  @ValidateNested()
  @Type(() => SyncOptionsDto)
  @IsOptional()
  options?: SyncOptionsDto;
}

/**
 * DTO pour la mise à jour d'intégration
 */
export class UpdateIntegrationDto {
  @ApiPropertyOptional({ description: 'Integration status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Integration configuration' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;
}

