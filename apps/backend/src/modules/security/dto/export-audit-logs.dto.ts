import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { AuditEventType } from '../services/audit-logs.service';

/**
 * DTO for exporting audit logs to CSV
 * Matches the filters expected by AuditLogsService.exportToCSV
 */
export class ExportAuditLogsDto {
  @ApiPropertyOptional({
    description: 'User ID filter',
    example: 'user_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Brand ID filter',
    example: 'brand_123',
  })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Event type filter',
    enum: AuditEventType,
  })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Resource type filter',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Resource ID filter',
    example: 'resource_123',
  })
  @IsOptional()
  @IsString()
  resourceId?: string;
}
