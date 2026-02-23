import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebhookEvent {
  DESIGN_CREATED = 'design.created',
  DESIGN_UPDATED = 'design.updated',
  DESIGN_COMPLETED = 'design.completed',
  DESIGN_FAILED = 'design.failed',
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_PAID = 'order.paid',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  TEST = 'test',
}

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Webhook event type' })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({ description: 'Event data payload' })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Timestamp of the event' })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'Webhook signature for verification' })
  @IsString()
  @IsOptional()
  signature?: string;
}


