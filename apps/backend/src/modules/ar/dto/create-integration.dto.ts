import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateIntegrationDto {
  @ApiProperty({ description: 'Platform name', example: 'shopify' })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Integration name', example: 'My Shopify Store' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'API Key', required: false })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ description: 'API Secret', required: false })
  @IsString()
  @IsOptional()
  apiSecret?: string;

  @ApiProperty({ description: 'Webhook URL', required: false })
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty({ description: 'Settings', required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiProperty({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Sync status', default: 'idle' })
  @IsString()
  @IsOptional()
  syncStatus?: 'idle' | 'syncing' | 'error';
}


