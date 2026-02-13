import { IsBoolean, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class EmailPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  orders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  designs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;
}

class PushPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  orders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  designs?: boolean;
}

class InAppPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  orders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  designs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  system?: boolean;
}

/**
 * Nested notification preferences matching frontend NotificationPreference type.
 * Stored as-is in User.notificationPreferences JSON.
 */
export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmailPreferencesDto)
  email?: EmailPreferencesDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PushPreferencesDto)
  push?: PushPreferencesDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InAppPreferencesDto)
  inApp?: InAppPreferencesDto;
}
