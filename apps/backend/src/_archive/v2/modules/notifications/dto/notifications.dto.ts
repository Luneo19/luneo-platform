import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PushSubscriptionKeys {
  @ApiProperty()
  @IsString()
  p256dh: string;

  @ApiProperty()
  @IsString()
  auth: string;
}

class PushSubscription {
  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushSubscriptionKeys)
  keys: PushSubscriptionKeys;
}

class PushPayload {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class SubscribePushDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushSubscription)
  subscription: PushSubscription;
}

export class UnsubscribePushDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  endpoint: string;
}

export class SendPushNotificationDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PushSubscription)
  subscription: PushSubscription;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushPayload)
  payload: PushPayload;
}

export class SendPushToUserDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushPayload)
  payload: PushPayload;
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
