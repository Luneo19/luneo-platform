/**
 * DTOs for AR Analytics API
 */

import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Period: 7d, 30d, 90d', enum: ['7d', '30d', '90d'] })
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  period?: AnalyticsPeriod;

  @ApiPropertyOptional({ description: 'Project ID (optional, for project-scoped analytics)' })
  @IsOptional()
  @IsString()
  projectId?: string;
}
