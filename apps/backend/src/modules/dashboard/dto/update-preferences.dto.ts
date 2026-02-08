import { IsObject, IsArray, IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  widgetOverrides?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sidebarOrder?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pinnedModules?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastVisitedModule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dashboardTheme?: string;
}
