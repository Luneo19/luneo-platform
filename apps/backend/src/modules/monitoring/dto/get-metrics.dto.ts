import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MetricPeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class GetMetricsDto {
  @ApiPropertyOptional({ description: 'Service name (database, cache, storage, etc.)' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Metric name (cpu_usage, memory_usage, etc.)' })
  @IsOptional()
  @IsString()
  metric?: string;

  @ApiPropertyOptional({ enum: MetricPeriod, description: 'Time period for aggregation' })
  @IsOptional()
  @IsEnum(MetricPeriod)
  period?: MetricPeriod;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit number of results', minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

