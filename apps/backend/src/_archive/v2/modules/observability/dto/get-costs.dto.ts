import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCostDashboardDto {
  @ApiPropertyOptional({ description: 'Period', enum: ['day', 'week', 'month'], default: 'month' })
  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  period?: 'day' | 'week' | 'month' = 'month';

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class GetTenantCostDto {
  @ApiPropertyOptional({ description: 'Period', enum: ['day', 'week', 'month'], default: 'month' })
  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  period?: 'day' | 'week' | 'month' = 'month';
}

































