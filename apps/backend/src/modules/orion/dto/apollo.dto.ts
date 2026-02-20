import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetIncidentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by incident status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GetMetricsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 168, default: 24, description: 'Lookback window in hours' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours?: number;
}
