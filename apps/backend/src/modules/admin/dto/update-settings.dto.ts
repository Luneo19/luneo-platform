import { IsOptional, IsString, IsBoolean, IsNumber, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Platform settings update.
 * Only known keys are applied; unknown keys are ignored by the service.
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enforce2FA?: boolean;
  @ApiPropertyOptional() @IsOptional() sessionTimeout?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() ipWhitelist?: string[];
  @ApiPropertyOptional() @IsOptional() @IsObject() emailNotifications?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsObject() webhookAlerts?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() platformName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() defaultLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
}
