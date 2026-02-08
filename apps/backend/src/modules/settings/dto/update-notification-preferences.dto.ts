import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable or disable general email notifications' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable or disable marketing/promotional emails' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  marketingEmails?: boolean;

  @ApiPropertyOptional({ description: 'Enable or disable order status update notifications' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  orderUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Enable or disable security-related alerts' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  securityAlerts?: boolean;
}
