import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { WebhookEvent } from '../../dto/webhook.dto';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Webhook URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Webhook secret for signature' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({ description: 'Events to subscribe to', type: [String], enum: WebhookEvent })
  @IsArray()
  @IsString({ each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Whether webhook is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
