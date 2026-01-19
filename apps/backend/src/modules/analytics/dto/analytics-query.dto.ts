import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeRange {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Time range',
    enum: TimeRange,
    required: false,
    default: TimeRange.LAST_30_DAYS,
  })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.LAST_30_DAYS;

  @ApiProperty({
    description: 'Start date (required if timeRange is custom)',
    required: false,
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date (required if timeRange is custom)',
    required: false,
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by event types',
    required: false,
    type: [String],
    example: ['page_view', 'conversion'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  @ApiProperty({
    description: 'Project IDs to filter',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectIds?: string[];
}
