import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateIntegrationDto {
  @ApiProperty({ description: 'Integration name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


