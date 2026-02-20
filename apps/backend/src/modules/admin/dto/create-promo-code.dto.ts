import { IsString, IsOptional, IsNumber, Min, Max, IsIn, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Promo code string (e.g. WELCOME20)', example: 'WELCOME20' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Percentage off (0-100). Use either percentOff or amountOff.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentOff?: number;

  @ApiPropertyOptional({ description: 'Fixed amount off in cents. Use with currency.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOff?: number;

  @ApiPropertyOptional({ description: 'Currency for amountOff (e.g. eur)', example: 'eur' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Duration of the discount', enum: ['once', 'repeating', 'forever'] })
  @IsString()
  @IsIn(['once', 'repeating', 'forever'])
  duration: 'once' | 'repeating' | 'forever';

  @ApiPropertyOptional({ description: 'Number of months when duration is repeating' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  durationInMonths?: number;

  @ApiPropertyOptional({ description: 'Maximum number of times the code can be redeemed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Plan IDs this promo applies to (optional restriction)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plans?: string[];
}
