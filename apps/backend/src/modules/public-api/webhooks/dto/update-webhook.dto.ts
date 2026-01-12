import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { WebhookEvent } from '../../dto/webhook.dto';

export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'Webhook name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Webhook secret for signature' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ description: 'Events to subscribe to', type: [String], enum: WebhookEvent })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Whether webhook is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
