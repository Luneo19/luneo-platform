import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

/**
 * DTO for scheduling data retention cleanup
 */
export class ScheduleDataRetentionDto {
  @ApiPropertyOptional({
    description: 'Number of days to retain data',
    example: 365,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;
}
