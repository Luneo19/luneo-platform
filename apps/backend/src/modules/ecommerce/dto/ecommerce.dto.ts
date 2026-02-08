import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** POST /ecommerce/shopify/install */
export class ShopifyInstallDto {
  @ApiProperty({ description: 'Shop domain (e.g. myshop.myshopify.com)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  shop: string;

  @ApiProperty({ description: 'Brand ID to attach the integration to' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  brandId: string;
}

/** POST /ecommerce/woocommerce/connect */
export class WooCommerceConnectDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  brandId: string;

  @ApiProperty({ description: 'WooCommerce site URL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  siteUrl: string;

  @ApiProperty({ description: 'WooCommerce consumer key' })
  @IsString()
  @IsNotEmpty()
  consumerKey: string;

  @ApiProperty({ description: 'WooCommerce consumer secret' })
  @IsString()
  @IsNotEmpty()
  consumerSecret: string;
}

/** POST /ecommerce/magento/connect */
export class MagentoConnectDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  brandId: string;

  @ApiProperty({ description: 'Magento store URL' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  storeUrl: string;

  @ApiProperty({ description: 'Magento API token' })
  @IsString()
  @IsNotEmpty()
  apiToken: string;
}

/** POST /ecommerce/integrations/:integrationId/mappings */
export class CreateProductMappingDto {
  @ApiProperty({ description: 'Luneo product ID' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  luneoProductId: string;

  @ApiProperty({ description: 'External platform product ID' })
  @IsString()
  @IsNotEmpty()
  externalProductId: string;

  @ApiProperty({ description: 'External SKU' })
  @IsString()
  @IsNotEmpty()
  externalSku: string;
}

/** Sync job type */
export enum SyncJobType {
  PRODUCT = 'product',
  ORDER = 'order',
  INVENTORY = 'inventory',
  FULL = 'full',
}

/** Sync direction */
export enum SyncDirection {
  IMPORT = 'import',
  EXPORT = 'export',
  BIDIRECTIONAL = 'bidirectional',
}

/** POST /ecommerce/sync/queue */
export class QueueSyncJobDto {
  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  @IsNotEmpty()
  integrationId: string;

  @ApiProperty({ description: 'Type of sync job', enum: SyncJobType })
  @IsEnum(SyncJobType)
  type: SyncJobType;

  @ApiPropertyOptional({ description: 'Sync direction', enum: SyncDirection })
  @IsEnum(SyncDirection)
  @IsOptional()
  direction?: SyncDirection;

  @ApiPropertyOptional({ description: 'Product IDs to sync' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Order IDs to sync' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orderIds?: string[];

  @ApiPropertyOptional({ description: 'Job priority (higher = more priority)' })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Delay in ms before processing' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  delay?: number;
}

/** Recurring sync interval */
export enum SyncInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

/** POST /ecommerce/sync/schedule */
export class ScheduleRecurringSyncDto {
  @ApiProperty({ description: 'Integration ID' })
  @IsString()
  @IsNotEmpty()
  integrationId: string;

  @ApiProperty({ description: 'Type of sync', enum: SyncJobType })
  @IsEnum(SyncJobType)
  type: SyncJobType;

  @ApiProperty({ description: 'Recurrence interval', enum: SyncInterval })
  @IsEnum(SyncInterval)
  interval: SyncInterval;

  @ApiPropertyOptional({ description: 'Sync direction', enum: SyncDirection })
  @IsEnum(SyncDirection)
  @IsOptional()
  direction?: SyncDirection;
}
