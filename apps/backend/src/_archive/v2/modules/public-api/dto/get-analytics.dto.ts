import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsMetric {
  DESIGNS = 'designs',
  ORDERS = 'orders',
  REVENUE = 'revenue',
  USERS = 'users',
}

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class GetAnalyticsDto {
  @ApiPropertyOptional({ 
    description: 'Start date for analytics (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for analytics (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Analytics metric to retrieve',
    enum: AnalyticsMetric,
    isArray: true
  })
  @IsEnum(AnalyticsMetric, { each: true })
  @IsOptional()
  metrics?: AnalyticsMetric[];

  @ApiPropertyOptional({ 
    description: 'Grouping period for analytics',
    enum: AnalyticsPeriod
  })
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod;

  @ApiPropertyOptional({ 
    description: 'Additional filters as JSON string'
  })
  @IsString()
  @IsOptional()
  filters?: string;
}


