import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a creator payout
 * Matches CreatePayoutData interface
 */
export class CreateCreatorPayoutDto {
  @ApiProperty({
    description: 'Period start date (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @ApiProperty({
    description: 'Period end date (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;
}
