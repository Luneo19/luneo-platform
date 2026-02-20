import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrantSubscriptionDto {
  @ApiProperty({ description: 'Target plan ID (e.g. starter, professional, business)', example: 'professional' })
  @IsString()
  planId: string;

  @ApiProperty({ description: 'Number of months to grant free', example: 3 })
  @IsInt()
  @Min(1)
  @Max(24)
  months: number;

  @ApiPropertyOptional({ description: 'Reason for granting (audit trail)' })
  @IsString()
  reason?: string;
}
